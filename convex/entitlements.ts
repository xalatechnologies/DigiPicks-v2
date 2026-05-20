import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAdmin } from './shared/permissions';
import { isAccessActive } from './subscriptions';
import { internal } from './_generated/api';

export const adminByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriber_and_creator', (q) => q.eq('subscriberId', args.userId))
      .take(50);

    const overrides = await ctx.db
      .query('entitlements')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(50);

    const logs = await ctx.db
      .query('accessLogs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(30);

    const activeSubs = subs.filter((s) => isAccessActive(s));
    const derived = await Promise.all(
      activeSubs.map(async (sub) => {
        const creator = await ctx.db.get(sub.creatorId);
        return {
          resourceType: 'subscription' as const,
          resourceId: `sub_${sub._id}`,
          creatorName: creator?.handle ?? '—',
          status: 'active' as const,
          source: 'subscription' as const,
          validUntil: sub.renewsAt,
        };
      }),
    );

    return {
      user,
      subscriptionCount: subs.length,
      activeEntitlementCount:
        derived.length + overrides.filter((e) => e.status === 'active').length,
      entitlements: [
        ...derived,
        ...overrides.map((e) => ({
          resourceType: e.resourceType,
          resourceId: e.resourceId,
          creatorName: e.creatorId,
          status: e.status,
          source: e.source,
          validUntil: e.validUntil,
          id: e._id,
        })),
      ],
      accessLogs: logs,
    };
  },
});

export const grantOverride = mutation({
  args: {
    userId: v.id('users'),
    creatorId: v.id('creators'),
    resourceType: v.union(
      v.literal('pick_feed'),
      v.literal('telegram'),
      v.literal('discord'),
      v.literal('channel'),
    ),
    resourceId: v.string(),
    validUntil: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    const id = await ctx.db.insert('entitlements', {
      userId: args.userId,
      creatorId: args.creatorId,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      status: 'active',
      source: 'manual_override',
      validUntil: args.validUntil,
      grantedByAdminId: admin._id,
      reason: args.reason,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.runMutation(internal.audit.log, {
      actorUserId: admin._id,
      entityType: 'entitlement',
      entityId: id,
      action: 'entitlement.granted',
      metadata: { userId: args.userId, resourceId: args.resourceId },
    });
    return id;
  },
});

export const revokeOverride = mutation({
  args: { entitlementId: v.id('entitlements') },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.get(args.entitlementId);
    if (!row) throw new Error('Entitlement not found');
    await ctx.db.patch(args.entitlementId, {
      status: 'revoked',
      updatedAt: Date.now(),
    });
    await ctx.runMutation(internal.audit.log, {
      actorUserId: admin._id,
      entityType: 'entitlement',
      entityId: args.entitlementId,
      action: 'entitlement.revoked',
      metadata: {},
    });
    return args.entitlementId;
  },
});
