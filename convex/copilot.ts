import { v } from 'convex/values';
import {
  action,
  mutation,
  query,
  internalMutation,
  internalQuery,
  type ActionCtx,
} from './_generated/server';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { requireUser, getCurrentUser } from './shared/permissions';
import { rateLimiter } from './shared/rateLimit';

// =============================================================================
// AI Copilot v1 (Phase 16f, M24).
//
// Multi-turn conversational interface backed by Anthropic Claude Haiku
// with a tiny tool-use loop. v1 ships two tools:
//   - lookupCreator(handle)
//   - creatorPerformance(creatorId)
//
// Each assistant turn is allowed up to 3 tool-call iterations before
// returning a final answer. Citations are extracted from tool results
// and persisted alongside the assistant message so the UI can render
// "based on these queries" footnotes.
//
// Rate-limited via the existing stripeCheckout bucket — Anthropic spend
// + Stripe charges share that throttle vector.
// =============================================================================

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOOL_ITERATIONS = 3;

const SYSTEM_PROMPT_CUSTOMER = `You are the DigiPicks Copilot — a helpful, skeptical sports-intelligence assistant.

You have access to platform tools that let you look up creators and their
real performance numbers. Use them whenever a user asks about specific
creators or their stats. Never fabricate stats — if a tool returns
insufficient data, say so explicitly.

Rules:
- Cite the tool you used + the time window you queried.
- State the sample size when reporting win rates ("based on 14 graded picks").
- Confidence claims always paired with sample-size context.
- Never recommend gambling. State analysis as analysis, not advice.
- Keep answers concise — 1–3 short paragraphs unless asked for detail.`.trim();

const SYSTEM_PROMPT_CREATOR = `You are the DigiPicks Studio Copilot — a creator-side assistant focused on
performance analysis and content drafting.

Use tools to ground every claim in real data. When the creator asks about
their own performance, query their picks; when they ask about market
context, look up the relevant event or odds.

Rules:
- Cite each tool you used.
- Be honest about limited samples.
- Help draft picks / recaps / summaries when asked, but never invent
  stats.
- Never recommend gambling. Frame analysis as analysis.`.trim();

// ─── Public mutations + queries ─────────────────────────────────────────────

/** Start a fresh conversation. */
export const startConversation = mutation({
  args: {
    persona: v.union(v.literal('customer'), v.literal('creator')),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    return await ctx.db.insert('aiConversations', {
      userId: user._id,
      title: (args.title ?? 'New conversation').slice(0, 80),
      persona: args.persona,
      messageCount: 0,
      lastMessageAt: now,
      createdAt: now,
    });
  },
});

/** Append a user-side message. The action `respond` is the next call. */
export const appendUserMessage = mutation({
  args: {
    conversationId: v.id('aiConversations'),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error('Conversation not found');
    if (conv.userId !== user._id) throw new Error('Forbidden');
    const trimmed = args.body.trim();
    if (!trimmed) throw new Error('Message body required');
    if (trimmed.length > 4000) throw new Error('Message must be ≤4000 characters');

    const now = Date.now();
    const id = await ctx.db.insert('aiMessages', {
      conversationId: args.conversationId,
      role: 'user',
      body: trimmed,
      createdAt: now,
    });
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      messageCount: conv.messageCount + 1,
    });
    return id;
  },
});

/** List the calling user's conversations, archived ones excluded. */
export const myConversations = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query('aiConversations')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(50);
    return rows.filter((r) => !r.archivedAt);
  },
});

