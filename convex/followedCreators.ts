import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser } from './shared/permissions';

// =============================================================================
// Followed Creators (PRD M15) — the "Saved creators" half of the library.
// Distinct from `subscriptions` — following is free and signals interest;
// subscribing is the paid relationship.
// =============================================================================

/** Follow a creator. Idempotent on (user, creator). */
export const follow = mutation({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query('followedCreators')
      .withIndex('by_user_and_creator', (q) =>
        q.eq('userId', user._id).eq('creatorId', args.creatorId),
      )
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert('followedCreators', {
      userId: user._id,
      creatorId: args.creatorId,
      followedAt: Date.now(),
    });
  },
});

/** Unfollow. No-op if not currently followed. */
export const unfollow = mutation({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const row = await ctx.db
      .query('followedCreators')
      .withIndex('by_user_and_creator', (q) =>
        q.eq('userId', user._id).eq('creatorId', args.creatorId),
      )
      .first();
    if (row) await ctx.db.delete(row._id);
    return { ok: true };
  },
});

/** Whether the current user follows the creator — used by FollowButton. */
export const isFollowing = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const row = await ctx.db
      .query('followedCreators')
      .withIndex('by_user_and_creator', (q) =>
        q.eq('userId', user._id).eq('creatorId', args.creatorId),
      )
      .first();
    return row !== null;
  },
});

/** Saved-library list joined with creator profile fields. */
export const listMine = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = Math.min(args.limit ?? 100, 500);

    const rows = await ctx.db
      .query('followedCreators')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(limit);

    const enriched = await Promise.all(
      rows.map(async (row) => {
        const creator = await ctx.db.get(row.creatorId);
        if (!creator) return null;
        return {
          followedId: row._id,
          followedAt: row.followedAt,
          creator,
        };
      }),
    );
    return enriched.filter((x): x is NonNullable<typeof x> => x !== null);
  },
});

/** Follower count for a creator (used on creator profiles). */
export const countByCreator = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('followedCreators')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .take(10000);
    return rows.length;
  },
});
