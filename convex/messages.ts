import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireUser } from './shared/permissions';

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
