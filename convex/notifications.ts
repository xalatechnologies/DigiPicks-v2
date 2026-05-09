import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireUser } from './shared/permissions';

// =============================================================================
// Notifications Module
// =============================================================================

// Auth-only.
/** List unread notifications for the authenticated user. */
export const listUnread = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    // Use the compound index — readAt undefined means unread
    const all = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(args.limit ?? 20);
    return all.filter((n) => n.readAt === undefined);
  },
});

// Owner-or-admin.
/** Mark a notification as read. Owner-only. */
export const markRead = mutation({
  args: { id: v.id('notifications') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const notif = await ctx.db.get(args.id);
    if (!notif || notif.userId !== user._id) {
      throw new Error('Not found');
    }
    await ctx.db.patch(args.id, { readAt: Date.now() });
  },
});

// Auth-only.
/** Recent notifications (read + unread) for the dropdown surface. */
export const listMine = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(args.limit ?? 30);
  },
});

// Auth-only.
/** Unread badge count — capped at 99 for display. */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .take(200);
    const count = rows.filter((n) => n.readAt === undefined).length;
    return count > 99 ? 99 : count;
  },
});

// Auth-only.
/** Mark every unread notification for the current user as read. */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .take(500);
    const now = Date.now();
    let count = 0;
    for (const row of unread) {
      if (row.readAt !== undefined) continue;
      await ctx.db.patch(row._id, { readAt: now });
      count++;
    }
    return { count };
  },
});
