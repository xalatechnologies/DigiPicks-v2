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

/**
 * Toggle a reaction emoji on a message (Phase 14d). Works for both
 * channel and DM messages. Caller must be a participant in the parent
 * thread/channel — same access rules as posting.
 */
export const toggleReaction = mutation({
  args: {
    messageId: v.id('messages'),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const m = await ctx.db.get(args.messageId);
    if (!m) throw new Error('Message not found');

    // Parent-access check.
    if (m.channelId) {
      const channel = await ctx.db.get(m.channelId);
      if (!channel) return { ok: false as const };
      const access = await checkChannelAccess(ctx, channel, user._id);
      if (!access.allowed) throw new Error('Not a member of this channel');
    } else if (m.dmThreadId) {
      const thread = await ctx.db.get(m.dmThreadId);
      if (!thread) return { ok: false as const };
      const isCreatorSide = user.creatorId === thread.creatorId;
      const isUserSide = thread.userId === user._id;
      if (!isCreatorSide && !isUserSide) throw new Error('Forbidden');
    } else if (m.conversationId) {
      const convo = await ctx.db.get(m.conversationId);
      if (!convo) return { ok: false as const };
      if (convo.buyerUserId !== user._id && convo.sellerUserId !== user._id) {
        throw new Error('Forbidden');
      }
    }

    const trimmedEmoji = args.emoji.trim();
    if (!trimmedEmoji || trimmedEmoji.length > 16) {
      throw new Error('Emoji must be 1-16 characters');
    }

    const reactions = (m.reactions ?? []).map((r) => ({
      emoji: r.emoji,
      userIds: [...r.userIds],
    }));
    const idx = reactions.findIndex((r) => r.emoji === trimmedEmoji);
    if (idx === -1) {
      reactions.push({ emoji: trimmedEmoji, userIds: [user._id] });
    } else {
      const entry = reactions[idx];
      const has = entry.userIds.includes(user._id);
      entry.userIds = has
        ? entry.userIds.filter((u) => u !== user._id)
        : [...entry.userIds, user._id];
      // Drop empty buckets so the array stays clean.
      if (entry.userIds.length === 0) reactions.splice(idx, 1);
    }
    await ctx.db.patch(args.messageId, { reactions });
    return { ok: true as const };
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

    // Stream-linked rooms (Phase 14g) only accept posts while the linked
    // creator is currently live. Falls through to the standard tier gate.
    if (channel.linkedStreamCreatorId) {
      const linked = await ctx.db.get(channel.linkedStreamCreatorId);
      if (!linked?.streamLive) {
        throw new Error('This channel is only open while the creator is live.');
      }
    }

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
