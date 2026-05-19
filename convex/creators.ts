import { mutation, query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { creatorStatus } from './shared/validators';
import { internal } from './_generated/api';
import { requireAdmin, requireCreatorOwnership } from './shared/permissions';

// =============================================================================
// Creator Queries & Mutations
// =============================================================================

// Public.
export const list = query({
  args: {
    sport: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    trending: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let creators;

    if (args.trending !== undefined) {
      creators = await ctx.db
        .query('creators')
        .withIndex('by_trending', (q) => q.eq('trending', args.trending!))
        .take(100);
    } else if (args.verified !== undefined) {
      creators = await ctx.db
        .query('creators')
        .withIndex('by_verified', (q) => q.eq('verified', args.verified!))
        .take(100);
    } else {
      creators = await ctx.db.query('creators').take(100);
    }

    if (args.sport) {
      return creators.filter((c) => c.sports.includes(args.sport!));
    }
    return creators;
  },
});

// Public.
export const getByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    return await ctx.db
      .query('creators')
      .withIndex('by_handle', (q) => q.eq('handle', handle))
      .first();
  },
});

// Public.
export const get = query({
  args: { id: v.id('creators') },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Public.
/**
 * Currently-promoted creators (Phase 15a). Drives the Landing rotation
 * + featured rail. Returns creators whose promotedUntil is still in the
 * future, ordered by promotedRank desc so highest-bidder wins the slot.
 */
export const promoted = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const rows = await ctx.db
      .query('creators')
      .withIndex('by_promoted', (q) => q.gt('promotedUntil', now))
      .take(50);
    rows.sort((a, b) => (b.promotedRank ?? 0) - (a.promotedRank ?? 0));
    return rows.slice(0, args.limit ?? 6);
  },
});

// Admin-only.
/**
 * Promote / un-promote a creator. Admin-only. `untilMs=0` removes the
 * promotion immediately. Audit-logged.
 */
export const setPromotion = mutation({
  args: {
    creatorId: v.id('creators'),
    untilMs: v.number(),
    rank: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new Error('Creator not found');

    if (args.untilMs <= Date.now()) {
      await ctx.db.patch(args.creatorId, {
        promotedUntil: undefined,
        promotedRank: undefined,
      });
    } else {
      await ctx.db.patch(args.creatorId, {
        promotedUntil: args.untilMs,
        promotedRank: args.rank ?? 0,
      });
    }

    await ctx.runMutation(internal.audit.log, {
      actorUserId: admin._id,
      entityType: 'creator',
      entityId: args.creatorId,
      action: args.untilMs <= Date.now() ? 'creator.unpromoted' : 'creator.promoted',
      metadata: { untilMs: args.untilMs, rank: args.rank ?? 0 },
    });

    return args.creatorId;
  },
});

// Auth-only (creator owner).
/** Update public studio profile fields shown on the creator page. */
export const updateStudioProfile = mutation({
  args: {
    creatorId: v.id('creators'),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    niche: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);
    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.bio !== undefined) patch.bio = args.bio;
    if (args.niche !== undefined) patch.niche = args.niche;
    if (Object.keys(patch).length > 0) await ctx.db.patch(args.creatorId, patch);
    return args.creatorId;
  },
});

// Internal-only.
/** Create a new creator profile. Internal only — used during application approval. */
export const create = internalMutation({
  args: {
    handle: v.string(),
    name: v.string(),
    avatarColor: v.string(),
    avatarMono: v.string(),
    niche: v.string(),
    sports: v.array(v.string()),
    bio: v.string(),
    startingPrice: v.number(),
    tags: v.array(v.string()),
    status: v.optional(creatorStatus),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('creators', {
      handle: args.handle,
      name: args.name,
      avatarColor: args.avatarColor,
      avatarMono: args.avatarMono,
      verified: false,
      niche: args.niche,
      sports: args.sports,
      bio: args.bio,
      subscriberCount: 0,
      startingPrice: args.startingPrice,
      winRate: 0,
      record: '0-0',
      last10: '',
      units: '+0.0u',
      streak: '',
      tags: args.tags,
      trending: false,
      status: args.status ?? 'pending',
      createdAt: Date.now(),
    });
  },
});
