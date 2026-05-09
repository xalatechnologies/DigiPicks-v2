import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { subscriptionPlan, subscriptionStatus } from './shared/validators';
import { requireUser } from './shared/permissions';

// =============================================================================
// Subscriptions Module — User ↔ Creator subscription lifecycle
// =============================================================================

// Auth-only.
/** List the current user's subscriptions. Always filtered by current user. */
export const mySubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriber_and_creator', (q) =>
        q.eq('subscriberId', user._id),
      )
      .take(50);
  },
});

// Auth-only.
/** Check if the current user is subscribed to a creator. */
export const isSubscribed = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, { creatorId }) => {
    const user = await requireUser(ctx);
    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriber_and_creator', (q) =>
        q.eq('subscriberId', user._id).eq('creatorId', creatorId),
      )
      .first();
    return sub !== null && sub.status === 'active';
  },
});

// Public.
/** Count active subscribers for a creator. */
export const countByCreator = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, { creatorId }) => {
    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_creator', (q) => q.eq('creatorId', creatorId))
      .take(10000);
    return subs.filter((s) => s.status === 'active').length;
  },
});

/** List subscriptions for a creator with subscriber details. */
export const byCreator = query({
  args: {
    creatorId: v.id('creators'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { creatorId, limit }) => {
    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_creator', (q) => q.eq('creatorId', creatorId))
      .order('desc')
      .take(limit ?? 50);

    const enriched = await Promise.all(
      subs.map(async (sub) => {
        const user = await ctx.db.get(sub.subscriberId);
        return {
          ...sub,
          subscriberName: user?.name ?? 'Unknown',
          subscriberEmail: user?.email ?? '',
          subscriberMono: user?.name?.[0]?.toUpperCase() ?? 'U',
        };
      }),
    );
    return enriched;
  },
});

// Auth-only.
/** Subscribe the current user to a creator. subscriberId derived from session. */
export const subscribe = mutation({
  args: {
    creatorId: v.id('creators'),
    plan: subscriptionPlan,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Check for existing active sub
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriber_and_creator', (q) =>
        q.eq('subscriberId', user._id).eq('creatorId', args.creatorId),
      )
      .first();

    if (existing && existing.status === 'active') {
      throw new Error('Already subscribed to this creator');
    }

    const now = Date.now();
    return await ctx.db.insert('subscriptions', {
      subscriberId: user._id,
      creatorId: args.creatorId,
      plan: args.plan,
      status: 'active',
      startedAt: now,
      renewsAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  },
});

// Auth-only.
/** Cancel the current user's subscription to a creator. */
export const cancel = mutation({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriber_and_creator', (q) =>
        q.eq('subscriberId', user._id).eq('creatorId', args.creatorId),
      )
      .first();

    if (!sub || sub.status !== 'active') {
      throw new Error('No active subscription found');
    }

    await ctx.db.patch(sub._id, {
      status: 'cancelled',
      cancelledAt: Date.now(),
    });
    return sub._id;
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// Stripe webhook callbacks (internal — called by /stripe-webhook in http.ts)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Upsert a subscription based on a customer.subscription.created/updated
 * Stripe event. The subscriberId, creatorId, and plan come from the
 * subscription's metadata (set when we created the Checkout Session).
 */
export const _recordSubscriptionFromStripe = internalMutation({
  args: {
    subscriberId: v.id('users'),
    creatorId: v.id('creators'),
    plan: subscriptionPlan,
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    status: subscriptionStatus,
    renewsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find by stripeSubscriptionId first (idempotent on retries).
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_stripeSubscriptionId', (q) =>
        q.eq('stripeSubscriptionId', args.stripeSubscriptionId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        plan: args.plan,
        status: args.status,
        renewsAt: args.renewsAt,
        stripeCustomerId: args.stripeCustomerId,
        ...(args.status !== 'active' ? {} : { cancelledAt: undefined }),
      });
      return existing._id;
    }

    return await ctx.db.insert('subscriptions', {
      subscriberId: args.subscriberId,
      creatorId: args.creatorId,
      plan: args.plan,
      status: args.status,
      startedAt: Date.now(),
      renewsAt: args.renewsAt,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
    });
  },
});

/**
 * Update an existing subscription's status from a Stripe webhook event.
 * Used for status transitions like active → past_due.
 */
export const _updateSubscriptionStatusFromStripe = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: subscriptionStatus,
    renewsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_stripeSubscriptionId', (q) =>
        q.eq('stripeSubscriptionId', args.stripeSubscriptionId),
      )
      .first();

    if (!sub) return null; // Stale event for a sub we don't know about.

    await ctx.db.patch(sub._id, {
      status: args.status,
      renewsAt: args.renewsAt ?? sub.renewsAt,
    });
    return sub._id;
  },
});

/**
 * Mark a subscription cancelled in response to customer.subscription.deleted.
 */
export const _cancelSubscriptionFromStripe = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_stripeSubscriptionId', (q) =>
        q.eq('stripeSubscriptionId', args.stripeSubscriptionId),
      )
      .first();

    if (!sub) return null;

    await ctx.db.patch(sub._id, {
      status: 'cancelled',
      cancelledAt: Date.now(),
    });
    return sub._id;
  },
});
