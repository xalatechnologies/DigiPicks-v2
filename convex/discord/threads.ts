import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc } from '../_generated/dataModel';
import { requireUser, getCurrentUser, isAdmin } from '../shared/permissions';

// =============================================================================
// Discord thread links — explicit two-way binding between a Discord thread and
// a DigiPicks entity (event / pick / creator / livestream). Used by surface
// pages to render community discussion next to the entity.
//
// `getLinkedDiscussion` gates the FULL summary behind an active subscription
// on the linked creator. Non-subscribers receive a minimal "badge" payload
// so the surface can render a paywalled CTA.
// =============================================================================

const linkedEntityType = v.union(
  v.literal('event'),
  v.literal('pick'),
  v.literal('creator'),
  v.literal('livestream'),
);

/** Creator-only — bind a Discord thread to a DigiPicks entity. */
export const linkThreadToEntity = mutation({
  args: {
    integrationId: v.id('discordIntegrations'),
    threadId: v.string(),
    channelId: v.string(),
    threadName: v.optional(v.string()),
    linkedEntityType,
    linkedEntityId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) throw new Error('Integration not found');
    if (user.creatorId !== integration.creatorId && !isAdmin(user)) {
      throw new Error('Forbidden — you do not own this integration');
    }

    const existing = await ctx.db
      .query('discordThreadLinks')
      .withIndex('by_thread', (q) => q.eq('threadId', args.threadId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        linkedEntityType: args.linkedEntityType,
        linkedEntityId: args.linkedEntityId,
        threadName: args.threadName ?? existing.threadName,
        isActive: true,
      });
      return existing._id;
    }

    const id = await ctx.db.insert('discordThreadLinks', {
      integrationId: args.integrationId,
      threadId: args.threadId,
      channelId: args.channelId,
      threadName: args.threadName,
      linkedEntityType: args.linkedEntityType,
      linkedEntityId: args.linkedEntityId,
      createdByUserId: user._id,
      isActive: true,
      messageCount: 0,
      createdAt: now,
    });
    await ctx.runMutation(internal.audit.log, {
      actorUserId: user._id,
      entityType: 'discord_thread_link',
      entityId: id,
      action: 'discord.thread.linked',
      metadata: { threadId: args.threadId, target: args.linkedEntityType },
    });
    return id;
  },
});

/** Creator (or admin) — disable a thread link. */
export const unlinkThread = mutation({
  args: { threadLinkId: v.id('discordThreadLinks') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const link = await ctx.db.get(args.threadLinkId);
    if (!link) return null;
    const integration = await ctx.db.get(link.integrationId);
    if (!integration) {
      throw new Error('Integration missing — cannot verify ownership');
    }
    if (user.creatorId !== integration.creatorId && !isAdmin(user)) {
      throw new Error('Forbidden');
    }
    await ctx.db.patch(args.threadLinkId, { isActive: false });
    await ctx.runMutation(internal.audit.log, {
      actorUserId: user._id,
      entityType: 'discord_thread_link',
      entityId: args.threadLinkId,
      action: 'discord.thread.unlinked',
    });
    return args.threadLinkId;
  },
});

interface DiscordThreadLinkBadge {
  hasDiscussion: true;
  threadId: string;
  threadName?: string;
  channelId: string;
  messageCount: number;
  lastActivityAt?: number;
  /** Locked indicates the caller can see the badge but not the full summary. */
  locked: boolean;
}

interface LinkedDiscussionResult {
  hasDiscussion: false;
}
interface LinkedDiscussionBadgeOnly {
  hasDiscussion: true;
  badge: DiscordThreadLinkBadge;
  imports: null;
  summary: null;
}
interface LinkedDiscussionFull {
  hasDiscussion: true;
  badge: DiscordThreadLinkBadge;
  imports: Doc<'discordMessageImports'>[];
  summary: Doc<'discordSentimentSummaries'> | null;
}

type LinkedDiscussionPayload =
  | LinkedDiscussionResult
  | LinkedDiscussionBadgeOnly
  | LinkedDiscussionFull;

/**
 * Render the linked discussion for a DigiPicks entity. Returns:
 *   - `{ hasDiscussion: false }` when no active link exists, or
 *   - badge-only payload for non-subscribers (locked=true), or
 *   - full payload (last 20 imports + last sentiment summary) for the
 *     creator's owner, an active subscriber, or an admin.
 */
export const getLinkedDiscussion = query({
  args: {
    linkedEntityType,
    linkedEntityId: v.string(),
  },
  handler: async (ctx, args): Promise<LinkedDiscussionPayload> => {
    const link = await ctx.db
      .query('discordThreadLinks')
      .withIndex('by_entity', (q) =>
        q.eq('linkedEntityType', args.linkedEntityType).eq('linkedEntityId', args.linkedEntityId),
      )
      .first();
    if (!link || !link.isActive) {
      return { hasDiscussion: false };
    }

    const integration = await ctx.db.get(link.integrationId);
    if (!integration) return { hasDiscussion: false };

    // Determine the viewer's permission tier.
    const me = await getCurrentUser(ctx);

    let canSeeFull = false;
    if (me) {
      if (me.creatorId === integration.creatorId) canSeeFull = true;
      else if (isAdmin(me)) canSeeFull = true;
      else {
        const sub = await ctx.db
          .query('subscriptions')
          .withIndex('by_subscriber_and_creator', (q) =>
            q.eq('subscriberId', me._id).eq('creatorId', integration.creatorId),
          )
          .first();
        if (sub && sub.status === 'active') canSeeFull = true;
      }
    }

    const badge: DiscordThreadLinkBadge = {
      hasDiscussion: true,
      threadId: link.threadId,
      threadName: link.threadName,
      channelId: link.channelId,
      messageCount: link.messageCount,
      lastActivityAt: link.lastActivityAt,
      locked: !canSeeFull,
    };

    if (!canSeeFull) {
      return { hasDiscussion: true, badge, imports: null, summary: null };
    }

    const imports = await ctx.db
      .query('discordMessageImports')
      .withIndex('by_thread', (q) => q.eq('threadId', link.threadId))
      .order('desc')
      .take(20);

    const summary = await ctx.db
      .query('discordSentimentSummaries')
      .withIndex('by_entity_and_generated', (q) =>
        q.eq('linkedEntityType', args.linkedEntityType).eq('linkedEntityId', args.linkedEntityId),
      )
      .order('desc')
      .first();

    return { hasDiscussion: true, badge, imports, summary };
  },
});
