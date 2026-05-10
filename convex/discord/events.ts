import { v } from 'convex/values';
import { internalAction, internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';

// =============================================================================
// Discord webhook event ingest queue.
//
// `/discord/interactions` POSTs raw events here as `_recordWebhookEvent`,
// then schedules `processIncomingEvent` to dispatch by `eventType`.
// `purgeProcessed` is a maintenance cron — keep last 90d of processed rows.
//
// Idempotency: dedupe by both `discordEventId` and `payloadHash`.
// =============================================================================

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const PURGE_BATCH = 200;

/** Internal: insert a webhook event row, idempotent on (eventId, hash). */
export const _recordWebhookEvent = internalMutation({
  args: {
    integrationId: v.optional(v.id('discordIntegrations')),
    discordEventId: v.string(),
    eventType: v.string(),
    guildId: v.optional(v.string()),
    channelId: v.optional(v.string()),
    payloadHash: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ id: Id<'discordWebhookEvents'> | null; deduped: boolean }> => {
    const byEventId = await ctx.db
      .query('discordWebhookEvents')
      .withIndex('by_eventId', (q) => q.eq('discordEventId', args.discordEventId))
      .first();
    if (byEventId) return { id: byEventId._id, deduped: true };

    const byHash = await ctx.db
      .query('discordWebhookEvents')
      .withIndex('by_payloadHash', (q) => q.eq('payloadHash', args.payloadHash))
      .first();
    if (byHash) return { id: byHash._id, deduped: true };

    const id = await ctx.db.insert('discordWebhookEvents', {
      integrationId: args.integrationId,
      discordEventId: args.discordEventId,
      eventType: args.eventType,
      guildId: args.guildId,
      channelId: args.channelId,
      payloadHash: args.payloadHash,
      receivedAt: Date.now(),
    });
    return { id, deduped: false };
  },
});

export const _markProcessed = internalMutation({
  args: {
    id: v.id('discordWebhookEvents'),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      processedAt: Date.now(),
      processingError: args.error,
    });
  },
});

export const _getEvent = internalQuery({
  args: { id: v.id('discordWebhookEvents') },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

/**
 * Dispatch a queued webhook event. Currently we recognize:
 *   - THREAD_CREATE   maybe creates a discordThreadLinks row when the
 *                     guild has an enabled `community` channel sync.
 *   - MESSAGE_CREATE  enqueues an import via the existing inbound action
 *                     (which performs hashing + summarization).
 * Unknown types are no-ops — recorded as processed with no error.
 */
export const processIncomingEvent = internalAction({
  args: {
    eventId: v.id('discordWebhookEvents'),
    /**
     * Lightweight payload pieces extracted from the request body. The full
     * Discord interaction body is NOT stored — only what we need to
     * dispatch. All values are validated downstream.
     */
    payload: v.optional(
      v.object({
        threadId: v.optional(v.string()),
        threadName: v.optional(v.string()),
        channelId: v.optional(v.string()),
        guildId: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const evt: Doc<'discordWebhookEvents'> | null = await ctx.runQuery(
      internal.discord.events._getEvent,
      { id: args.eventId },
    );
    if (!evt || evt.processedAt) return;

    try {
      if (evt.eventType === 'MESSAGE_CREATE') {
        // Schedule the bounded import action — it handles auth, hashing,
        // summary, and the actual write. We don't await; idempotency comes
        // from the dedupe inside `_recordImports`.
        await ctx.scheduler.runAfter(0, internal.discord.inbound.importEnabledChannels, {});
      } else if (evt.eventType === 'THREAD_CREATE' && args.payload?.threadId) {
        // Best-effort: if the guild has a connected integration, record a
        // thread link with no entity binding. The creator can attach an
        // entity from the dashboard.
        if (evt.guildId) {
          const integration = await ctx.runQuery(
            internal.discord.integrationsDb._getIntegrationByGuildId,
            { guildId: evt.guildId },
          );
          if (integration && integration.status === 'connected') {
            await ctx.runMutation(internal.discord.events._upsertThreadShell, {
              integrationId: integration._id,
              threadId: args.payload.threadId,
              channelId: args.payload.channelId ?? evt.channelId ?? '',
              threadName: args.payload.threadName,
            });
          }
        }
      }
      await ctx.runMutation(internal.discord.events._markProcessed, {
        id: args.eventId,
      });
    } catch (err) {
      await ctx.runMutation(internal.discord.events._markProcessed, {
        id: args.eventId,
        error: (err instanceof Error ? err.message : String(err)).slice(0, 500),
      });
    }
  },
});

/**
 * Insert a thread-link shell when Discord notifies us of a new thread but
 * the creator hasn't bound it to an entity yet. Idempotent on threadId.
 */
export const _upsertThreadShell = internalMutation({
  args: {
    integrationId: v.id('discordIntegrations'),
    threadId: v.string(),
    channelId: v.string(),
    threadName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('discordThreadLinks')
      .withIndex('by_thread', (q) => q.eq('threadId', args.threadId))
      .first();
    if (existing) return existing._id;

    const integration = await ctx.db.get(args.integrationId);
    if (!integration) return null;

    return await ctx.db.insert('discordThreadLinks', {
      integrationId: args.integrationId,
      threadId: args.threadId,
      channelId: args.channelId,
      threadName: args.threadName,
      // Default entity binding — creator can rebind later. Use 'creator' so
      // the badge surface still has *something* meaningful to render.
      linkedEntityType: 'creator',
      linkedEntityId: integration.creatorId,
      createdByUserId: integration.connectedByUserId,
      isActive: false, // shell is inactive until the creator binds an entity
      messageCount: 0,
      createdAt: Date.now(),
    });
  },
});

// ─── Maintenance: bounded purge of processed rows ────────────────────────

export const _olderProcessedBatch = internalQuery({
  args: { cutoff: v.number() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('discordWebhookEvents')
      .withIndex('by_processed', (q) => q.lte('processedAt', args.cutoff))
      .take(PURGE_BATCH);
    return rows.filter((r) => typeof r.processedAt === 'number');
  },
});

export const _deleteEvents = internalMutation({
  args: { ids: v.array(v.id('discordWebhookEvents')) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
    return args.ids.length;
  },
});

/**
 * Cron: purge processed webhook event rows older than 90 days. Bounded to
 * `PURGE_BATCH` rows per run; self-schedules another batch immediately if
 * the previous batch was full (signals more work to do).
 */
export const purgeProcessed = internalAction({
  args: {},
  handler: async (ctx): Promise<{ deleted: number }> => {
    const cutoff = Date.now() - RETENTION_MS;
    const rows: Doc<'discordWebhookEvents'>[] = await ctx.runQuery(
      internal.discord.events._olderProcessedBatch,
      { cutoff },
    );
    if (rows.length === 0) return { deleted: 0 };
    await ctx.runMutation(internal.discord.events._deleteEvents, {
      ids: rows.map((r) => r._id),
    });
    if (rows.length === PURGE_BATCH) {
      await ctx.scheduler.runAfter(0, internal.discord.events.purgeProcessed, {});
    }
    return { deleted: rows.length };
  },
});
