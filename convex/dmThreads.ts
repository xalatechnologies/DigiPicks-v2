import { v } from 'convex/values';
import {
  mutation,
  query,
  internalMutation,
  type MutationCtx,
} from './_generated/server';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { requireUser } from './shared/permissions';
import { rateLimiter } from './shared/rateLimit';

// =============================================================================
// Creator ↔ Subscriber DMs (PRD M12, Phase 10).
//
// One persistent thread per (creator, user). Created lazily on first send.
// Active subscription required for users to open a thread, OR the user
// may be the creator owner replying. Distinct from listing-based
// `conversations` and channel chat.
// =============================================================================

/** Open (or get) the DM thread between the calling user and a creator. */
export const openWithCreator = mutation({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new Error('Creator not found');

    // Subscriber gating — creator owners always pass through.
    const isOwner = user.creatorId === args.creatorId;
    if (!isOwner) {
      const sub = await ctx.db
        .query('subscriptions')
        .withIndex('by_subscriber_and_creator', (q) =>
          q.eq('subscriberId', user._id).eq('creatorId', args.creatorId),
        )
        .first();
      if (!sub || sub.status !== 'active') {
        throw new Error('Subscribe to this creator to start a DM');
      }
    }

    const existing = await ctx.db
      .query('dmThreads')
      .withIndex('by_creator_and_user', (q) =>
        q.eq('creatorId', args.creatorId).eq('userId', user._id),
      )
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert('dmThreads', {
      creatorId: args.creatorId,
      userId: user._id,
      unreadForCreator: 0,
      unreadForUser: 0,
      createdAt: Date.now(),
    });
  },
});

/** List the DM threads visible to the calling user (subscriber side). */
export const myThreads = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query('dmThreads')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(100);

    const enriched = await Promise.all(
      rows.map(async (t) => {
        const creator = await ctx.db.get(t.creatorId);
        return {
          thread: t,
          creator,
          unread: t.unreadForUser,
        };
      }),
    );
    return enriched;
  },
});

/** List DM threads on the creator dashboard side. */
export const threadsForMyCreator = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.creatorId !== args.creatorId) {
      throw new Error('Forbidden');
    }
    const rows = await ctx.db
      .query('dmThreads')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .order('desc')
      .take(200);

    const enriched = await Promise.all(
      rows.map(async (t) => {
        const subscriber = await ctx.db.get(t.userId);
        return {
          thread: t,
          subscriber,
          unread: t.unreadForCreator,
        };
      }),
    );
    return enriched;
  },
});

/** Read messages in a thread — caller must be a participant. */
export const messagesIn = query({
  args: {
    threadId: v.id('dmThreads'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) return [];
    const isCreatorSide = user.creatorId === thread.creatorId;
    const isUserSide = thread.userId === user._id;
    if (!isCreatorSide && !isUserSide) {
      throw new Error('Forbidden');
    }
    const limit = Math.min(args.limit ?? 100, 500);
    const rows = await ctx.db
      .query('messages')
      .withIndex('by_dmThread_and_createdAt', (q) =>
        q.eq('dmThreadId', args.threadId),
      )
      .order('desc')
      .take(limit);
    return rows.reverse();
  },
});

/** Send a DM. Increments the recipient-side unread counter. */
export const send = mutation({
  args: {
    threadId: v.id('dmThreads'),
    body: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'messages'>> => {
    const user = await requireUser(ctx);
    await rateLimiter.limit(ctx, 'channelsPost', {
      key: user._id,
      throws: true,
    });

    const thread = await ctx.db.get(args.threadId);
    if (!thread) throw new Error('Thread not found');

    const isCreatorSide = user.creatorId === thread.creatorId;
    const isUserSide = thread.userId === user._id;
    if (!isCreatorSide && !isUserSide) {
      throw new Error('Forbidden');
    }

    const trimmed = args.body.trim();
    if (!trimmed) throw new Error('Message body required');
    if (trimmed.length > 2000) {
      throw new Error('Messages must be under 2000 characters');
    }

    const now = Date.now();
    const id = await ctx.db.insert('messages', {
      dmThreadId: args.threadId,
      senderUserId: user._id,
      body: trimmed,
      createdAt: now,
    });

    await ctx.db.patch(args.threadId, {
      lastMessageAt: now,
      unreadForCreator: isCreatorSide
        ? thread.unreadForCreator
        : thread.unreadForCreator + 1,
      unreadForUser: isUserSide ? thread.unreadForUser : thread.unreadForUser + 1,
    });

    // Notify the recipient side via the central dispatcher.
    const recipientUserId: Id<'users'> | null = isCreatorSide
      ? thread.userId
      : await resolveCreatorOwnerUserId(ctx, thread.creatorId);
    if (recipientUserId) {
      await ctx.scheduler.runAfter(0, internal.notify.dispatch, {
        userId: recipientUserId,
        kind: 'pick_published',
        payload: {
          title: 'New DM',
          body: trimmed.slice(0, 140),
          url: '/dashboard/messages',
          entityKey: `dm-thread:${args.threadId}:${id}`,
        },
      });
    }

    return id;
  },
});

/** Mark the thread as read from the calling side. */
export const markRead = mutation({
  args: { threadId: v.id('dmThreads') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) return { ok: false };
    const isCreatorSide = user.creatorId === thread.creatorId;
    const isUserSide = thread.userId === user._id;
    if (!isCreatorSide && !isUserSide) return { ok: false };
    await ctx.db.patch(args.threadId, {
      unreadForCreator: isCreatorSide ? 0 : thread.unreadForCreator,
      unreadForUser: isUserSide ? 0 : thread.unreadForUser,
    });
    return { ok: true };
  },
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Resolve the user account that owns a creator profile. Uses the
 * `by_creatorId` index on users — the only place we look up creator-side
 * recipients for DM fanout.
 */
async function resolveCreatorOwnerUserId(
  ctx: MutationCtx,
  creatorId: Id<'creators'>,
): Promise<Id<'users'> | null> {
  const owner = await ctx.db
    .query('users')
    .withIndex('by_creatorId', (q) => q.eq('creatorId', creatorId))
    .first();
  return owner?._id ?? null;
}

// Internal helper for tests / cron: list creators' DM threads count.
export const _countThreadsForCreator = internalMutation({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('dmThreads')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .take(10000);
    return rows.length;
  },
});
