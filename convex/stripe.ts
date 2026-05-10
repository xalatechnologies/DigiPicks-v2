import { v } from 'convex/values';
import { action, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { subscriptionPlan } from './shared/validators';
import { getCurrentUser } from './shared/permissions';
import { withRetry } from './shared/retry';
import { rateLimiter } from './shared/rateLimit';

// =============================================================================
// Stripe Checkout — V8 runtime, raw fetch (no SDK).
//
// Required env vars (set via `npx convex env set`):
//   - STRIPE_SECRET_KEY      sk_test_...
//   - STRIPE_WEBHOOK_SECRET  whsec_... (used by /stripe-webhook in http.ts)
//   - WEB_BASE_URL           https://app.digipicks.com (no trailing slash)
//
// Each creator must have a Stripe Price ID per plan tier on their creator
// record (`stripePriceIdPremium`, `stripePriceIdVip`). Free plans skip
// Stripe entirely and use the existing subscriptions.subscribe mutation.
// =============================================================================

const STRIPE_API = 'https://api.stripe.com/v1';

async function stripeFetch(
  path: string,
  init: {
    method?: string;
    body?: URLSearchParams;
    /**
     * Stripe idempotency key — Stripe deduplicates POST requests carrying the
     * same key for 24h. Use a stable key per logical operation so retries on
     * network blips do not double-charge or create duplicate customers.
     * See https://stripe.com/docs/api/idempotent_requests.
     */
    idempotencyKey?: string;
  } = {},
): Promise<Record<string, unknown>> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_SECRET_KEY not configured');

  return await withRetry(
    async () => {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      if (init.idempotencyKey) headers['Idempotency-Key'] = init.idempotencyKey;

      const res = await fetch(`${STRIPE_API}${path}`, {
        method: init.method ?? 'POST',
        headers,
        body: init.body?.toString(),
      });

      const json = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        const errMsg =
          (json.error as { message?: string } | undefined)?.message ??
          `Stripe ${path} failed (${res.status})`;
        const err = new Error(errMsg);
        // Surface the status code in the message so withRetry's default
        // shouldRetry can decide whether to back off.
        (err as Error & { status?: number }).status = res.status;
        throw err;
      }
      return json;
    },
    {
      label: `stripe ${path}`,
      shouldRetry: (err) => {
        if (!(err instanceof Error)) return false;
        const status = (err as Error & { status?: number }).status;
        // 4xx (other than 429) are caller errors — never retry.
        if (status && status >= 400 && status < 500 && status !== 429) {
          return false;
        }
        return true;
      },
    },
  );
}

// ─── Internal helpers (private to this module) ──────────────────────────────

export const _meForCheckout = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const _creatorForCheckout = internalQuery({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.creatorId);
  },
});

export const _lookupCoupon = internalQuery({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.trim().toUpperCase();
    const row = await ctx.db
      .query('couponCodes')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();
    if (!row || row.archived) return null;
    if (row.expiresAt > 0 && row.expiresAt < Date.now()) return null;
    if (row.maxRedemptions > 0 && row.redemptionCount >= row.maxRedemptions) {
      return null;
    }
    return row;
  },
});

export const _lookupTier = internalQuery({
  args: { tierId: v.id('pricingTiers') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.tierId);
  },
});

/**
 * Create a Stripe Checkout Session for a subscriber to subscribe to a
 * creator on the chosen plan tier. Returns the redirect URL — the
 * frontend should `window.location.assign(url)`.
 *
 * Free plan callers should use `subscriptions.subscribe` directly; this
 * action only supports premium / vip.
 */
