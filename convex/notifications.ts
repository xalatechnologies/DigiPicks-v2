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
