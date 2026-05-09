import { v } from 'convex/values';
import {
  internalMutation,
  mutation,
  query,
} from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireUser } from './shared/permissions';

// =============================================================================
// Referrals (PRD M5 / FM-009, Phase 12).
//
// Two-step lifecycle:
//   1. mintMyCode() — calling user gets (or rotates) their referral code.
//      Codes are short, lowercased base36, namespaced "dp_" prefix.
//   2. _redeem(code, referredUserId) — internal, called by Stripe webhook
//      when the user's first checkout carries a referral coupon. Sets
//      convertedAt + payoutCents and links the referredUserId.
//
// Codes are case-insensitive at lookup but stored lowercase. One active
// row per (referrer, code). Public lookup is rate-limited by the rate-
// limiter component (gdprExport bucket — same low-volume profile).
// =============================================================================

function generateCode(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  const base = n.toString(36).slice(0, 8).padStart(8, '0');
  return `dp_${base}`;
}

/**
 * Mint (or rotate) the calling user's referral code. Idempotent — returns
 * the existing un-converted code if there is one, otherwise creates a new
 * row. Converted codes stay in history; a new mint creates a parallel row.
 */
export const mintMyCode = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query('referrals')
      .withIndex('by_referrer', (q) => q.eq('referrerUserId', user._id))
      .order('desc')
      .take(20);
    const live = existing.find((r) => !r.convertedAt);
    if (live) return live;

    const code = generateCode();
    const id = await ctx.db.insert('referrals', {
      referrerUserId: user._id,
      code,
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

/** Read the calling user's history (live + converted). */
export const myCodes = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query('referrals')
      .withIndex('by_referrer', (q) => q.eq('referrerUserId', user._id))
      .order('desc')
      .take(50);
  },
});

/**
 * Public — resolve a code to the referrer + payout policy. Used by the
 * checkout action to attach the right Stripe coupon.
 */
export const lookup = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.trim().toLowerCase();
    if (!code) return null;
    const row = await ctx.db
      .query('referrals')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();
    return row;
  },
});

/**
 * Internal — record a conversion. Called by the Stripe webhook handler
 * once a referred user's first invoice clears.
 */
export const _redeem = internalMutation({
  args: {
    code: v.string(),
    referredUserId: v.id('users'),
    payoutCents: v.number(),
    stripeCouponId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<'referrals'> | null> => {
    const code = args.code.trim().toLowerCase();
    const row = await ctx.db
      .query('referrals')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();
    if (!row) return null;
    if (row.convertedAt) return row._id; // Idempotent re-delivery.
    if (row.referrerUserId === args.referredUserId) return null; // Self-refer block.

    await ctx.db.patch(row._id, {
      referredUserId: args.referredUserId,
      convertedAt: Date.now(),
      payoutCents: args.payoutCents,
      stripeCouponId: args.stripeCouponId,
    });
    return row._id;
  },
});
