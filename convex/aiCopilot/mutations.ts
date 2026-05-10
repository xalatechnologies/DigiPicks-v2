import { v } from 'convex/values';
import { mutation, internalMutation } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { requireUser } from '../shared/permissions';
import { scrub } from './scrub';

// =============================================================================
// AI Copilot mutations (M24).
//
// Public surface:
//   - startConversation        — open a new chat
//   - appendUserMessage        — push a scrubbed user turn
//   - archiveConversation      — soft-delete from the sidebar
//
// Internal surface (called only by the respond action):
//   - _startStreamingTurn      — insert empty assistant row to stream into
//   - _appendStreamChunk       — append a delta to streamingBuffer
//   - _finalizeStreamingTurn   — flip streaming=false, persist citations / tool calls
//   - _appendAssistantTurn     — atomic write for non-streaming finalizations
//                                (rate-limited refusals, max-iter fallbacks, errors)
// =============================================================================

const CITATION_VALIDATOR = v.array(
  v.object({
    kind: v.string(),
    id: v.string(),
    label: v.string(),
    tool: v.optional(v.string()),
    sampleSize: v.optional(v.number()),
    at: v.optional(v.number()),
  }),
);

const TOOL_CALL_VALIDATOR = v.array(
  v.object({
    toolName: v.string(),
    args: v.optional(v.any()),
    resultPreview: v.optional(v.string()),
    durationMs: v.number(),
    error: v.optional(v.string()),
  }),
);

const MODEL_METADATA_VALIDATOR = v.object({
  model: v.string(),
  inputTokens: v.optional(v.number()),
  outputTokens: v.optional(v.number()),
  cacheReadTokens: v.optional(v.number()),
});

// ─── Public mutations ──────────────────────────────────────────────────────

export const startConversation = mutation({
  args: {
    persona: v.union(v.literal('customer'), v.literal('creator')),
  },
  handler: async (ctx, args): Promise<Id<'aiConversations'>> => {
    const user = await requireUser(ctx);
    const now = Date.now();
    return await ctx.db.insert('aiConversations', {
      userId: user._id,
      title: '',
      persona: args.persona,
      messageCount: 0,
      lastMessageAt: now,
      createdAt: now,
    });
  },
});

export const appendUserMessage = mutation({
  args: {
    conversationId: v.id('aiConversations'),
    body: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'aiMessages'>> => {
    const user = await requireUser(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error('Conversation not found');
    if (conv.userId !== user._id) throw new Error('Forbidden');

    const trimmed = args.body.trim();
    if (!trimmed) throw new Error('Message body required');
    if (trimmed.length > 4000) throw new Error('Message must be ≤4000 characters');

    const { body: scrubbed, piiHash } = await scrub(trimmed);

    const now = Date.now();
    const id = await ctx.db.insert('aiMessages', {
      conversationId: args.conversationId,
      role: 'user',
      body: scrubbed,
      iter: 0,
      piiHash,
      createdAt: now,
    });

    // First user message becomes the conversation title (≤80 chars). After
    // that we leave it sticky so the sidebar entry doesn't keep shifting.
    const nextTitle = !conv.title ? scrubbed.slice(0, 80) : conv.title;

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      messageCount: conv.messageCount + 1,
      title: nextTitle,
    });
    return id;
  },
});

export const archiveConversation = mutation({
  args: { conversationId: v.id('aiConversations') },
  handler: async (ctx, args): Promise<null> => {
    const user = await requireUser(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return null;
    if (conv.userId !== user._id) throw new Error('Forbidden');
    await ctx.db.patch(args.conversationId, { archivedAt: Date.now() });
    return null;
  },
});

// ─── Internal mutations (respond action only) ─────────────────────────────

/**
 * One-shot atomic write for non-streaming assistant turns. Used for
 * rate-limit refusals, max-iter fallbacks, and unexpected errors where
 * we never opened a streaming row.
 */
export const _appendAssistantTurn = internalMutation({
  args: {
    conversationId: v.id('aiConversations'),
    body: v.string(),
    citations: v.optional(CITATION_VALIDATOR),
    modelMetadata: MODEL_METADATA_VALIDATOR,
    toolCalls: TOOL_CALL_VALIDATOR,
    iter: v.number(),
    stopReason: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'aiMessages'>> => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error('Conversation not found');

    const now = Date.now();
    const messageId = await ctx.db.insert('aiMessages', {
      conversationId: args.conversationId,
      role: 'assistant',
      body: args.body,
      iter: args.iter,
      model: args.modelMetadata.model,
      inputTokens: args.modelMetadata.inputTokens,
      outputTokens: args.modelMetadata.outputTokens,
      cacheReadTokens: args.modelMetadata.cacheReadTokens,
      stopReason: args.stopReason,
      citations: args.citations,
      createdAt: now,
    });

    if (args.toolCalls.length > 0) {
      await Promise.all(
        args.toolCalls.map((tc) =>
          ctx.db.insert('aiToolCalls', {
            messageId,
            conversationId: args.conversationId,
            toolName: tc.toolName,
            args: tc.args,
            resultPreview: tc.resultPreview,
            durationMs: tc.durationMs,
            error: tc.error,
            createdAt: now,
          }),
        ),
      );
    }

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      messageCount: conv.messageCount + 1,
    });

    return messageId;
  },
});