export const createCheckoutSession = action({
  args: {
    creatorId: v.id('creators'),
    plan: subscriptionPlan,
    /** Referral code applied at checkout — surfaces back via webhook. */
    referralCode: v.optional(v.string()),
    /** Admin-issued coupon code (Phase 16d). Resolved server-side to a
     *  Stripe coupon ID before being passed to checkout. */
    couponCode: v.optional(v.string()),
    /** Pricing tier for trial-day support (Phase 16d). When set, overrides
     *  the legacy plan-based price lookup with the tier's stripePriceId. */
    tierId: v.optional(v.id('pricingTiers')),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    if (args.plan === 'free') {
      throw new Error('Use subscriptions.subscribe for free plans.');
    }

    const me = await ctx.runQuery(internal.stripe._meForCheckout, {});
    if (!me) throw new Error('Unauthorized');

    await rateLimiter.limit(ctx, 'stripeCheckout', {
      key: me._id,
      throws: true,
    });

    const creator = await ctx.runQuery(internal.stripe._creatorForCheckout, {
      creatorId: args.creatorId,
    });
    if (!creator) throw new Error('Creator not found');

    const priceId =
      args.plan === 'premium'
        ? creator.stripePriceIdPremium
        : creator.stripePriceIdVip;
    if (!priceId) {
      throw new Error(
        `Creator has no Stripe price configured for the ${args.plan} plan.`,
      );
    }

    // Get or create the Stripe customer for this user.
    let customerId = me.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeFetch('/customers', {
        body: new URLSearchParams({
          ...(me.email ? { email: me.email } : {}),
          ...(me.name ? { name: me.name } : {}),
          'metadata[userId]': me._id,
        }),
        // Stable per-user key so retries don't create duplicate customers.
        idempotencyKey: `customer-create:${me._id}`,
      });
      customerId = customer.id as string;
      await ctx.runMutation(internal.users._setStripeCustomerId, {
        userId: me._id,
        stripeCustomerId: customerId,
      });
    }

    const baseUrl = process.env.WEB_BASE_URL ?? 'http://localhost:5173';
    const successUrl = `${baseUrl}/creators/${args.creatorId}?subscribed=1&session={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/creators/${args.creatorId}?cancelled=1`;

    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('customer', customerId);
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', successUrl);
    params.set('cancel_url', cancelUrl);
    params.set('metadata[creatorId]', args.creatorId);
    params.set('metadata[plan]', args.plan);
    params.set('metadata[userId]', me._id);
    params.set('subscription_data[metadata][creatorId]', args.creatorId);
    params.set('subscription_data[metadata][plan]', args.plan);
    params.set('subscription_data[metadata][userId]', me._id);

    // Surface the referral code through to the invoice.paid webhook so
    // referrals._redeem can credit the referrer when the user converts.
    if (args.referralCode) {
      const code = args.referralCode.trim().toLowerCase();
      params.set('metadata[referralCode]', code);
      params.set('subscription_data[metadata][referralCode]', code);
    }

    // Phase 16d — coupon resolution + trial period.
    if (args.couponCode) {
      const coupon = await ctx.runQuery(internal.stripe._lookupCoupon, {
        code: args.couponCode,
      });
      if (!coupon) {
        throw new Error('Coupon code is invalid, expired, or fully redeemed.');
      }
      params.set('discounts[0][coupon]', coupon.stripeCouponId);
      params.set('metadata[couponCode]', coupon.code);
      params.set('subscription_data[metadata][couponCode]', coupon.code);
    }

    if (args.tierId) {
      const tier = await ctx.runQuery(internal.stripe._lookupTier, {
        tierId: args.tierId,
      });
      if (tier?.trialDays && tier.trialDays > 0) {
        params.set('subscription_data[trial_period_days]', String(tier.trialDays));
      }
    }

    // Idempotency-Key bucketed to a 5-minute window so duplicate clicks /
    // network retries land on the same Checkout Session without blocking a
    // user who genuinely wants to re-attempt later.
    const bucket = Math.floor(Date.now() / (5 * 60 * 1000));
    const session = await stripeFetch('/checkout/sessions', {
      body: params,
      idempotencyKey: `checkout:${me._id}:${args.creatorId}:${args.plan}:${bucket}`,
    });
    const url = session.url as string | undefined;
    if (!url) throw new Error('Stripe did not return a checkout URL.');

    return { url };
  },
});
