import { v } from 'convex/values';
import { query, internalMutation } from './_generated/server';
import { requireCreator } from './shared/permissions';
import { payoutStatus } from './shared/validators';
import { getPlatformFeeRate } from './shared/platformFees';

// =============================================================================
// Payouts — earnings tracking. Records are written by:
//   - Stripe webhook (invoice.paid) → _recordPayoutFromStripe
//   - Admin manual entry (Phase 7) → reservedfor admin tooling
// =============================================================================

/** The current creator's payouts, most recent first. */
export const byMe = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireCreator(ctx);
    if (!user.creatorId) return [];
    const limit = Math.min(args.limit ?? 50, 200);

    return await ctx.db
      .query('payouts')
      .withIndex('by_creator', (q) => q.eq('creatorId', user.creatorId!))
      .order('desc')
      .take(limit);
  },
});

/** Aggregate paid + pending totals for the current creator. */
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCreator(ctx);
    if (!user.creatorId) {
      return {
        paidTotal: 0,
        pendingTotal: 0,
        currency: 'USD',
        count: 0,
        platformFeeRate: getPlatformFeeRate(),
      };
    }

    const rows = await ctx.db
      .query('payouts')
      .withIndex('by_creator', (q) => q.eq('creatorId', user.creatorId!))
      .take(1000);

    let paidTotal = 0;
    let pendingTotal = 0;
    let currency = 'USD';
    for (const row of rows) {
      currency = row.currency;
      if (row.status === 'paid') paidTotal += row.amount;
      if (row.status === 'pending') pendingTotal += row.amount;
    }
    return {
      paidTotal,
      pendingTotal,
      currency,
      count: rows.length,
      platformFeeRate: getPlatformFeeRate(),
    };
  },
});

/**
 * Earnings history bucketed by month. Returns the last `months` (default 12)
 * payout buckets with paid + pending totals each. Powers the Earnings page
 * trend chart so the UI doesn't have to re-aggregate client-side.
 */
export const earningsHistory = query({
  args: {
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireCreator(ctx);
    if (!user.creatorId) {
      return { buckets: [], currency: 'USD', platformFeeRate: getPlatformFeeRate() };
    }
    const months = Math.max(1, Math.min(args.months ?? 12, 36));

    const rows = await ctx.db
      .query('payouts')
      .withIndex('by_creator', (q) => q.eq('creatorId', user.creatorId!))
      .take(1000);

    // Group by YYYY-MM of periodStart. Bounded to the last N months.
    const cutoff = Date.now() - months * 31 * 24 * 60 * 60 * 1000;
    const byKey = new Map<string, { key: string; paid: number; pending: number; count: number }>();
    let currency = 'USD';
    for (const row of rows) {
      if (row.periodStart < cutoff) continue;
      currency = row.currency;
      const d = new Date(row.periodStart);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const existing = byKey.get(key) ?? { key, paid: 0, pending: 0, count: 0 };
      if (row.status === 'paid') existing.paid += row.amount;
      if (row.status === 'pending') existing.pending += row.amount;
      existing.count += 1;
      byKey.set(key, existing);
    }
    const buckets = [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
    return { buckets, currency, platformFeeRate: getPlatformFeeRate() };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// Stripe webhook callback (internal)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Record a payout entry from a Stripe invoice.paid event. Idempotent on
 * stripePayoutId — repeat webhooks won't double-count.
 */
export const _recordPayoutFromStripe = internalMutation({
  args: {
    creatorId: v.id('creators'),
    amount: v.number(),
    currency: v.string(),
    status: payoutStatus,
    stripePayoutId: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    paidAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('payouts')
      .withIndex('by_stripePayoutId', (q) => q.eq('stripePayoutId', args.stripePayoutId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        paidAt: args.paidAt ?? existing.paidAt,
      });
      return existing._id;
    }

    return await ctx.db.insert('payouts', {
      creatorId: args.creatorId,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      stripePayoutId: args.stripePayoutId,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      paidAt: args.paidAt,
      metadata: args.metadata,
    });
  },
});
