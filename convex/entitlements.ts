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

    const subscriptions = await Promise.all(
      subs.map(async (sub) => {
        const creator = await ctx.db.get(sub.creatorId);
        return {
          id: sub._id,
          creatorId: sub.creatorId,
          creatorName: creator?.name ?? '—',
          creatorHandle: creator?.handle ?? '—',
          plan: sub.plan,
          status: sub.status,
          accessActive: isAccessActive(sub),
          renewsAt: sub.renewsAt,
        };
      }),
    );

    const activeSubs = subscriptions.filter((s) => s.accessActive);
    const derived = activeSubs.map((sub) => ({
      id: `sub_${sub.id}`,
      kind: 'subscription' as const,
      resourceType: 'subscription' as const,
      resourceId: `sub_${sub.id}`,
      creatorId: sub.creatorId,
      creatorName: sub.creatorName,
      creatorHandle: sub.creatorHandle,
      status: 'active' as const,
      source: 'subscription' as const,
      validUntil: sub.renewsAt,
      canRevoke: false,
    }));

    const overrideRows = await Promise.all(
      overrides.map(async (e) => {
        const creator = await ctx.db.get(e.creatorId);
        return {
          id: e._id,
          kind: 'override' as const,
          resourceType: e.resourceType,
          resourceId: e.resourceId,
          creatorId: e.creatorId,
          creatorName: creator?.name ?? '—',
          creatorHandle: creator?.handle ?? '—',
          status: e.status,
          source: e.source,
          validUntil: e.validUntil,
          reason: e.reason,
          canRevoke: e.source === 'manual_override' && e.status === 'active',
        };
      }),
    );

    let creatorHandle: string | undefined;
    if (user.creatorId) {
      const creator = await ctx.db.get(user.creatorId);
      creatorHandle = creator?.handle;
    }

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        creatorId: user.creatorId,
        creatorHandle,
        isActive: user.isActive !== false,
      },
      subscriptionCount: subs.length,
      activeSubscriptionCount: activeSubs.length,
      activeOverrideCount: overrides.filter((e) => e.status === 'active').length,
      activeEntitlementCount:
        derived.length + overrides.filter((e) => e.status === 'active').length,
      subscriptions,
      entitlements: [...derived, ...overrideRows],
      accessLogs: logs.map((log) => ({
        id: log._id,
        resourceId: log.resourceId,
        result: log.result,
        reason: log.reason,
        createdAt: log.createdAt,
      })),
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
