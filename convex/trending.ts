import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';

// =============================================================================
// Trending picks (PRD M1, Phase 12).
//
// Composite trendingScore per published pick, recomputed nightly:
//   recency        — exp decay over 72h since publishedAt
//   savesCount     — log(saves + 1) (capped at log(100))
//   creatorReach   — log(creator subscriber count + 1)
//   pendingBonus   — +5 while grade is 'pending' (live action sells)
//
// Final = recency * 50 + savesCount * 30 + creatorReach * 15 + pendingBonus
// Stored on picks.trendingScore so the public query is a bounded index lookup.
// =============================================================================

const HALF_LIFE_HOURS = 36;

export const recomputeTrending = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - 72 * 60 * 60 * 1000;

    const recent = await ctx.db
      .query('picks')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(500);

    let updated = 0;

    for (const pick of recent) {
      const publishedAt = pick.publishedAt ?? pick.createdAt;
      if (publishedAt < cutoff) continue;

      const saves = await ctx.db
        .query('savedPicks')
        .withIndex('by_pick', (q) => q.eq('pickId', pick._id))
        .take(200);
      const savesCount = saves.length;

      const creator = await ctx.db.get(pick.creatorId);
      const subscribers = creator?.subscriberCount ?? 0;

      const ageHours = Math.max(0, (now - publishedAt) / (60 * 60 * 1000));
      const recency = Math.exp((-Math.LN2 / HALF_LIFE_HOURS) * ageHours);

      const savesScore =
        savesCount === 0 ? 0 : Math.min(1, Math.log10(savesCount + 1) / 2);
      const reachScore =
        subscribers === 0 ? 0 : Math.min(1, Math.log10(subscribers + 1) / 4);
      const pendingBonus = pick.grade === 'pending' ? 5 : 0;

      const score =
        Math.round((recency * 50 + savesScore * 30 + reachScore * 15) * 100) /
          100 +
        pendingBonus;

      await ctx.db.patch(pick._id, {
        trendingScore: score,
        trendingComputedAt: now,
      });
      updated++;
    }

    return { updated };
  },
});

/** Public trending feed — top published picks by score. */
export const trending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 12, 50);
    const rows = await ctx.db
      .query('picks')
      .withIndex('by_status_and_trending', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(limit * 2);

    // Score may be undefined for picks that predate the cron run — drop them.
    const scored = rows.filter(
      (p): p is Doc<'picks'> & { trendingScore: number } =>
        typeof p.trendingScore === 'number',
    );
    scored.sort((a, b) => b.trendingScore - a.trendingScore);

    const trimmed = scored.slice(0, limit);

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
    return enriched;
  },
});
