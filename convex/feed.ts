import { v } from 'convex/values';
import { query } from './_generated/server';
import { Doc, Id } from './_generated/dataModel';
import { requireUser } from './shared/permissions';

// NOTE: rate limiting on `feed.personalized` is intentionally omitted —
// Convex queries do not have a runMutation ctx and cannot consume bucket
// state. Public-facing reactive read paths rely on Convex's platform-level
// throttling. Mutation/action paths in this codebase (applications.submit,
// messages.postToChannel, stripe.createCheckoutSession, gdpr.exportMyData)
// carry the per-user rate-limiter from `convex/shared/rateLimit.ts`.

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
    /** BPMN-004 §AI ranking — opt-in re-ordering. When true, items are
     *  scored on a blend of trust × AI confidence × recency × creator
     *  pick-confidence so high-signal picks bubble up. Defaults false to
     *  preserve the legacy chronological order for surfaces that depend
     *  on it. */
    rankByAi: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = Math.min(args.limit ?? DEFAULT_LIMIT, 100);

    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriber_and_creator', (q) => q.eq('subscriberId', user._id))
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

    const filtered = fallback ? picks : picks.filter((p) => activeCreatorIds.has(p.creatorId));

    // Join creator profiles for the PickCard surface AND for the AI
    // ranking blend (which needs trustScore).
    const creatorCache = new Map<Id<'creators'>, Doc<'creators'> | null>();
    async function joinCreator(pick: Doc<'picks'>) {
      let creator = creatorCache.get(pick.creatorId);
      if (creator === undefined) {
        creator = (await ctx.db.get(pick.creatorId)) ?? null;
        creatorCache.set(pick.creatorId, creator);
      }
      return { pick, creator };
    }

    let enriched = await Promise.all(filtered.map(joinCreator));

    if (args.rankByAi) {
      enriched = rankByAiBlend(enriched);
    }

    return {
      items: enriched.slice(0, limit),
      personalized: !fallback,
      subscribedCreatorCount: activeCreatorIds.size,
      ranked: args.rankByAi === true,
    };
  },
});

// ─── AI ranking heuristic (BPMN-004) ───────────────────────────────────────

/**
 * Score blend used when `rankByAi` is requested. Pure function — no DB
 * access — so it stays cheap inside the query. The blend favors picks
 * that are recent, from high-trust creators, and that the AI was
 * confident about. Pick-confidence enum (Low/Medium/High) acts as a
 * lightweight prior since not every pick has an AI analysis row.
 *
 * The exact weights are documented here so a future operator can tune
 * without re-deriving the intent:
 *   - 0.40  AI confidence (0..100, defaults 50 if missing)
 *   - 0.25  creator trust score (0..100, defaults 50 if missing)
 *   - 0.20  recency decay (full at <1h old, 0 by ~7d)
 *   - 0.15  creator-stated confidence (Low=33, Medium=66, High=100)
 */
function rankByAiBlend(
  items: { pick: Doc<'picks'>; creator: Doc<'creators'> | null }[],
): { pick: Doc<'picks'>; creator: Doc<'creators'> | null }[] {
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const DECAY_HALF_LIFE = 24 * HOUR; // 24h → 0.5
  const HARD_FLOOR = 7 * 24 * HOUR; // 7d → 0
  const scored = items.map((entry) => {
    const ai = entry.pick.aiConfidence ?? 50;
    const trust = entry.creator?.trustScore ?? 50;
    const ageMs = now - (entry.pick.publishedAt ?? entry.pick.createdAt);
    const ageScore =
      ageMs <= HOUR ? 100 : ageMs >= HARD_FLOOR ? 0 : 100 * Math.pow(0.5, ageMs / DECAY_HALF_LIFE);
    const conf = entry.pick.confidence;
    const confScore = conf === 'High' ? 100 : conf === 'Medium' ? 66 : 33;
    const score = 0.4 * ai + 0.25 * trust + 0.2 * ageScore + 0.15 * confScore;
    return { entry, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.entry);
}
