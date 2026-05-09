import { internalMutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

// =============================================================================
// Trust scoring (PRD M3 / FM-002).
//
// Composite 0–100 score recomputed nightly from observable signals:
//   - verification:     0 / 50 / 100 (status field)
//   - winRate:          0–100 (rolling 30-day decided picks)
//   - disputeRatio:     100 - clamped(opened-disputes / decided-picks * 200)
//   - ageDays:          ramp 0 → 100 over the first 180 days
//   - sampleSize:       ramp 0 → 100 from 0 → 50 graded picks
//
// Final score is the weighted average:
//   verification 0.30 + winRate 0.25 + disputeRatio 0.20 + ageDays 0.15 + sampleSize 0.10
// =============================================================================

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30-day rolling window

interface Signals {
  verification: number;
  winRate: number;
  disputeRatio: number;
  ageDays: number;
  sampleSize: number;
}

function score(s: Signals): number {
  return Math.round(
    s.verification * 0.3 +
      s.winRate * 0.25 +
      s.disputeRatio * 0.2 +
      s.ageDays * 0.15 +
      s.sampleSize * 0.1,
  );
}

/** Recompute trust scores for every active creator. Called by the cron. */
export const recomputeTrustScores = internalMutation({
  args: {},
  handler: async (ctx) => {
    const creators = await ctx.db.query('creators').take(2000);
    const now = Date.now();
    let updated = 0;

    for (const c of creators) {
      const signals = await computeSignalsFor(ctx, c._id, c.createdAt, c.verified, c.status);
      const final = score(signals);
      await ctx.db.patch(c._id, {
        trustScore: final,
        trustScoreUpdatedAt: now,
        trustSignals: signals,
      });
      updated++;
    }
    return { updated };
  },
});

async function computeSignalsFor(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  creatorId: Id<'creators'>,
  createdAt: number,
  verified: boolean,
  status: string,
): Promise<Signals> {
  // Verification signal — verified=true is a strong trust uplift; status
  // 'active' alone counts for partial credit.
  const verification = verified ? 100 : status === 'active' ? 50 : 0;

  // Rolling-window picks for win-rate + sample-size signals.
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const recentPicks = await ctx.db
    .query('picks')
    .withIndex('by_creator', (q) => q.eq('creatorId', creatorId))
    .order('desc')
    .take(500);

  const windowed = recentPicks.filter((p) => (p.publishedAt ?? p.createdAt) >= cutoff);
  const decided = windowed.filter((p) => p.grade === 'win' || p.grade === 'loss');
  const wins = decided.filter((p) => p.grade === 'win').length;
  const winRate =
    decided.length === 0 ? 50 : Math.round((wins / decided.length) * 100);

  // Dispute ratio against decided picks (any window — disputes are rare).
  const disputes = await ctx.db
    .query('disputes')
    .withIndex('by_creator', (q) => q.eq('creatorId', creatorId))
    .take(500);
  const opened = disputes.length;
  const decidedAll = recentPicks.filter(
    (p) => p.grade === 'win' || p.grade === 'loss' || p.grade === 'push',
  ).length;
  const ratio = decidedAll === 0 ? 0 : opened / decidedAll;
  const disputeRatio = Math.max(0, Math.min(100, 100 - ratio * 200));

  // Age signal — 0 → 100 ramp over the first 180 days, then capped.
  const ageDays = Math.min(100, ((now - createdAt) / (180 * 24 * 60 * 60 * 1000)) * 100);

  // Sample size — 0 → 100 ramp over 0..50 decided picks (window).
  const sampleSize = Math.min(100, (decided.length / 50) * 100);

  return {
    verification,
    winRate,
    disputeRatio: Math.round(disputeRatio),
    ageDays: Math.round(ageDays),
    sampleSize: Math.round(sampleSize),
  };
}

/** Public — read the cached trust score for a creator. */
export const get = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const c = await ctx.db.get(args.creatorId);
    if (!c) return null;
    return {
      score: c.trustScore ?? null,
      updatedAt: c.trustScoreUpdatedAt ?? null,
      signals: c.trustSignals ?? null,
    };
  },
});
