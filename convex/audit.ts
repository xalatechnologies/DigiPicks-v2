import { internalMutation, query } from './_generated/server';
import { v } from 'convex/values';

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

/** List audit logs by entity. Admin-only in practice. */
export const listByEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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
