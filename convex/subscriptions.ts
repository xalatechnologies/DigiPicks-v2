import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { subscriptionPlan, subscriptionStatus } from './shared/validators';
import { requireUser } from './shared/permissions';
import { internal } from './_generated/api';

// Grace-period default (3 days). When a subscription flips to past_due we
// stamp gracePeriodEndsAt = now + GRACE_PERIOD_MS so access helpers treat
// the row as still-active until the window closes. Override per
// environment via GRACE_PERIOD_DAYS env var (BPMN-003 §grace period).
function getGracePeriodMs(): number {
  const days = Number(process.env.GRACE_PERIOD_DAYS);
  const safe = Number.isFinite(days) && days >= 0 && days <= 30 ? days : 3;
  return safe * 24 * 60 * 60 * 1000;
}

/**
 * True when the subscription should grant entitlement right now. Active
 * always passes; past_due passes within the grace window. Other states
 * (refunded, cancelled, expired) never grant access.
 */
export function isAccessActive(sub: { status: string; gracePeriodEndsAt?: number }): boolean {
  if (sub.status === 'active') return true;
  if (sub.status === 'past_due' && sub.gracePeriodEndsAt && sub.gracePeriodEndsAt > Date.now()) {
    return true;
  }
  return false;
}

// =============================================================================
// Subscriptions Module — User ↔ Creator subscription lifecycle
// =============================================================================

// Auth-only.
/** List the current user's subscriptions with joined creator details. */
export const mySubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriber_and_creator', (q) => q.eq('subscriberId', user._id))
      .take(50);

    const enriched = await Promise.all(
      subs.map(async (sub) => {
        const creator = await ctx.db.get(sub.creatorId);
        return {
          ...sub,
          creatorName: creator?.name ?? 'Unknown',
          creatorHandle: creator?.handle ?? '',
          creatorMono: creator?.avatarMono ?? 'U',
          creatorColor: creator?.avatarColor ?? '#3A4F7A',
          creatorVerified: creator?.verified ?? false,
          creatorStartingPrice: creator?.startingPrice ?? 0,
        };
      }),
    );
    return enriched;
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
      const wasActive = isAccessActive(existing);
      await ctx.db.patch(existing._id, {
        plan: args.plan,
        status: args.status,
        renewsAt: args.renewsAt,
        stripeCustomerId: args.stripeCustomerId,
        ...(args.status === 'active'
          ? { cancelledAt: undefined, gracePeriodEndsAt: undefined }
          : {}),
      });
      // BPMN-003 — fire welcome / reactivation notify only on the
      // off→on transition. Pure renewal updates (active→active) stay
      // silent.
      if (args.status === 'active' && !wasActive) {
        await ctx.scheduler.runAfter(0, internal.notify.onSubscriptionActive, {
          userId: args.subscriberId,
          creatorId: args.creatorId,
          subscriptionId: existing._id,
        });
      }
      return existing._id;
    }

    const id = await ctx.db.insert('subscriptions', {
      subscriberId: args.subscriberId,
      creatorId: args.creatorId,
      plan: args.plan,
      status: args.status,
      startedAt: Date.now(),
      renewsAt: args.renewsAt,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
    });
    // BPMN-002 — first-time activation is the welcome moment.
    if (args.status === 'active') {
      await ctx.scheduler.runAfter(0, internal.notify.onSubscriptionActive, {
        userId: args.subscriberId,
        creatorId: args.creatorId,
        subscriptionId: id,
      });
    }
    return id;
  },
});

/**
 * Update an existing subscription's status from a Stripe webhook event.
 * Used for status transitions like active → past_due. Stamps
 * gracePeriodEndsAt on the past_due transition (BPMN-003 §grace period)
 * and schedules the lifecycle notify so the customer learns about the
 * payment hiccup or termination via inbox / push / telegram.
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

    const patch: Record<string, unknown> = {
      status: args.status,
      renewsAt: args.renewsAt ?? sub.renewsAt,
    };

    // Past-due transition: open grace window. Active recovery: close it.
    if (args.status === 'past_due' && sub.status !== 'past_due') {
      patch.gracePeriodEndsAt = Date.now() + getGracePeriodMs();
    } else if (args.status === 'active') {
      patch.gracePeriodEndsAt = undefined;
    }

    await ctx.db.patch(sub._id, patch);

    // Lifecycle notify on transitions only — silent on no-op repeats.
    if (args.status === 'past_due' && sub.status !== 'past_due') {
      await ctx.scheduler.runAfter(0, internal.notify.onSubscriptionPastDue, {
        userId: sub.subscriberId,
        creatorId: sub.creatorId,
        subscriptionId: sub._id,
        gracePeriodEndsAt: patch.gracePeriodEndsAt as number | undefined,
      });
    } else if (
      (args.status === 'cancelled' || args.status === 'refunded') &&
      sub.status !== args.status
    ) {
      await ctx.scheduler.runAfter(0, internal.notify.onSubscriptionCancelled, {
        userId: sub.subscriberId,
        creatorId: sub.creatorId,
        subscriptionId: sub._id,
        reason: args.status,
      });
    } else if (args.status === 'active' && !isAccessActive(sub)) {
      // Recovery from past_due / cancelled back to active.
      await ctx.scheduler.runAfter(0, internal.notify.onSubscriptionActive, {
        userId: sub.subscriberId,
        creatorId: sub.creatorId,
        subscriptionId: sub._id,
      });
    }

    return sub._id;
  },
});

/**
 * Mark a subscription cancelled in response to customer.subscription.deleted.
 * Schedules the lifecycle notify so the customer sees the change.
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
    if (sub.status === 'cancelled') return sub._id; // idempotent

    await ctx.db.patch(sub._id, {
      status: 'cancelled',
      cancelledAt: Date.now(),
      gracePeriodEndsAt: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.notify.onSubscriptionCancelled, {
      userId: sub.subscriberId,
      creatorId: sub.creatorId,
      subscriptionId: sub._id,
      reason: 'cancelled',
    });
    return sub._id;
  },
});
