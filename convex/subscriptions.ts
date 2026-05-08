import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { subscriptionPlan } from './shared/validators';
import { requireUser } from './shared/permissions';

// =============================================================================
// Subscriptions Module — User ↔ Creator subscription lifecycle
// =============================================================================

/** List the current user's active subscriptions. Auth-gated. */
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

/** Check if the current user is subscribed to a creator. Auth-gated. */
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

/** List subscriber count for a creator. Public. */
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

/** Subscribe the current user to a creator. Auth-gated. */
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

/** Cancel the current user's subscription to a creator. Auth-gated. */
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
