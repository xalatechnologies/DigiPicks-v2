import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireUser, getCurrentUser } from './shared/permissions';
import { rateLimiter } from './shared/rateLimit';
import { checkChannelAccess } from './channels';

// =============================================================================
// Messages Module — Buyer-seller conversations
// =============================================================================

// Auth-only.
/** List conversations for the authenticated user. */
export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const asBuyer = await ctx.db
      .query('conversations')
      .withIndex('by_buyer', (q) => q.eq('buyerUserId', user._id))
      .take(50);

    const asSeller = await ctx.db
      .query('conversations')
      .withIndex('by_seller', (q) => q.eq('sellerUserId', user._id))
      .take(50);

    // Merge and sort by most recent message
    const all = [...asBuyer, ...asSeller].sort(
      (a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt),
    );
    return all.slice(0, 50);
  },
});

// Owner-or-admin.
/** Get messages for a conversation. Caller must be a participant. */
export const getMessages = query({
  args: { conversationId: v.id('conversations'), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const convo = await ctx.db.get(args.conversationId);
    if (!convo) throw new Error('Conversation not found');
    if (convo.buyerUserId !== user._id && convo.sellerUserId !== user._id) {
      throw new Error('Forbidden');
    }

    return await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) =>
        q.eq('conversationId', args.conversationId),
      )
      .order('desc')
      .take(args.limit ?? 50);
  },
});

// Owner-or-admin.
/** Send a message in a conversation. Caller must be a participant. */
export const send = mutation({
  args: {
    conversationId: v.id('conversations'),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const convo = await ctx.db.get(args.conversationId);
    if (!convo) throw new Error('Conversation not found');
    if (convo.buyerUserId !== user._id && convo.sellerUserId !== user._id) {
      throw new Error('Forbidden');
    }

    const now = Date.now();
    const messageId = await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      senderUserId: user._id,
      body: args.body,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, { lastMessageAt: now });

    return messageId;
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// Community channels (PRD M12, Phase 4)
// ═══════════════════════════════════════════════════════════════════════════

/** Read messages in a channel — most recent last for natural chat ordering. */
export const listByChannel = query({
  args: {
    channelId: v.id('channels'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 100, 500);

    const channel = await ctx.db.get(args.channelId);
    if (!channel || !channel.isActive) return [];

    // Subscriber-gated channels return an empty array for non-subscribers
    // so the UI surfaces the locked-state CTA via `channels.myAccess`.
    const caller = await getCurrentUser(ctx);
    const access = await checkChannelAccess(ctx, channel, caller?._id ?? null);
    if (!access.allowed) return [];

    const rows = await ctx.db
      .query('messages')
      .withIndex('by_channel_and_createdAt', (q) =>
        q.eq('channelId', args.channelId),
      )
      .order('desc')
      .take(limit);

    // Enrich with sender display info for the chat panel.
    const enriched = await Promise.all(
      rows.map(async (m) => {
        const sender = await ctx.db.get(m.senderUserId);
        const creator = sender?.creatorId
          ? await ctx.db.get(sender.creatorId)
          : null;
        return {
          ...m,
          senderName: creator?.name ?? sender?.name ?? 'Member',
          senderHandle: creator?.handle,
          senderMono: creator?.avatarMono ?? sender?.name?.[0]?.toUpperCase() ?? '·',
          senderColor: creator?.avatarColor ?? '#3A4F7A',
          senderVerified: Boolean(creator?.verified),
        };
      }),
    );

    // Reverse so callers can render top-to-bottom oldest → newest.
    return enriched.reverse();
  },
});

/** Post a message to a channel. Phase 4 allows any authenticated user. */
export const postToChannel = mutation({
  args: {
    channelId: v.id('channels'),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await rateLimiter.limit(ctx, 'channelsPost', {
      key: user._id,
      throws: true,
    });

    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error('Channel not found');
    if (!channel.isActive) throw new Error('Channel is archived');

    const access = await checkChannelAccess(ctx, channel, user._id);
    if (!access.allowed) {
      throw new Error(
        `Posting to this channel requires a ${access.requiredTier} subscription.`,
      );
    }

    const trimmed = args.body.trim();
    if (!trimmed) throw new Error('Message body required');
    if (trimmed.length > 2000) {
      throw new Error('Messages must be under 2000 characters');
    }

    const now = Date.now();
    const messageId = await ctx.db.insert('messages', {
      channelId: args.channelId,
      senderUserId: user._id,
      body: trimmed,
      createdAt: now,
    });

    await ctx.db.patch(args.channelId, { lastMessageAt: now });

    return messageId;
  },
});
