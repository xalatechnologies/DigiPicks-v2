import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';
import { requireUser } from './shared/permissions';

// =============================================================================
// Saved Picks — bookmark-style library for subscribers (PRD M15)
// =============================================================================

/** Save a pick. Idempotent — returns the existing row if already saved. */
export const save = mutation({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query('savedPicks')
      .withIndex('by_user_and_pick', (q) =>
        q.eq('userId', user._id).eq('pickId', args.pickId),
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert('savedPicks', {
      userId: user._id,
      pickId: args.pickId,
      savedAt: Date.now(),
    });
  },
});

/** Remove a saved pick. No-op if it wasn't saved. */
export const unsave = mutation({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query('savedPicks')
      .withIndex('by_user_and_pick', (q) =>
        q.eq('userId', user._id).eq('pickId', args.pickId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return { ok: true };
  },
});

/** Whether the current user has saved a specific pick. */
export const isSaved = query({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const row = await ctx.db
      .query('savedPicks')
      .withIndex('by_user_and_pick', (q) =>
        q.eq('userId', user._id).eq('pickId', args.pickId),
      )
      .first();
    return row !== null;
  },
});

/**
 * Saved status for a batch of picks at once. Used by the personalized
 * feed to render the "Saved" state on each PickCard without N+1 queries.
 */
export const savedIdsBatch = query({
  args: { pickIds: v.array(v.id('picks')) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.pickIds.length === 0) return {} as Record<string, boolean>;

    const rows = await ctx.db
      .query('savedPicks')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .take(1000);

    const savedSet = new Set(rows.map((r) => r.pickId));
    const result: Record<Id<'picks'>, boolean> = {};
    for (const id of args.pickIds) {
      result[id] = savedSet.has(id);
    }
    return result;
  },
});

/**
 * The current user's saved library — joined with the pick + creator
 * fields needed to render PickCards. Most-recent first.
 */
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = Math.min(args.limit ?? 50, 200);

    const rows = await ctx.db
      .query('savedPicks')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(limit);

    const enriched = await Promise.all(
      rows.map(async (row) => {
        const pick = await ctx.db.get(row.pickId);
        if (!pick) return null;
        const creator = await ctx.db.get(pick.creatorId);
        return {
          savedId: row._id,
          savedAt: row.savedAt,
          pick,
          creator,
        };
      }),
    );
    return enriched.filter((x): x is NonNullable<typeof x> => x !== null);
  },
});
