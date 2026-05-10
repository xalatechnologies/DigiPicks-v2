import { v } from 'convex/values';
import { action, internalAction, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { parseAnalysis, type AnalysisResult } from './shared/aiParse';
import { getCurrentUser } from './shared/permissions';
import { rateLimiter } from './shared/rateLimit';
import type { Doc } from './_generated/dataModel';

// =============================================================================
// AI Intelligence Engine (PRD M9, Phase 5) — Anthropic Claude.
//
// V8 runtime, raw fetch (no SDK).
//
// Required env var (set via `npx convex env set`):
//   - ANTHROPIC_API_KEY    sk-ant-...
//
// Default model: claude-haiku-4-5-20251001 (cost-efficient summarization).
// Override per-call via the `model` arg.
// =============================================================================

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = [
  'You are a sports intelligence analyst at DigiPicks. You read a creator-published pick',
  'and produce a tight, neutral analysis.',
  '',
  'Return ONLY a single JSON object with these exact keys, no markdown, no commentary:',
  '{',
  '  "summary": "<1 sentence, ≤140 chars, plain language, no hype>",',
  '  "confidence": <integer 0-100, your independent confidence in the bet thesis>,',
  '  "reasoning": "<2-3 sentences citing the key edge, risk, or context the pick rests on>"',
  '}',
  '',
  'Rules:',
  '- Be skeptical and grounded — confidence > 75 only if the reasoning is clearly strong.',
  '- Never recommend gambling. State analysis as analysis, not advice.',
  '- If the pick body is thin or unsupported, lower confidence and say so in reasoning.',
  '- Output strict JSON only. No prose before or after.',
].join('\n');

interface AnthropicMessageResponse {
  content?: Array<{ type: string; text?: string }>;
  model?: string;
  error?: { message?: string };
}

function buildPickPrompt(pick: {
  title: string;
  sport: string;
  league: string;
  eventName: string;
  eventTime: string;
  market: string;
  selection: string;
  odds: string;
  units: string;
  confidence: string;
  body?: string;
  teaser?: string;
}): string {
  return [
    `Title: ${pick.title}`,
    `Sport / League: ${pick.sport} / ${pick.league}`,
    `Event: ${pick.eventName} (${pick.eventTime})`,
    `Market: ${pick.market}`,
    `Selection: ${pick.selection}`,
    `Odds: ${pick.odds}`,
    `Stake (units): ${pick.units}`,
    `Creator confidence: ${pick.confidence}`,
    pick.body ? `\nCreator analysis:\n${pick.body}` : '',
    pick.teaser ? `\nTeaser:\n${pick.teaser}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export const _pickForAi = internalQuery({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.pickId);
  },
});

export const _meForSuggest = internalQuery({
  args: {},
  handler: async (ctx): Promise<Doc<'users'> | null> => {
    return await getCurrentUser(ctx);
  },
});

/**
 * Generate an AI summary + confidence + reasoning for a pick and persist
 * the result. Idempotent at the data layer — a second analysis just
 * overwrites the previous fields. Safe to retry on transient failures.
 */
export const analyzePick = internalAction({
  args: {
    pickId: v.id('picks'),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<(AnalysisResult & { model: string }) | { skipped: true }> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Quiet no-op when the key isn't configured (dev / tests). Matches
      // the pattern used by oddsApi / streams / push / telegram so missing
      // creds never blow up the scheduler chain picks.create depends on.
      return { skipped: true };
    }

    const pick = await ctx.runQuery(internal.ai._pickForAi, {
      pickId: args.pickId,
    });
    if (!pick) throw new Error('Pick not found');

    const model = args.model ?? DEFAULT_MODEL;
    const userPrompt = buildPickPrompt(pick);

    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        // Prompt-cached system block — same content as suggestPick so both
        // actions share the cache entry and post-publish analyses get cache
        // hits instead of re-billing the system prompt every call.
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const body = (await res.json()) as AnthropicMessageResponse;
    if (!res.ok) {
      const msg = body.error?.message ?? `Anthropic API error (${res.status})`;
      throw new Error(msg);
    }

    const text = body.content?.find((b) => b.type === 'text')?.text ?? '';
    const result = parseAnalysis(text);

    await ctx.runMutation(internal.picks._setAiAnalysis, {
      pickId: args.pickId,
      summary: result.summary,
      confidence: result.confidence,
      reasoning: result.reasoning,
      model,
    });

    // M20 — Discord ai_insight fanout. Fire-and-forget; the action logs
    // per-channel results and never throws back into the analysis chain.
    await ctx.scheduler.runAfter(0, internal.discord.delivery.fanoutOutbound, {
      creatorId: pick.creatorId,
      eventType: 'ai_insight',
      payload: {
        title: `AI insight · ${pick.title}`,
        description: result.summary,
        fields: [
          {
            name: 'AI confidence',
            value: `${result.confidence}%`,
            inline: true,
          },
          { name: 'Model', value: model, inline: true },
        ],
        relatedEntityType: 'pick',
        relatedEntityId: args.pickId,
      },
    });

    return { ...result, model };
  },
});

// =============================================================================
// Grading explanation (BPMN-013 §AI interactions). Single-shot Haiku
// summary that fills `picks.gradeExplanation` after a non-pending grade
// is recorded. The output is descriptive — never recommends, never
// editorializes — so we can surface it on the customer-facing pick
// timeline without compliance issues.
// =============================================================================

const GRADING_SYSTEM_PROMPT = [
  'You are a sports analyst at DigiPicks. You read a graded pick + final',
  'event score and produce ONE neutral sentence describing why the pick',
  'resolved the way it did.',
  '',
  'Return PLAIN TEXT only — no JSON, no markdown, no commentary, just the',
  'one sentence. Maximum 160 characters. Examples:',
  '- "Took Chiefs -3.5; final 27-21 covered by 2.5."',
  '- "Over 8.5 lost on the slow-paced 6-0 result."',
  '- "Pushed: spread of -7 met the exact 28-21 final."',
  '',
  'Rules:',
  '- Be factual; do not characterize the bet as "good" or "bad".',
  '- Never recommend gambling.',
  '- If the score data is missing, return "Result confirmed; details unavailable."',
].join('\n');

export const gradingExplanation = internalAction({
  args: {
    pickId: v.id('picks'),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ explanation?: string; skipped?: true }> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { skipped: true };

    const pick = await ctx.runQuery(internal.ai._pickForAi, { pickId: args.pickId });
    if (!pick) return { skipped: true };
    if (!pick.grade || pick.grade === 'pending') return { skipped: true };

    const userPrompt = [
      `Pick: ${pick.title}`,
      `Sport / League: ${pick.sport} / ${pick.league}`,
      `Event: ${pick.eventName}`,
      `Market: ${pick.market}`,
      `Selection: ${pick.selection}`,
      `Odds: ${pick.odds}`,
      `Final grade: ${pick.grade}`,
      pick.netUnits ? `Net units: ${pick.netUnits}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const model = args.model ?? DEFAULT_MODEL;
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 200,
        system: [
          {
            type: 'text',
            text: GRADING_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const body = (await res.json()) as AnthropicMessageResponse;
    if (!res.ok) {
      console.warn(`gradingExplanation Anthropic error: ${body.error?.message ?? res.status}`);
      return { skipped: true };
    }

    const text = body.content?.find((b) => b.type === 'text')?.text?.trim() ?? '';
    if (!text) return { skipped: true };

    await ctx.runMutation(internal.picks._setGradeExplanation, {
      pickId: args.pickId,
      explanation: text.slice(0, 200),
    });
    return { explanation: text };
  },
});

// =============================================================================
// AI Co-write — pre-publish suggestion (PRD M9 differentiator, Phase 12).
//
// CreatePick form calls this action with the in-progress sketch (sport,
// market, selection, odds, body). Returns suggested summary + confidence
// + reasoning the form can pre-fill. The system prompt is the same one
// `analyzePick` uses, marked with cache_control so the prompt-cache
// hit path keeps token costs low across both calls.
//
// Rate-limited per user via the existing stripeCheckout bucket (5/10min)
// — Anthropic spend is the throttle vector here, same shape as Stripe.
// =============================================================================

const SUGGEST_RATE_BUCKET = 'stripeCheckout';

export const suggestPick = action({
  args: {
    sport: v.string(),
    league: v.string(),
    eventName: v.string(),
    market: v.string(),
    selection: v.string(),
    odds: v.string(),
    units: v.optional(v.string()),
    body: v.optional(v.string()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<AnalysisResult & { model: string }> => {
    const user: Doc<'users'> | null = await ctx.runQuery(internal.ai._meForSuggest, {});
    if (!user) throw new Error('Unauthorized');
    await rateLimiter.limit(ctx, SUGGEST_RATE_BUCKET, {
      key: user._id,
      throws: true,
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Symmetric with analyzePick — gracefully degrade rather than
      // throw, so the UI can show a friendly "AI not enabled" state
      // instead of a runtime error. Same pattern as oddsApi / streams /
      // push / telegram.
      return {
        summary: '',
        confidence: 0,
        reasoning: 'AI suggestions are not enabled in this environment.',
        model: 'skipped',
      };
    }

    const model = args.model ?? DEFAULT_MODEL;
    const userPrompt = [
      `Sport / League: ${args.sport} / ${args.league}`,
      `Event: ${args.eventName}`,
      `Market: ${args.market}`,
      `Selection: ${args.selection}`,
      `Odds: ${args.odds}`,
      args.units ? `Stake (units): ${args.units}` : '',
      args.body ? `\nCreator notes:\n${args.body}` : '',
      '',
      'Suggest summary / confidence / reasoning the creator can use as a starting point.',
    ]
      .filter(Boolean)
      .join('\n');

    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        // Prompt-cached system block — same content as analyzePick so
        // both actions share the cache entry.
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const body = (await res.json()) as AnthropicMessageResponse;
    if (!res.ok) {
      const msg = body.error?.message ?? `Anthropic API error (${res.status})`;
      throw new Error(msg);
    }

    const text = body.content?.find((b) => b.type === 'text')?.text ?? '';
    const result = parseAnalysis(text);
    return { ...result, model };
  },
});
