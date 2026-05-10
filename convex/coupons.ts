import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { requireAdmin } from './shared/permissions';

// =============================================================================
// Coupon codes (Phase 16d, M19).
//
// Admin-issued promotional codes mapped to Stripe coupon IDs. Distinct
// from referral codes (which are per-user, M19/referrals.ts). Checkout
// (`stripe.createCheckoutSession`) accepts an optional `couponCode` arg
// → looks the code up here → forwards `discounts[0][coupon]` to Stripe.
//
// Stripe enforces the actual discount + redemption count + expiry; this
// table mirrors the configuration so admins have a single place to
// manage promo campaigns and DigiPicks can reject obviously-stale codes
// before hitting Stripe.
// =============================================================================

/** Public — list non-archived coupons admin has issued. Anyone can read
 *  to power a "have a code?" entry on Checkout (it's a string lookup, not a
 *  secret). */
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('couponCodes')
      .withIndex('by_archived', (q) => q.eq('archived', false))
      .order('desc')
      .take(args.limit ?? 50);
  },
});

/** Public — resolve a code. Returns null when missing / expired / fully redeemed. */
export const lookup = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.trim().toUpperCase();
    if (!code) return null;
    const row = await ctx.db
      .query('couponCodes')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();
    if (!row) return null;
    if (row.archived) return null;
    if (row.expiresAt > 0 && row.expiresAt < Date.now()) return null;
    if (row.maxRedemptions > 0 && row.redemptionCount >= row.maxRedemptions) {
      return null;
    }
    return row;
  },
});

/** Admin-only: create a new coupon mapping. The Stripe coupon must already
 *  exist (created in Stripe dashboard or via Stripe API). */
export const create = mutation({
  args: {
    code: v.string(),
    stripeCouponId: v.string(),
    percentOff: v.optional(v.number()),
    amountOffCents: v.optional(v.number()),
    maxRedemptions: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const code = args.code.trim().toUpperCase();
    if (!code) throw new Error('Code required');
    if (code.length > 32) throw new Error('Code must be ≤32 characters');

    const existing = await ctx.db
      .query('couponCodes')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();
    if (existing) throw new Error('Code already exists');

    const id = await ctx.db.insert('couponCodes', {
      code,
      stripeCouponId: args.stripeCouponId,
      percentOff: args.percentOff,
      amountOffCents: args.amountOffCents,
      maxRedemptions: args.maxRedemptions ?? 0,
      redemptionCount: 0,
      expiresAt: args.expiresAt ?? 0,
      createdByUserId: admin._id,
      archived: false,
      notes: args.notes,
      createdAt: Date.now(),
    });

    await ctx.runMutation(internal.audit.log, {
      actorUserId: admin._id,
      entityType: 'coupon',
      entityId: id,
      action: 'coupon.created',
      metadata: { code, stripeCouponId: args.stripeCouponId },
    });
    return id;
  },
});

/** Admin-only: archive a coupon. Lookup ignores archived rows. */
export const archive = mutation({
  args: { couponId: v.id('couponCodes') },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.get(args.couponId);
    if (!row) throw new Error('Coupon not found');
    await ctx.db.patch(args.couponId, { archived: true });
    await ctx.runMutation(internal.audit.log, {
      actorUserId: admin._id,
      entityType: 'coupon',
      entityId: args.couponId,
      action: 'coupon.archived',
    });
    return args.couponId;
  },
});

/** Internal: bump the redemption counter. Called by the Stripe webhook
 *  on first conversion of a checkout that carried the code. */
export const _incrementRedemption = internalMutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.trim().toUpperCase();
    const row = await ctx.db
      .query('couponCodes')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();
    if (!row) return null;
    await ctx.db.patch(row._id, {
      redemptionCount: row.redemptionCount + 1,
    });
    return row._id;
  },
});
