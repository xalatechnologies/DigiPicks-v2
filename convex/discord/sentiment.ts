import { v } from 'convex/values';
import { action, internalAction, internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import { requireCreatorOwnership } from '../shared/permissions';

// =============================================================================
// Discord sentiment summarization (PRD M20).
//
// Reads recent `discordMessageImports` rows per integration (last 6h window),
// asks Anthropic Haiku for: discussion summary, heatScore, topThemes (≤5),
// avgSentiment ∈ [-1, 1]. Persists to `discordSentimentSummaries`.
//
// Quiet no-op when ANTHROPIC_API_KEY is missing — matches `ai.analyzePick`.
// =============================================================================

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const WINDOW_MS = 6 * 60 * 60 * 1000;

const SUMMARY_SYSTEM_PROMPT = [
  'You are a community sentiment analyst. Given a list of one-line message',
  'summaries from a Discord channel, output ONLY a single JSON object:',
  '{',
  '  "summary": "<2-3 sentences, neutral, no quotes, no names>",',
  '  "avgSentiment": <number in [-1, 1]>,',
  '  "heatScore": <number ≥ 0; volume × |sentiment| × novelty>,',
  '  "topThemes": [<≤5 short keyword/phrase strings>]',
  '}',
  'No markdown, no commentary, no prose around the JSON.',
].join('\n');

interface SentimentResult {
  summary: string;
  avgSentiment: number;
  heatScore: number;
  topThemes: string[];
}

function parseSentiment(text: string): SentimentResult | null {
  // Tolerate code fences / preamble.
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1)) as Partial<SentimentResult>;
    if (typeof obj.summary !== 'string') return null;
    const avg = typeof obj.avgSentiment === 'number' ? obj.avgSentiment : 0;
    const heat = typeof obj.heatScore === 'number' ? obj.heatScore : 0;
    const themes = Array.isArray(obj.topThemes)
      ? obj.topThemes.filter((t): t is string => typeof t === 'string').slice(0, 5)
      : [];
    return {
      summary: obj.summary,
      avgSentiment: Math.max(-1, Math.min(1, avg)),
      heatScore: Math.max(0, heat),
      topThemes: themes,
    };
  } catch {
    return null;
  }
}

// ─── Internal queries / mutations ───────────────────────────────────────────

interface PerIntegrationBatch {
  integrationId: Id<'discordIntegrations'>;
  channelId: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  windowStart: number;
  windowEnd: number;
  summaries: string[];
  messageCount: number;
}

export const _recentImportsForSummary = internalQuery({
  args: {},
  handler: async (ctx): Promise<PerIntegrationBatch[]> => {
    const cutoff = Date.now() - WINDOW_MS;
    const rows = await ctx.db.query('discordMessageImports').order('desc').take(2000);
    const recent = rows.filter((r) => r.importedAt >= cutoff);
    const grouped = new Map<string, Doc<'discordMessageImports'>[]>();
    for (const r of recent) {
      const key = `${r.integrationId}|${r.channelId}|${r.linkedEntityType ?? ''}|${r.linkedEntityId ?? ''}`;
      const arr = grouped.get(key) ?? [];
      arr.push(r);
      grouped.set(key, arr);
    }
    const out: PerIntegrationBatch[] = [];
    for (const [, arr] of grouped) {
      if (arr.length === 0) continue;
      const summaries = arr
        .map((r) => r.contentSummary)
        .filter((s): s is string => typeof s === 'string' && s.length > 0)
        .slice(0, 200);
      if (summaries.length < 3) continue; // not enough signal
      out.push({
        integrationId: arr[0].integrationId,
        channelId: arr[0].channelId,
        linkedEntityType: arr[0].linkedEntityType,
        linkedEntityId: arr[0].linkedEntityId,
        windowStart: cutoff,
        windowEnd: Date.now(),
        summaries,
        messageCount: arr.length,
      });
    }
    return out;
  },
});

export const _writeSummary = internalMutation({
  args: {
    integrationId: v.id('discordIntegrations'),
    channelId: v.string(),
    linkedEntityType: v.optional(v.string()),
    linkedEntityId: v.optional(v.string()),
    windowStart: v.number(),
    windowEnd: v.number(),
    messageCount: v.number(),
    summary: v.string(),
    avgSentiment: v.number(),
    heatScore: v.number(),
    topThemes: v.array(v.string()),
    aiModel: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert('discordSentimentSummaries', {
      integrationId: args.integrationId,
      channelId: args.channelId,
      linkedEntityType: args.linkedEntityType,
      linkedEntityId: args.linkedEntityId,
      windowStart: args.windowStart,
      windowEnd: args.windowEnd,
      messageCount: args.messageCount,
      avgSentiment: args.avgSentiment,
      heatScore: args.heatScore,
      topThemes: args.topThemes,
      summary: args.summary,
      aiModel: args.aiModel,
      generatedAt: now,
      createdAt: now,
    });
  },
});

