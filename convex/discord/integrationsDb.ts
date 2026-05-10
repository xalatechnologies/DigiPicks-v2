import { v } from 'convex/values';
import { query, mutation, internalQuery, internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';
import { requireUser, requireAdmin, requireCreatorOwnership } from '../shared/permissions';

// =============================================================================
// Discord integrations — V8 (default-runtime) queries + mutations.
//
// The Node-runtime OAuth/refresh actions live in `convex/discord/integrations.ts`
// and call into this file via `internal.discord.integrationsDb.*`.
// =============================================================================

/** Creator-scoped: list all integrations attached to the calling creator's profile. */
export const getCreatorIntegrations = query({
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

/** Creator (or admin): pause an integration. Outbound deliveries become no-ops. */
export const pauseIntegration = mutation({
  args: { integrationId: v.id('discordIntegrations') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) throw new Error('Integration not found');
    if (
      user.creatorId !== integration.creatorId &&
      user.role !== 'admin' &&
      user.role !== 'super_admin'
    ) {
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

/** Admin-only hard revoke. Clears stored OAuth tokens. */
export const revokeIntegration = mutation({
  args: { integrationId: v.id('discordIntegrations') },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) return null;
    await ctx.db.patch(args.integrationId, {
      status: 'revoked',
      revokedAt: Date.now(),
      updatedAt: Date.now(),
      oauthAccessTokenEnc: undefined,
      oauthRefreshTokenEnc: undefined,
      oauthExpiresAt: undefined,
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

// ─── Internal helpers used by Node actions in this folder ──────────────────

/** Persist a freshly OAuth-exchanged integration. Idempotent on guildId. */
export const _saveIntegration = internalMutation({
  args: {
    creatorId: v.id('creators'),
    guildId: v.string(),
    guildName: v.string(),
    guildIconHash: v.optional(v.string()),
    oauthAccessTokenEnc: v.optional(v.string()),
    oauthRefreshTokenEnc: v.optional(v.string()),
    oauthExpiresAt: v.optional(v.number()),
    scopes: v.optional(v.array(v.string())),
    botInstalled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('discordIntegrations')
      .withIndex('by_guild', (q) => q.eq('guildId', args.guildId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        creatorId: args.creatorId,
        guildName: args.guildName,
        guildIconHash: args.guildIconHash,
        status: 'connected',
        oauthAccessTokenEnc: args.oauthAccessTokenEnc,
        oauthRefreshTokenEnc: args.oauthRefreshTokenEnc,
        oauthExpiresAt: args.oauthExpiresAt,
        scopes: args.scopes,
        botInstalled: args.botInstalled,
        updatedAt: now,
      });
      await ctx.runMutation(internal.audit.log, {
        entityType: 'discord_integration',
        entityId: existing._id,
        action: 'discord.reconnected',
        metadata: { guildId: args.guildId },
      });
      return existing._id;
    }

    // Need a users _id for connectedByUserId — look up the creator's owner.
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new Error('Creator not found');
    const owner = await ctx.db
      .query('users')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', args.creatorId))
      .first();
    if (!owner) {
      throw new Error('Creator has no owning user — cannot connect Discord.');
    }
    const id = await ctx.db.insert('discordIntegrations', {
      creatorId: args.creatorId,
      guildId: args.guildId,
      guildName: args.guildName,
      guildIconHash: args.guildIconHash,
      status: 'connected',
      botInstalled: args.botInstalled ?? false,
      oauthAccessTokenEnc: args.oauthAccessTokenEnc,
      oauthRefreshTokenEnc: args.oauthRefreshTokenEnc,
      oauthExpiresAt: args.oauthExpiresAt,
      scopes: args.scopes,
      connectedByUserId: owner._id,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.runMutation(internal.audit.log, {
      entityType: 'discord_integration',
      entityId: id,
      action: 'discord.connected',
      metadata: { guildId: args.guildId, guildName: args.guildName },
    });
    return id;
  },
});

/** Refresh just the OAuth token columns. */
export const _updateTokens = internalMutation({
  args: {
    integrationId: v.id('discordIntegrations'),
    oauthAccessTokenEnc: v.string(),
    oauthRefreshTokenEnc: v.string(),
    oauthExpiresAt: v.number(),
    scopes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.integrationId, {
      oauthAccessTokenEnc: args.oauthAccessTokenEnc,
      oauthRefreshTokenEnc: args.oauthRefreshTokenEnc,
      oauthExpiresAt: args.oauthExpiresAt,
      scopes: args.scopes,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Persist the channel inventory snapshot. We don't store this in a separate
 * table — instead we upsert disabled `discordChannelSyncs` rows so the
 * dashboard "pick a channel" menu can list them. Existing enabled rows are
 * left untouched.
 */
export const _saveChannelInventory = internalMutation({
  args: {
    integrationId: v.id('discordIntegrations'),
    channels: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) return;

    const existing = await ctx.db
      .query('discordChannelSyncs')
      .withIndex('by_integration', (q) => q.eq('integrationId', args.integrationId))
      .take(500);
    const byChannelId = new Map(existing.map((row) => [row.channelId, row]));

    const now = Date.now();
    for (const ch of args.channels) {
      const prev = byChannelId.get(ch.id);
      if (prev) {
        await ctx.db.patch(prev._id, {
          channelName: ch.name,
          channelType: ch.type,
          updatedAt: now,
        });
        continue;
      }
      // New channel — insert disabled outbound stub so it shows up in the picker.
      await ctx.db.insert('discordChannelSyncs', {
        integrationId: args.integrationId,
        creatorId: integration.creatorId,
        channelId: ch.id,
        channelName: ch.name,
        channelType: ch.type,
        syncDirection: 'outbound',
        isEnabled: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const _getIntegrationById = internalQuery({
  args: { integrationId: v.id('discordIntegrations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.integrationId);
  },
});

export const _getIntegrationByGuildId = internalQuery({
  args: { guildId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('discordIntegrations')
      .withIndex('by_guild', (q) => q.eq('guildId', args.guildId))
      .first();
  },
});

/**
 * Ownership-checked lookup. Returns the row only if the caller owns the
 * creator profile (or is an admin). Returns null otherwise — letting the
 * action surface a generic error instead of leaking existence.
 */
export const _getOwnedIntegration = internalQuery({
  args: { integrationId: v.id('discordIntegrations') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) return null;
    const adminLike =
      user.role === 'admin' || user.role === 'super_admin' || user.role === 'tenant_admin';
    if (user.creatorId !== integration.creatorId && !adminLike) return null;
    return integration;
  },
});
