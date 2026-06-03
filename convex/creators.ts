import { mutation, query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { creatorStatus } from './shared/validators';
import { internal } from './_generated/api';
import { getCurrentUser, requireAdmin, requireCreatorOwnership } from './shared/permissions';

const ADMIN_ROLES = new Set(['super_admin', 'tenant_admin', 'admin']);

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

/** Studio dashboard KPIs for the owning creator (or platform admin). */
export const dashboardSummary = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) return null;

    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .take(5000);

    const activeSubs = subs.filter((s) => s.status === 'active');
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newSubs7d = subs.filter((s) => s.startedAt >= weekAgo).length;
    const cancelled = subs.filter((s) => s.status === 'cancelled').length;
    const churnRate = subs.length > 0 ? Number(((cancelled / subs.length) * 100).toFixed(1)) : null;

    const picks = await ctx.db
      .query('picks')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .take(500);

    const publishedPicks = picks.filter((p) => p.status === 'published').length;
    const picksThisWeek = picks.filter((p) => (p.publishedAt ?? p.createdAt) >= weekAgo).length;

    const payouts = await ctx.db
      .query('payouts')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .take(200);

    let paidTotal = 0;
    let pendingTotal = 0;
    for (const row of payouts) {
      if (row.status === 'paid') paidTotal += row.amount;
      if (row.status === 'pending') pendingTotal += row.amount;
    }

    const mrrEstimateCents = Math.round((creator.startingPrice ?? 0) * 100 * activeSubs.length);

    return {
      activeSubs: activeSubs.length,
      totalSubs: subs.length,
      newSubs7d,
      churnRate,
      publishedPicks,
      picksThisWeek,
      paidTotal,
      pendingTotal,
      mrrEstimateCents,
      connectStatus: creator.connectStatus ?? 'not_started',
      winRate: creator.winRate,
      record: creator.record,
      units: creator.units,
    };
  },
});

export type StudioActivityKind = 'pick' | 'subscription' | 'payout';

/** Recent studio activity for the dashboard feed (owner-only). */
export const activityFeed = query({
  args: {
    creatorId: v.id('creators'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);
    const limit = Math.min(args.limit ?? 12, 30);
    const items: Array<{
      id: string;
      kind: StudioActivityKind;
      title: string;
      sub?: string;
      at: number;
      amountLabel?: string;
    }> = [];

    const picks = await ctx.db
      .query('picks')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .order('desc')
      .take(limit);

    for (const pick of picks) {
      items.push({
        id: `pick-${pick._id}`,
        kind: 'pick',
        title: pick.title,
        sub: pick.status === 'published' ? 'Published' : pick.status,
        at: pick.publishedAt ?? pick.createdAt,
      });
    }

    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .order('desc')
      .take(limit);

    for (const sub of subs) {
      const user = await ctx.db.get(sub.subscriberId);
      items.push({
        id: `sub-${sub._id}`,
        kind: 'subscription',
        title: user?.name ?? 'New subscriber',
        sub: `${sub.plan} · ${sub.status}`,
        at: sub.startedAt,
      });
    }

    items.sort((a, b) => b.at - a.at);
    return items.slice(0, limit);
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