async function computeSummary(
  apiKey: string,
  batch: PerIntegrationBatch,
): Promise<SentimentResult | null> {
  const userPrompt = [
    `Channel id: ${batch.channelId}`,
    `Window: last ${Math.round(WINDOW_MS / (60 * 60 * 1000))}h · ${batch.summaries.length} messages`,
    '',
    'Message summaries:',
    ...batch.summaries.map((s, i) => `${i + 1}. ${s}`),
  ].join('\n');

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 800,
      system: [
        {
          type: 'text',
          text: SUMMARY_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn('sentiment summary anthropic error:', res.status, text.slice(0, 200));
    return null;
  }
  const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = json.content?.find((b) => b.type === 'text')?.text ?? '';
  return parseSentiment(text);
}

/**
 * Cron entrypoint — recompute sentiment summaries across all integrations
 * with imports in the last 6h. Quiet no-op without `ANTHROPIC_API_KEY`.
 */
export const recomputeRecent = internalAction({
  args: {},
  handler: async (ctx): Promise<{ skipped?: string; written?: number }> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { skipped: 'no_anthropic_key' };

    const batches: PerIntegrationBatch[] = await ctx.runQuery(
      internal.discord.sentiment._recentImportsForSummary,
      {},
    );
    if (batches.length === 0) return { written: 0 };

    let written = 0;
    for (const batch of batches) {
      try {
        const result = await computeSummary(apiKey, batch);
        if (!result) continue;
        await ctx.runMutation(internal.discord.sentiment._writeSummary, {
          integrationId: batch.integrationId,
          channelId: batch.channelId,
          linkedEntityType: batch.linkedEntityType,
          linkedEntityId: batch.linkedEntityId,
          windowStart: batch.windowStart,
          windowEnd: batch.windowEnd,
          messageCount: batch.messageCount,
          summary: result.summary,
          avgSentiment: result.avgSentiment,
          heatScore: result.heatScore,
          topThemes: result.topThemes,
          aiModel: ANTHROPIC_MODEL,
        });
        written++;
      } catch (err) {
        console.warn('sentiment compute failed:', err instanceof Error ? err.message : err);
      }
    }
    return { written };
  },
});

/**
 * Manual trigger — creator-only. Forces a recompute across the calling
 * creator's integrations. Returns the number of summary rows written.
 */
export const generateDiscussionSummary = action({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args): Promise<{ written: number; skipped?: string }> => {
    const me = await ctx.runQuery(internal.discord.sentiment._meForGenerate, {
      creatorId: args.creatorId,
    });
    if (!me.allowed) throw new Error('Forbidden');
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { written: 0, skipped: 'no_anthropic_key' };

    // For the manual trigger we still pull from the global window — the
    // creator-scoped filter happens at the query layer below.
    const batches: PerIntegrationBatch[] = await ctx.runQuery(
      internal.discord.sentiment._recentImportsForCreator,
      { creatorId: args.creatorId },
    );
    let written = 0;
    for (const batch of batches) {
      try {
        const result = await computeSummary(apiKey, batch);
        if (!result) continue;
        await ctx.runMutation(internal.discord.sentiment._writeSummary, {
          integrationId: batch.integrationId,
          channelId: batch.channelId,
          linkedEntityType: batch.linkedEntityType,
          linkedEntityId: batch.linkedEntityId,
          windowStart: batch.windowStart,
          windowEnd: batch.windowEnd,
          messageCount: batch.messageCount,
          summary: result.summary,
          avgSentiment: result.avgSentiment,
          heatScore: result.heatScore,
          topThemes: result.topThemes,
          aiModel: ANTHROPIC_MODEL,
        });
        written++;
      } catch (err) {
        console.warn('manual sentiment compute failed:', err instanceof Error ? err.message : err);
      }
    }
    return { written };
  },
});

/** Internal: ownership precheck for the public `generateDiscussionSummary`. */
export const _meForGenerate = internalQuery({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args): Promise<{ allowed: boolean }> => {
    try {
      await requireCreatorOwnership(ctx, args.creatorId);
      return { allowed: true };
    } catch {
      return { allowed: false };
    }
  },
});

/** Internal: same shape as `_recentImportsForSummary` but scoped to a creator. */
export const _recentImportsForCreator = internalQuery({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args): Promise<PerIntegrationBatch[]> => {
    const cutoff = Date.now() - WINDOW_MS;
    const integrations = await ctx.db
      .query('discordIntegrations')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .take(20);
    const out: PerIntegrationBatch[] = [];
    for (const integ of integrations) {
      const rows = await ctx.db
        .query('discordMessageImports')
        .withIndex('by_integration', (q) => q.eq('integrationId', integ._id))
        .order('desc')
        .take(500);
      const recent = rows.filter((r) => r.importedAt >= cutoff);
      const grouped = new Map<string, Doc<'discordMessageImports'>[]>();
      for (const r of recent) {
        const key = `${r.channelId}|${r.linkedEntityType ?? ''}|${r.linkedEntityId ?? ''}`;
        const arr = grouped.get(key) ?? [];
        arr.push(r);
        grouped.set(key, arr);
      }
      for (const [, arr] of grouped) {
        const summaries = arr
          .map((r) => r.contentSummary)
          .filter((s): s is string => typeof s === 'string' && s.length > 0)
          .slice(0, 200);
        if (summaries.length < 3) continue;
        out.push({
          integrationId: integ._id,
          channelId: arr[0].channelId,
          linkedEntityType: arr[0].linkedEntityType,
          linkedEntityId: arr[0].linkedEntityId,
          windowStart: cutoff,
          windowEnd: Date.now(),
          summaries,
          messageCount: arr.length,
        });
      }
    }
    return out;
  },
});
