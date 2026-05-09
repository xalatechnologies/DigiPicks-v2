import { v } from 'convex/values';
import { mutation, query, internalQuery } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { requireUser } from './shared/permissions';

// =============================================================================
// Watchlists (PRD M14 + M15, Phase 14c).
//
// User-defined alert rules. notify.onPickPublished iterates active
// watchlists and fans an extra dispatch for each match. Filter is a
// shallow AND across the supplied keys — empty fields are wildcards.
//
// Match semantics:
//   sport          exact (case-sensitive)
//   league         exact
//   creatorIds     pick.creatorId in the list
//   market         exact
//   minConfidence  pick.confidence >= this in {Low<Medium<High}
//   access         exact ('free' / 'premium' / 'vip')
//   bodyContains   case-insensitive substring on title + body + teaser
//   lineMoveAbovePercent  consumed by lineMovement.poll, not pick triggers
// =============================================================================

const filterValidator = v.object({
  sport: v.optional(v.string()),
  league: v.optional(v.string()),
  creatorIds: v.optional(v.array(v.id('creators'))),
  market: v.optional(v.string()),
  minConfidence: v.optional(v.string()),
  access: v.optional(v.string()),
  bodyContains: v.optional(v.string()),
  lineMoveAbovePercent: v.optional(v.number()),
});

/** List the calling user's watchlists, most recent first. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query('watchlists')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(100);
  },
});

/** Create a new watchlist. */
export const create = mutation({
  args: {
    name: v.string(),
    filter: filterValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const name = args.name.trim();
    if (!name) throw new Error('Name is required');
    if (name.length > 80) throw new Error('Name must be under 80 characters');

    const now = Date.now();
    return await ctx.db.insert('watchlists', {
      userId: user._id,
      name,
      filter: args.filter,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Update name / filter / active flag on a watchlist the caller owns. */
export const update = mutation({
  args: {
    watchlistId: v.id('watchlists'),
    name: v.optional(v.string()),
    filter: v.optional(filterValidator),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const row = await ctx.db.get(args.watchlistId);
    if (!row) throw new Error('Watchlist not found');
    if (row.userId !== user._id) throw new Error('Forbidden');

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.filter !== undefined) patch.filter = args.filter;
    if (args.isActive !== undefined) patch.isActive = args.isActive;
    await ctx.db.patch(args.watchlistId, patch);
    return args.watchlistId;
  },
});

/** Delete a watchlist the caller owns. */
export const remove = mutation({
  args: { watchlistId: v.id('watchlists') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const row = await ctx.db.get(args.watchlistId);
    if (!row) return { ok: false as const };
    if (row.userId !== user._id) throw new Error('Forbidden');
    await ctx.db.delete(args.watchlistId);
    return { ok: true as const };
  },
});

// ─── Internal — match against a pick during fan-out ────────────────────────

/** Returns active watchlists whose filter matches the supplied pick. */
export const _matchPick = internalQuery({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => {
    const pick = await ctx.db.get(args.pickId);
    if (!pick) return [];
    // Active-only scan. Watchlists are bounded — small tens per user, low
    // hundreds per platform at MVP scale. Promote to a sport-prefix index
    // when this grows past a few thousand rows.
    const active = await ctx.db
      .query('watchlists')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .take(5000);
    return active.filter((w) => matchesPick(w, pick));
  },
});

function matchesPick(w: Doc<'watchlists'>, pick: Doc<'picks'>): boolean {
  const f = w.filter;
  if (f.sport && pick.sport !== f.sport) return false;
  if (f.league && pick.league !== f.league) return false;
  if (f.creatorIds && f.creatorIds.length > 0) {
    if (!f.creatorIds.includes(pick.creatorId)) return false;
  }
  if (f.market && pick.market !== f.market) return false;
  if (f.minConfidence) {
    const order = ['Low', 'Medium', 'High'];
    const want = order.indexOf(f.minConfidence);
    const got = order.indexOf(pick.confidence);
    if (want === -1 || got === -1) return false;
    if (got < want) return false;
  }
  if (f.access && pick.access !== f.access) return false;
  if (f.bodyContains) {
    const needle = f.bodyContains.toLowerCase();
    const haystack = `${pick.title} ${pick.body ?? ''} ${pick.teaser ?? ''}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}