/** Read messages for one conversation. Caller must own it. */
export const messages = query({
  args: { conversationId: v.id('aiConversations') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return [];
    if (conv.userId !== user._id) throw new Error('Forbidden');
    return await ctx.db
      .query('aiMessages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .order('asc')
      .take(500);
  },
});

/** Archive (soft-delete) a conversation. */
export const archiveConversation = mutation({
  args: { conversationId: v.id('aiConversations') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return null;
    if (conv.userId !== user._id) throw new Error('Forbidden');
    await ctx.db.patch(args.conversationId, { archivedAt: Date.now() });
    return args.conversationId;
  },
});

// ─── Internal helpers ──────────────────────────────────────────────────────

export const _meSafe = internalQuery({
  args: {},
  handler: async (ctx): Promise<Doc<'users'> | null> => {
    return await getCurrentUser(ctx);
  },
});

export const _conversationFor = internalQuery({
  args: { conversationId: v.id('aiConversations') },
  handler: async (ctx, args): Promise<Doc<'aiConversations'> | null> => {
    return await ctx.db.get(args.conversationId);
  },
});

export const _messageHistory = internalQuery({
  args: { conversationId: v.id('aiConversations'), limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<Doc<'aiMessages'>[]> => {
    return await ctx.db
      .query('aiMessages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .order('asc')
      .take(args.limit ?? 50);
  },
});

export const _appendAssistantTurn = internalMutation({
  args: {
    conversationId: v.id('aiConversations'),
    body: v.string(),
    model: v.string(),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    citations: v.optional(
      v.array(
        v.object({
          kind: v.string(),
          id: v.string(),
          label: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return null;
    const now = Date.now();
    const id = await ctx.db.insert('aiMessages', {
      conversationId: args.conversationId,
      role: 'assistant',
      body: args.body,
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      citations: args.citations,
      createdAt: now,
    });
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      messageCount: conv.messageCount + 1,
    });
    return id;
  },
});

export const _appendToolTurn = internalMutation({
  args: {
    conversationId: v.id('aiConversations'),
    toolName: v.string(),
    toolArgs: v.any(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('aiMessages', {
      conversationId: args.conversationId,
      role: 'tool',
      body: args.body,
      toolName: args.toolName,
      toolArgs: args.toolArgs,
      createdAt: Date.now(),
    });
  },
});

// ─── Tool implementations ─────────────────────────────────────────────────

interface CreatorLookupResult {
  found: boolean;
  creator?: {
    id: string;
    handle: string;
    name: string;
    niche: string;
    sports: string[];
    verified: boolean;
    trustScore: number | null;
    subscriberCount: number;
  };
}

interface CreatorPerformanceResult {
  found: boolean;
  creator?: { id: string; handle: string; name: string };
  pickCount: number;
  decided: number;
  wins: number;
  losses: number;
  pushes: number;
  winRatePct: number;
  recentTitles: string[];
}

export const _toolLookupCreator = internalQuery({
  args: { handle: v.string() },
  handler: async (ctx, args): Promise<CreatorLookupResult> => {
    const handle = args.handle.startsWith('@') ? args.handle : `@${args.handle}`;
    const creator = await ctx.db
      .query('creators')
      .withIndex('by_handle', (q) => q.eq('handle', handle))
      .first();
    if (!creator) return { found: false };
    return {
      found: true,
      creator: {
        id: creator._id,
        handle: creator.handle,
        name: creator.name,
        niche: creator.niche,
        sports: creator.sports,
        verified: creator.verified,
        trustScore: creator.trustScore ?? null,
        subscriberCount: creator.subscriberCount,
      },
    };
  },
});

export const _toolCreatorPerformance = internalQuery({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args): Promise<CreatorPerformanceResult> => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) {
      return {
        found: false,
        pickCount: 0,
        decided: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        winRatePct: 0,
        recentTitles: [],
      };
    }
    const picks = await ctx.db
      .query('picks')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .order('desc')
      .take(100);
    const decided = picks.filter((p) => p.grade === 'win' || p.grade === 'loss');
    const wins = decided.filter((p) => p.grade === 'win').length;
    const losses = decided.filter((p) => p.grade === 'loss').length;
    const pushes = picks.filter((p) => p.grade === 'push').length;
    const winRatePct =
      decided.length === 0 ? 0 : Math.round((wins / decided.length) * 1000) / 10;
    return {
      found: true,
      creator: { id: creator._id, handle: creator.handle, name: creator.name },
      pickCount: picks.length,
      decided: decided.length,
      wins,
      losses,
      pushes,
      winRatePct,
      recentTitles: picks.slice(0, 5).map((p) => p.title),
    };
  },
});

// ─── Anthropic tool-use loop ──────────────────────────────────────────────

const TOOLS = [
  {
    name: 'lookupCreator',
    description:
      'Look up a creator by their handle (e.g. "@sharpedge"). Returns profile, niche, trust score, and subscriber count.',
    input_schema: {
      type: 'object',
      properties: {
        handle: {
          type: 'string',
          description: 'Creator handle, with or without leading @.',
        },
      },
      required: ['handle'],
    },
  },
  {
    name: 'creatorPerformance',
    description:
      'Pull a creator\'s pick history + win-rate stats. Use after lookupCreator to get the creatorId.',
    input_schema: {
      type: 'object',
      properties: {
        creatorId: {
          type: 'string',
          description: 'The creators._id returned by lookupCreator.',
        },
      },
      required: ['creatorId'],
    },
  },
];

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content:
    | string
    | Array<
        | { type: 'text'; text: string }
        | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
        | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }
      >;
}

interface AnthropicResponse {
  content?: Array<
    | { type: 'text'; text: string }
    | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  >;
  stop_reason?: string;
  model?: string;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
}

/** Public action: respond to a conversation. Runs the tool-use loop. */
export const respond = action({
  args: { conversationId: v.id('aiConversations') },
  handler: async (
    ctx,
    args,
  ): Promise<{ messageId: Id<'aiMessages'> } | { skipped: true; reason: string }> => {
    const me: Doc<'users'> | null = await ctx.runQuery(internal.copilot._meSafe, {});
    if (!me) throw new Error('Unauthorized');

    await rateLimiter.limit(ctx, 'stripeCheckout', {
      key: me._id,
      throws: true,
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { skipped: true as const, reason: 'no_api_key' };
    }

    const conv = await ctx.runQuery(internal.copilot._conversationFor, {
      conversationId: args.conversationId,
    });
    if (!conv) throw new Error('Conversation not found');
    if (conv.userId !== me._id) throw new Error('Forbidden');

    const history = await ctx.runQuery(internal.copilot._messageHistory, {
      conversationId: args.conversationId,
    });

    const systemPrompt =
      conv.persona === 'creator'
        ? SYSTEM_PROMPT_CREATOR
        : SYSTEM_PROMPT_CUSTOMER;

    // Seed the model with prior turns. Tool messages encode prior tool
    // results so the model has context across iterations.
    const messages: AnthropicMessage[] = [];
    for (const m of history) {
      if (m.role === 'user') {
        messages.push({ role: 'user', content: m.body });
      } else if (m.role === 'assistant') {
        messages.push({ role: 'assistant', content: m.body });
      }
      // Tool turns are recorded for the UI but are interpolated below
      // when the loop hits a fresh tool_use.
    }

    const citations: Array<{ kind: string; id: string; label: string }> = [];
    let final = '';
    let model = DEFAULT_MODEL;
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;

    for (let iter = 0; iter < MAX_TOOL_ITERATIONS + 1; iter++) {
      const res = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          max_tokens: 1024,
          system: [
            {
              type: 'text',
              text: systemPrompt,
              cache_control: { type: 'ephemeral' },
            },
          ],
          tools: TOOLS,
          messages,
        }),
      });

      const body = (await res.json()) as AnthropicResponse;
      if (!res.ok) {
        throw new Error(body.error?.message ?? `Anthropic error ${res.status}`);
      }
      model = body.model ?? DEFAULT_MODEL;
      inputTokens = body.usage?.input_tokens ?? inputTokens;
      outputTokens = body.usage?.output_tokens ?? outputTokens;

      const toolUses = (body.content ?? []).filter(
        (c): c is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
          c.type === 'tool_use',
      );
      const textParts = (body.content ?? [])
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map((c) => c.text)
        .join('\n');

      if (toolUses.length === 0 || body.stop_reason === 'end_turn') {
        final = textParts || '(no response)';
        break;
      }

      // Echo the assistant's tool-use block back in messages, then run
      // each tool and append the results.
      messages.push({
        role: 'assistant',
        content: body.content as AnthropicMessage['content'],
      });

      const toolResultBlocks: Array<{
        type: 'tool_result';
        tool_use_id: string;
        content: string;
        is_error?: boolean;
      }> = [];

      for (const tu of toolUses) {
        const result = await runTool(ctx, tu.name, tu.input, citations);
        await ctx.runMutation(internal.copilot._appendToolTurn, {
          conversationId: args.conversationId,
          toolName: tu.name,
          toolArgs: tu.input,
          body: JSON.stringify(result).slice(0, 2000),
        });
        toolResultBlocks.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(result),
        });
      }

      messages.push({ role: 'user', content: toolResultBlocks });

      if (iter === MAX_TOOL_ITERATIONS) {
        final =
          textParts ||
          'I needed more tool calls than I\'m allowed in a single turn — try asking a more focused question.';
        break;
      }
    }

    const messageId = await ctx.runMutation(internal.copilot._appendAssistantTurn, {
      conversationId: args.conversationId,
      body: final,
      model,
      inputTokens,
      outputTokens,
      citations: citations.length > 0 ? citations : undefined,
    });

    return { messageId: messageId as Id<'aiMessages'> };
  },
});

async function runTool(
  ctx: ActionCtx,
  name: string,
  input: Record<string, unknown>,
  citations: Array<{ kind: string; id: string; label: string }>,
): Promise<unknown> {
  if (name === 'lookupCreator') {
    const handle = String(input.handle ?? '').trim();
    if (!handle) return { error: 'handle required' };
    const result: CreatorLookupResult = await ctx.runQuery(
      internal.copilot._toolLookupCreator,
      { handle },
    );
    if (result.found && result.creator) {
      citations.push({
        kind: 'creator',
        id: result.creator.id,
        label: `${result.creator.name} (${result.creator.handle})`,
      });
    }
    return result;
  }
  if (name === 'creatorPerformance') {
    const id = String(input.creatorId ?? '');
    if (!id) return { error: 'creatorId required' };
    const result: CreatorPerformanceResult = await ctx.runQuery(
      internal.copilot._toolCreatorPerformance,
      { creatorId: id as Id<'creators'> },
    );
    if (result.found && result.creator) {
      citations.push({
        kind: 'creator_performance',
        id: result.creator.id,
        label: `${result.creator.name} · ${result.decided} decided · ${result.winRatePct}% win rate`,
      });
    }
    return result;
  }
  return { error: `unknown tool: ${name}` };
}
