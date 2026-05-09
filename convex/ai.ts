import { v } from 'convex/values';
import { internalAction, internalQuery } from './_generated/server';
import { internal } from './_generated/api';

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

interface AnalysisResult {
  summary: string;
  confidence: number;
  reasoning: string;
}

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

function parseAnalysis(raw: string): AnalysisResult {
  // Pull the first JSON object out of the response defensively. Claude is
  // instructed to return JSON only, but we defend against accidental prose.
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response did not contain a JSON object');
  }
  const json = raw.slice(start, end + 1);
  const parsed = JSON.parse(json) as Partial<AnalysisResult>;
  if (typeof parsed.summary !== 'string') throw new Error('Missing summary');
  if (typeof parsed.confidence !== 'number') throw new Error('Missing confidence');
  if (typeof parsed.reasoning !== 'string') throw new Error('Missing reasoning');
  return {
    summary: parsed.summary.trim().slice(0, 280),
    confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence))),
    reasoning: parsed.reasoning.trim().slice(0, 1200),
  };
}

export const _pickForAi = internalQuery({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.pickId);
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
  handler: async (ctx, args): Promise<AnalysisResult & { model: string }> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
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
        system: SYSTEM_PROMPT,
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

    return { ...result, model };
  },
});
