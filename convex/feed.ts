import { v } from 'convex/values';
import { query } from './_generated/server';
import { Doc, Id } from './_generated/dataModel';
import { requireUser } from './shared/permissions';

// =============================================================================
// Personalized Feed (PRD M11) — picks from the creators the user is
// subscribed to, joined with creator profile fields the PickCard needs.
//
// Fallback: if the user has no active subscriptions, surface the latest
// published picks across the platform so the feed never feels empty for
// someone exploring DigiPicks for the first time.
// =============================================================================

const DEFAULT_LIMIT = 20;
const SCAN_MULTIPLIER = 5;

export const personalized = query({
  args: {
    limit: v.optional(v.number()),
    sport: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = Math.min(args.limit ?? DEFAULT_LIMIT, 100);

    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriber_and_creator', (q) =>
        q.eq('subscriberId', user._id),
      )
      .take(500);

    const activeCreatorIds = new Set(
      subs.filter((s) => s.status === 'active').map((s) => s.creatorId),
    );

    const fallback = activeCreatorIds.size === 0;

    // Pull a generous window of latest published picks; in-memory filter
    // by subscribed creators (or by sport if provided). For a fresh user
    // with no subs, fallback returns all published picks unfiltered.
    let picks: Doc<'picks'>[];
    if (args.sport) {
      const rows = await ctx.db
        .query('picks')
        .withIndex('by_sport', (q) => q.eq('sport', args.sport!))
        .order('desc')
        .take(limit * SCAN_MULTIPLIER);
      picks = rows.filter((p) => p.status === 'published');
    } else {
      picks = await ctx.db
        .query('picks')
        .withIndex('by_status', (q) => q.eq('status', 'published'))
        .order('desc')
        .take(limit * SCAN_MULTIPLIER);
    }

    const filtered = fallback
      ? picks
      : picks.filter((p) => activeCreatorIds.has(p.creatorId));

    const trimmed = filtered.slice(0, limit);

    // Join creator profiles for the PickCard surface.
    const creatorCache = new Map<Id<'creators'>, Doc<'creators'> | null>();
    const enriched = await Promise.all(
      trimmed.map(async (pick) => {
        let creator = creatorCache.get(pick.creatorId);
        if (creator === undefined) {
          creator = (await ctx.db.get(pick.creatorId)) ?? null;
          creatorCache.set(pick.creatorId, creator);
        }
        return { pick, creator };
      }),
    );

    return {
      items: enriched,
      personalized: !fallback,
      subscribedCreatorCount: activeCreatorIds.size,
    };
  },
});
