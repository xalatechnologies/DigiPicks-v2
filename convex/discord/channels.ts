import { v } from 'convex/values';
import { query, mutation, internalQuery, type MutationCtx } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import { requireUser, requireCreatorOwnership, isAdmin } from '../shared/permissions';

// =============================================================================
// Discord channel sync — per-channel inbound/outbound/two-way configuration.
// =============================================================================

const syncDirection = v.union(v.literal('outbound'), v.literal('inbound'), v.literal('two_way'));

const alertRulesValidator = v.object({
  newPick: v.optional(v.boolean()),
  pickGraded: v.optional(v.boolean()),
  oddsMovement: v.optional(v.boolean()),
  creatorLive: v.optional(v.boolean()),
  aiInsight: v.optional(v.boolean()),
  announcement: v.optional(v.boolean()),
  minConfidence: v.optional(v.string()),
});

async function loadOwnedIntegration(
  ctx: MutationCtx,
  user: Doc<'users'>,
  integrationId: Id<'discordIntegrations'>,
): Promise<Doc<'discordIntegrations'>> {
  const integration = await ctx.db.get(integrationId);
  if (!integration) throw new Error('Integration not found');
  if (user.creatorId !== integration.creatorId && !isAdmin(user)) {
    throw new Error('Forbidden');
  }
  return integration;
}

/**
 * Configure (insert or update) a single channel sync row. Creator-only.
 * The `(integrationId, channelId)` pair is treated as the natural key.
 */
export const configureChannelSync = mutation({
  args: {
    integrationId: v.id('discordIntegrations'),
    channelId: v.string(),
    channelName: v.string(),
    channelType: v.optional(v.number()),
    syncDirection,
    linkedEntityType: v.optional(v.string()),
    linkedEntityId: v.optional(v.string()),
    alertRules: v.optional(alertRulesValidator),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const integration = await loadOwnedIntegration(ctx, user, args.integrationId);

    const existing = await ctx.db
      .query('discordChannelSyncs')
      .withIndex('by_integration', (q) => q.eq('integrationId', args.integrationId))
      .take(500);
    const match = existing.find((row) => row.channelId === args.channelId);

    const now = Date.now();
    if (match) {
      await ctx.db.patch(match._id, {
        channelName: args.channelName,
        channelType: args.channelType ?? match.channelType,
        syncDirection: args.syncDirection,
        linkedEntityType: args.linkedEntityType,
        linkedEntityId: args.linkedEntityId,
        alertRules: args.alertRules,
        isEnabled: args.isEnabled ?? match.isEnabled,
        creatorId: integration.creatorId,
        updatedAt: now,
      });
      await ctx.runMutation(internal.audit.log, {
        actorUserId: user._id,
        entityType: 'discord_channel_sync',
        entityId: match._id,
        action: 'discord.channelSync.updated',
        metadata: { channelId: args.channelId, syncDirection: args.syncDirection },
      });
      return match._id;
    }

    const newId = await ctx.db.insert('discordChannelSyncs', {
      integrationId: args.integrationId,
      creatorId: integration.creatorId,
      channelId: args.channelId,
      channelName: args.channelName,
      channelType: args.channelType,
      syncDirection: args.syncDirection,
      linkedEntityType: args.linkedEntityType,
      linkedEntityId: args.linkedEntityId,
      alertRules: args.alertRules,
      isEnabled: args.isEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.runMutation(internal.audit.log, {
      actorUserId: user._id,
      entityType: 'discord_channel_sync',
      entityId: newId,
      action: 'discord.channelSync.created',
      metadata: { channelId: args.channelId, syncDirection: args.syncDirection },
    });
    return newId;
  },
});

/** Disable a configured sync (toggles `isEnabled=false`). Creator-only. */
export const disableChannelSync = mutation({
  args: { channelSyncId: v.id('discordChannelSyncs') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const row = await ctx.db.get(args.channelSyncId);
    if (!row) throw new Error('Channel sync not found');
    await loadOwnedIntegration(ctx, user, row.integrationId);

    await ctx.db.patch(args.channelSyncId, {
      isEnabled: false,
      updatedAt: Date.now(),
    });
    await ctx.runMutation(internal.audit.log, {
      actorUserId: user._id,
      entityType: 'discord_channel_sync',
      entityId: args.channelSyncId,
      action: 'discord.channelSync.disabled',
    });
    return args.channelSyncId;
  },
});

/** Creator-scoped list of channel sync rows. */
export const listChannelSyncs = query({
  args: {
    creatorId: v.id('creators'),
    syncDirection: v.optional(syncDirection),
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);
    const rows = await ctx.db
      .query('discordChannelSyncs')
      .withIndex('by_creator_and_direction', (q) => q.eq('creatorId', args.creatorId))
      .take(500);
    if (args.syncDirection) {
      return rows.filter((r) => r.syncDirection === args.syncDirection);
    }
    return rows;
  },
});

/** Internal: list all enabled inbound (or two-way) syncs across all creators. */
export const _listEnabledInbound = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('discordChannelSyncs')
      .withIndex('by_enabled_and_lastImported', (q) => q.eq('isEnabled', true))
      .take(2000);
    return rows.filter((r) => r.syncDirection === 'inbound' || r.syncDirection === 'two_way');
  },
});

/** Internal: list enabled outbound (or two-way) syncs for one creator. */
export const _listEnabledOutboundForCreator = internalQuery({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('discordChannelSyncs')
      .withIndex('by_creator_and_direction', (q) => q.eq('creatorId', args.creatorId))
      .take(500);
    return rows.filter(
      (r) => r.isEnabled && (r.syncDirection === 'outbound' || r.syncDirection === 'two_way'),
    );
  },
});
