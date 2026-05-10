import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { query, internalQuery } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { requireUser } from '../shared/permissions';

// =============================================================================
// AI Copilot read paths (M24).
//
// Public:
//   - listConversations    paginated sidebar list, archived filter
//   - messages             paginated transcript for a conversation
//   - context              pre-loaded grounding for the right-rail panel
//
// Internal (respond action):
//   - _loadForRespond      conversation + last 40 messages, ascending
//   - _creatorPerformance  rolling-window record for tools.creatorPerformance
//   - _eventDetails        canonical event row for tools.eventDetails
// =============================================================================

const PERFORMANCE_TAKE_LIMIT = 200;

// ─── Public queries ────────────────────────────────────────────────────────

export const listConversations = query({
  args: {
    paginationOpts: paginationOptsValidator,
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const page = await ctx.db
      .query('aiConversations')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .paginate(args.paginationOpts);

    if (args.includeArchived) return page;
    return {
      ...page,
      page: page.page.filter((c) => !c.archivedAt),
    };
  },
});

export const messages = query({
  args: {
    conversationId: v.id('aiConversations'),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error('Conversation not found');
    if (conv.userId !== user._id) throw new Error('Forbidden');

    return await ctx.db
      .query('aiMessages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .order('asc')
      .paginate(args.paginationOpts);
  },
});

export const context = query({
  args: { conversationId: v.id('aiConversations') },
  handler: async (
    ctx,
    args,
  ): Promise<{
    conversation: Doc<'aiConversations'>;
    creator: Doc<'creators'> | null;
    recentPicks: Doc<'picks'>[];
  }> => {
    const user = await requireUser(ctx);
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error('Conversation not found');
    if (conv.userId !== user._id) throw new Error('Forbidden');

    let creator: Doc<'creators'> | null = null;
    let recentPicks: Doc<'picks'>[] = [];

    if (conv.persona === 'creator' && user.creatorId) {
      creator = await ctx.db.get(user.creatorId);
      recentPicks = await ctx.db
        .query('picks')
        .withIndex('by_creator', (q) => q.eq('creatorId', user.creatorId!))
        .order('desc')
        .take(10);
    }

    return { conversation: conv, creator, recentPicks };
  },
});

// ─── Internal queries (respond action only) ───────────────────────────────

/**
 * Pull the conversation + the most recent 40 messages in ascending order.
 * 40 turns is enough context for a multi-step reasoning chain without
 * blowing the input-token budget on long-running threads.
 */
export const _loadForRespond = internalQuery({
  args: { conversationId: v.id('aiConversations') },
  handler: async (
    ctx,
    args,
  ): Promise<{
    conversation: Doc<'aiConversations'> | null;
    messages: Doc<'aiMessages'>[];
  }> => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return { conversation: null, messages: [] };

    // Take last 40 by descending then reverse to ascending — the
    // by_conversation index is (conversationId, createdAt).
    const desc = await ctx.db
      .query('aiMessages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .order('desc')
      .take(40);
    const messages = desc.reverse();
    return { conversation: conv, messages };
  },
});

interface PerformanceResult {
  found: boolean;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  total: number;
  winRate: number;
  sampleSize: number;
  windowDays: number;
  asOf: number;
}

/**
 * Rolling-window record for a creator. `sampleSize` here is the count of
 * decided picks (win + loss), which is the right denominator for win-rate
 * skeptical templates. `windowDays` is echoed back in the result so the
 * caller can stamp citations with the exact window used.
 */
export const _creatorPerformance = internalQuery({
  args: {
    creatorId: v.id('creators'),
    windowDays: v.number(),
  },
  handler: async (ctx, args): Promise<PerformanceResult> => {
    const now = Date.now();
    const cutoff = now - args.windowDays * 24 * 60 * 60 * 1000;

    const creator = await ctx.db.get(args.creatorId);
    if (!creator) {
      return {
        found: false,
        wins: 0,
        losses: 0,
        pushes: 0,
        pending: 0,
        total: 0,
        winRate: 0,
        sampleSize: 0,
        windowDays: args.windowDays,
        asOf: now,
      };
    }

    const picks = await ctx.db
      .query('picks')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .order('desc')
      .take(PERFORMANCE_TAKE_LIMIT);

    const windowed = picks.filter((p) => (p.publishedAt ?? p.createdAt) >= cutoff);

    let wins = 0;
    let losses = 0;
    let pushes = 0;
    let pending = 0;
    for (const p of windowed) {
      if (p.grade === 'win') wins++;
      else if (p.grade === 'loss') losses++;
      else if (p.grade === 'push') pushes++;
      else pending++;
    }

    const sampleSize = wins + losses;
    const winRate = sampleSize === 0 ? 0 : Math.round((wins / sampleSize) * 1000) / 10;

    return {
      found: true,
      wins,
      losses,
      pushes,
      pending,
      total: windowed.length,
      winRate,
      sampleSize,
      windowDays: args.windowDays,
      asOf: now,
    };
  },
});

interface EventPublicShape {
  found: boolean;
  id?: Id<'events'>;
  sport?: string;
  league?: string;
  home?: string;
  away?: string;
  title?: string;
  status?: string;
  startsAt?: number;
  endTime?: number;
  visibility?: string;
  verificationStatus?: string;
  asOf: number;
}

/**
 * Internal event lookup used by tools.eventDetails. We deliberately do
 * NOT add a public `events.byId` — the copilot is the only consumer that
 * needs id-based reads from outside the events module.
 */
export const _eventDetails = internalQuery({
  args: { eventId: v.id('events') },
  handler: async (ctx, args): Promise<EventPublicShape> => {
    const now = Date.now();
    const event = await ctx.db.get(args.eventId);
    if (!event) return { found: false, asOf: now };
    return {
      found: true,
      id: event._id,
      sport: event.sport,
      league: event.league,
      home: event.home,
      away: event.away,
      title: event.title,
      status: event.status,
      startsAt: event.startsAt,
      endTime: event.endTime,
      visibility: event.visibility,
      verificationStatus: event.verificationStatus,
      asOf: now,
    };
  },
});
