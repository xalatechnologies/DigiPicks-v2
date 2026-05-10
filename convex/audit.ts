import { internalMutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireAdmin } from './shared/permissions';

// =============================================================================
// Audit Module — Internal logging + admin query
// =============================================================================

/**
 * Internal mutation — called from other mutations to log domain events.
 * Uses internalMutation so it's not exposed to clients.
 */
export const log = internalMutation({
  args: {
    actorUserId: v.optional(v.id('users')),
    tenantId: v.optional(v.id('tenants')),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    action: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('auditLogs', {
      actorUserId: args.actorUserId,
      tenantId: args.tenantId,
      entityType: args.entityType,
      entityId: args.entityId,
      action: args.action,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

// Admin-only.
/**
 * Retention awareness query (Phase 16c, M25). Returns audit-log row
 * counts bucketed by age — drives the admin's retention-policy
 * decisions. **No deletion happens here**; auditLogs is append-only by
 * platform contract. The cutoff env var is read for display only.
 *
 * Buckets: last 7 days · 30 days · 90 days · 1 year · 2 years+
 */
export const metrics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query('auditLogs').take(20000);
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const buckets = {
      last7d: 0,
      last30d: 0,
      last90d: 0,
      last1y: 0,
      olderThan1y: 0,
      olderThan2y: 0,
      total: rows.length,
    };
    for (const r of rows) {
      const age = now - r.createdAt;
      if (age <= 7 * day) buckets.last7d++;
      if (age <= 30 * day) buckets.last30d++;
      if (age <= 90 * day) buckets.last90d++;
      if (age <= 365 * day) buckets.last1y++;
      if (age > 365 * day) buckets.olderThan1y++;
      if (age > 730 * day) buckets.olderThan2y++;
    }
    const retentionDays = Number(process.env.AUDIT_RETENTION_DAYS) || 730;
    return { ...buckets, retentionDays };
  },
});

// Admin-only.
/** List audit logs by entity. Admin-only. */
export const listByEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.entityId) {
      return await ctx.db
        .query('auditLogs')
        .withIndex('by_entity', (q) =>
          q.eq('entityType', args.entityType).eq('entityId', args.entityId!),
        )
        .order('desc')
        .take(args.limit ?? 50);
    }
    return await ctx.db
      .query('auditLogs')
      .withIndex('by_entity', (q) => q.eq('entityType', args.entityType))
      .order('desc')
      .take(args.limit ?? 50);
  },
});
