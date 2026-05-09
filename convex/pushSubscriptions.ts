import { v } from 'convex/values';
import { mutation, query, internalMutation, internalQuery } from './_generated/server';
import { requireUser } from './shared/permissions';

// =============================================================================
// Push subscription management — V8/edge mutations and queries. The actual
// web-push delivery lives in `convex/push.ts` (node action) because the
// `web-push` npm uses Node crypto APIs.
// =============================================================================

/** Internal: list endpoints for a user (used by push.sendToUser action). */
export const _subscriptionsForUser = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('pushSubscriptions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .take(50);
  },
});

/** Internal: remove a stale endpoint (called when push provider returns 410). */
export const _removeEndpoint = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('pushSubscriptions')
      .withIndex('by_endpoint', (q) => q.eq('endpoint', args.endpoint))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

/**
 * Register a browser endpoint for the current user. Idempotent on endpoint —
 * if the endpoint already exists, attaches it to this user.
 */
export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query('pushSubscriptions')
      .withIndex('by_endpoint', (q) => q.eq('endpoint', args.endpoint))
      .first();

    if (existing) {
      if (existing.userId !== user._id) {
        await ctx.db.patch(existing._id, { userId: user._id });
      }
      return existing._id;
    }

    return await ctx.db.insert('pushSubscriptions', {
      userId: user._id,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      userAgent: args.userAgent,
      createdAt: Date.now(),
    });
  },
});

/** Remove a single endpoint (the user disabled push on this device). */
export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const row = await ctx.db
      .query('pushSubscriptions')
      .withIndex('by_endpoint', (q) => q.eq('endpoint', args.endpoint))
      .first();
    if (row && row.userId === user._id) {
      await ctx.db.delete(row._id);
    }
    return { ok: true };
  },
});

/** Whether the current user has at least one push endpoint registered. */
export const hasAnySubscription = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const row = await ctx.db
      .query('pushSubscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();
    return row !== null;
  },
});

/** Public VAPID key for the browser's subscribe call. */
export const publicKey = query({
  args: {},
  handler: async () => {
    return process.env.VAPID_PUBLIC_KEY ?? null;
  },
});
