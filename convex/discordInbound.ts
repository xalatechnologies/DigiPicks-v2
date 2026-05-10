import { v } from 'convex/values';
import {
  mutation,
  query,
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import {
  requireUser,
  requireCreatorOwnership,
  requireAdmin,
} from './shared/permissions';

// =============================================================================
// Discord inbound scaffolding (Phase 16e, M20).
//
// Schema + creator-side connect/disconnect mutations + admin pause/revoke
// + action stubs for the future Bot API import pipeline. Actual ingestion
// is gated behind DISCORD_BOT_TOKEN; without it the import action is a
// quiet no-op so dev environments don't spam.
//
// The Bot API integration itself (OAuth flow, message intent, sentiment
// scoring) lives in a follow-up. This module makes the data layer + UI
// surfaces functional today so the connect / configure / pause flow is
// already shippable.
// =============================================================================

/** Creator: list integrations on their creator profile. */
export const listForCreator = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);
    return await ctx.db
      .query('discordIntegrations')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .order('desc')
      .take(50);
  },
});

/** Creator: list configured channel syncs for an integration. */
export const channelSyncs = query({
  args: { integrationId: v.id('discordIntegrations') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) return [];
    if (user.creatorId !== integration.creatorId && user.role !== 'admin') {
      throw new Error('Forbidden');
    }
    return await ctx.db
      .query('discordChannelSyncs')
      .withIndex('by_integration', (q) =>
        q.eq('integrationId', args.integrationId),
      )
      .take(100);
  },
});

/**
 * Creator: connect a Discord guild. Stores guild metadata only — the
 * actual Bot API token exchange happens out-of-band (Discord OAuth →
 * platform callback → this mutation).
 */
export const connectGuild = mutation({
  args: {
    creatorId: v.id('creators'),
    guildId: v.string(),
    guildName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireCreatorOwnership(ctx, args.creatorId);

    const existing = await ctx.db
      .query('discordIntegrations')
      .withIndex('by_guild', (q) => q.eq('guildId', args.guildId))
      .first();
    if (existing && existing.status !== 'revoked') {
      // Idempotent re-connect: bump status back to connected.
      await ctx.db.patch(existing._id, {
        status: 'connected',
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const now = Date.now();
    const id = await ctx.db.insert('discordIntegrations', {
      creatorId: args.creatorId,
      guildId: args.guildId,
      guildName: args.guildName,
      status: 'connected',
      connectedByUserId: user._id,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.runMutation(internal.audit.log, {
      actorUserId: user._id,
      entityType: 'discord_integration',
      entityId: id,
      action: 'discord.connected',
      metadata: { guildId: args.guildId, guildName: args.guildName },
    });

    return id;
  },
});

/** Creator: configure a channel for inbound / outbound / two-way sync. */
export const configureChannelSync = mutation({
  args: {
    integrationId: v.id('discordIntegrations'),
    channelId: v.string(),
    channelName: v.string(),
    syncDirection: v.union(
      v.literal('outbound'),
      v.literal('inbound'),
      v.literal('two_way'),
    ),
    linkedEntityType: v.optional(v.string()),
    linkedEntityId: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) throw new Error('Integration not found');
    if (user.creatorId !== integration.creatorId && user.role !== 'admin') {
      throw new Error('Forbidden');
    }

    const existing = await ctx.db
      .query('discordChannelSyncs')
      .withIndex('by_channel', (q) => q.eq('channelId', args.channelId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        channelName: args.channelName,
        syncDirection: args.syncDirection,
        linkedEntityType: args.linkedEntityType,
        linkedEntityId: args.linkedEntityId,
        isEnabled: args.isEnabled ?? existing.isEnabled,
      });
      return existing._id;
    }

    return await ctx.db.insert('discordChannelSyncs', {
      integrationId: args.integrationId,
      channelId: args.channelId,
      channelName: args.channelName,
      syncDirection: args.syncDirection,
      linkedEntityType: args.linkedEntityType,
      linkedEntityId: args.linkedEntityId,
      isEnabled: args.isEnabled ?? true,
      createdAt: Date.now(),
    });
  },
});

/** Creator (or admin): pause an integration. */
export const pauseIntegration = mutation({
  args: { integrationId: v.id('discordIntegrations') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) throw new Error('Integration not found');
    if (user.creatorId !== integration.creatorId && user.role !== 'admin') {
      throw new Error('Forbidden');
    }
    await ctx.db.patch(args.integrationId, {
      status: 'paused',
      updatedAt: Date.now(),
    });
    await ctx.runMutation(internal.audit.log, {
      actorUserId: user._id,
      entityType: 'discord_integration',
      entityId: args.integrationId,
      action: 'discord.paused',
    });
    return args.integrationId;
  },
});

/** Admin-only: hard-revoke. Distinct from pause — clears the link. */
export const revokeIntegration = mutation({
  args: { integrationId: v.id('discordIntegrations') },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) return null;
    await ctx.db.patch(args.integrationId, {
      status: 'revoked',
      updatedAt: Date.now(),
    });
    await ctx.runMutation(internal.audit.log, {
      actorUserId: admin._id,
      entityType: 'discord_integration',
      entityId: args.integrationId,
      action: 'discord.revoked',
    });
    return args.integrationId;
  },
});

// ─── Action stubs ──────────────────────────────────────────────────────────

export const _activeChannelSyncsForImport = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('discordChannelSyncs').take(2000);
    return all.filter(
      (c) =>
        c.isEnabled &&
        (c.syncDirection === 'inbound' || c.syncDirection === 'two_way'),
    );
  },
});

/**
 * Stub: import recent messages from configured inbound channels.
 * Quiet no-op without DISCORD_BOT_TOKEN. The real implementation will:
 *   - Fetch via /channels/{id}/messages
 *   - Hash author IDs (privacy default)
 *   - Optionally summarize via Anthropic
 *   - Insert `discordMessageImports` rows
 */
export const importChannelMessages = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ skipped: true; reason: string } | { skipped: false; imported: number }> => {
    if (!process.env.DISCORD_BOT_TOKEN) {
      return { skipped: true as const, reason: 'no_bot_token' };
    }
    const syncs = await ctx.runQuery(
      internal.discordInbound._activeChannelSyncsForImport,
      {},
    );
    void syncs;
    // Real implementation pending — bot ingestion lives behind a follow-up
    // task. The schema + admin/creator surfaces are wired today.
    return { skipped: true as const, reason: 'not_yet_implemented' };
  },
});

/** Stub: nightly sentiment summary cron. Quiet no-op without bot. */
export const generateDiscussionSummary = internalAction({
  args: {},
  handler: async (
    _ctx,
  ): Promise<{ skipped: true; reason: string } | { skipped: false; summarized: number }> => {
    if (!process.env.DISCORD_BOT_TOKEN || !process.env.ANTHROPIC_API_KEY) {
      return { skipped: true as const, reason: 'missing_credentials' };
    }
    return { skipped: true as const, reason: 'not_yet_implemented' };
  },
});

// Quiet "unused" lint when only types referenced.
export type _IdUnused = Id<'discordIntegrations'>;