/**
 * Insert an empty assistant row that the UI can subscribe to. The
 * respond action then patches `streamingBuffer` as Anthropic SSE chunks
 * arrive, and finalizes via `_finalizeStreamingTurn`.
 */
export const _startStreamingTurn = internalMutation({
  args: {
    conversationId: v.id('aiConversations'),
    iter: v.number(),
  },
  handler: async (ctx, args): Promise<Id<'aiMessages'>> => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error('Conversation not found');
    const now = Date.now();
    const id = await ctx.db.insert('aiMessages', {
      conversationId: args.conversationId,
      role: 'assistant',
      body: '',
      iter: args.iter,
      streaming: true,
      streamingBuffer: '',
      createdAt: now,
    });
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      messageCount: conv.messageCount + 1,
    });
    return id;
  },
});

export const _appendStreamChunk = internalMutation({
  args: {
    messageId: v.id('aiMessages'),
    chunk: v.string(),
  },
  handler: async (ctx, args): Promise<null> => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) return null;
    const current = msg.streamingBuffer ?? '';
    await ctx.db.patch(args.messageId, {
      streamingBuffer: current + args.chunk,
    });
    return null;
  },
});

export const _finalizeStreamingTurn = internalMutation({
  args: {
    messageId: v.id('aiMessages'),
    body: v.string(),
    citations: v.optional(CITATION_VALIDATOR),
    modelMetadata: MODEL_METADATA_VALIDATOR,
    toolCalls: TOOL_CALL_VALIDATOR,
    stopReason: v.string(),
  },
  handler: async (ctx, args): Promise<null> => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) return null;

    await ctx.db.patch(args.messageId, {
      body: args.body,
      streaming: false,
      streamingBuffer: undefined,
      stopReason: args.stopReason,
      model: args.modelMetadata.model,
      inputTokens: args.modelMetadata.inputTokens,
      outputTokens: args.modelMetadata.outputTokens,
      cacheReadTokens: args.modelMetadata.cacheReadTokens,
      citations: args.citations,
    });

    if (args.toolCalls.length > 0) {
      const now = Date.now();
      await Promise.all(
        args.toolCalls.map((tc) =>
          ctx.db.insert('aiToolCalls', {
            messageId: args.messageId,
            conversationId: msg.conversationId,
            toolName: tc.toolName,
            args: tc.args,
            resultPreview: tc.resultPreview,
            durationMs: tc.durationMs,
            error: tc.error,
            createdAt: now,
          }),
        ),
      );
    }
    return null;
  },
});

// ─── Retention crons (M24 governance §retention) ──────────────────────────

const ARCHIVE_AFTER_MS = 90 * 24 * 60 * 60 * 1000; // 90 days idle → archived
const TOOL_CALL_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days → drop tool calls
const RETENTION_BATCH = 100;

/**
 * Archive aiConversations whose lastMessageAt is older than 90 days.
 * Bounded to RETENTION_BATCH per run; self-schedules continuation when the
 * batch fills, so we never block on a long-tail cleanup. Reads use the
 * `by_user_active` index (already declared on the table) so the scan
 * stays bounded even on large user counts.
 */
export const _archiveStaleConversations = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ archived: number; more: boolean }> => {
    const cutoff = Date.now() - ARCHIVE_AFTER_MS;
    // Pull the next batch of unarchived rows; we filter by lastMessageAt
    // in-memory because the index is keyed (userId, archivedAt) rather
    // than a global timestamp index — acceptable since we only read
    // RETENTION_BATCH rows per cron tick.
    const rows = await ctx.db
      .query('aiConversations')
      .filter((q) => q.eq(q.field('archivedAt'), undefined))
      .take(RETENTION_BATCH);

    let archived = 0;
    for (const row of rows) {
      const lastActive = row.lastMessageAt ?? row.createdAt;
      if (lastActive < cutoff) {
        await ctx.db.patch(row._id, { archivedAt: Date.now() });
        archived += 1;
      }
    }

    const more = rows.length === RETENTION_BATCH;
    if (more && archived > 0) {
      await ctx.scheduler.runAfter(
        1000,
        // Self-schedule via the same internal handle.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('../_generated/api')).internal.aiCopilot.mutations._archiveStaleConversations,
        {},
      );
    }
    return { archived, more };
  },
});

/**
 * Hard-delete aiToolCalls older than 30 days. Tool-call rows are pure
 * observability — assistant messages keep their citations + body, so
 * dropping the raw tool args / result preview at 30d trims storage
 * without losing the user-visible answer trail.
 */
export const _purgeStaleToolCalls = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ deleted: number; more: boolean }> => {
    const cutoff = Date.now() - TOOL_CALL_TTL_MS;
    const rows = await ctx.db
      .query('aiToolCalls')
      .withIndex('by_tool_and_createdAt')
      .take(RETENTION_BATCH);

    let deleted = 0;
    for (const row of rows) {
      if (row.createdAt < cutoff) {
        await ctx.db.delete(row._id);
        deleted += 1;
      }
    }

    const more = rows.length === RETENTION_BATCH;
    if (more && deleted > 0) {
      await ctx.scheduler.runAfter(
        1000,
        (await import('../_generated/api')).internal.aiCopilot.mutations._purgeStaleToolCalls,
        {},
      );
    }
    return { deleted, more };
  },
});
