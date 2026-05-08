import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { pickAccess, pickConfidence, pickStatus, pickGrade } from './shared/validators';
import { requireUser } from './shared/permissions';

// =============================================================================
// Pick Queries & Mutations
// =============================================================================

export const feed = query({
  args: {
    sport: v.optional(v.string()),
    access: v.optional(pickAccess),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    if (args.sport) {
      return await ctx.db
        .query('picks')
        .withIndex('by_sport', (q) => q.eq('sport', args.sport!))
        .order('desc')
        .take(limit);
    } else if (args.access) {
      return await ctx.db
        .query('picks')
        .withIndex('by_access', (q) => q.eq('access', args.access!))
        .order('desc')
        .take(limit);
    }
    return await ctx.db
      .query('picks')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(limit);
  },
});

export const byCreator = query({
  args: { creatorId: v.id('creators'), limit: v.optional(v.number()) },
  handler: async (ctx, { creatorId, limit }) => {
    return await ctx.db
      .query('picks')
      .withIndex('by_creator', (q) => q.eq('creatorId', creatorId))
      .order('desc')
      .take(limit ?? 20);
  },
});

/** Create a new pick. Auth-gated — caller must own the creator profile. */
export const create = mutation({
  args: {
    creatorId: v.id('creators'),
    access: pickAccess,
    sport: v.string(),
    league: v.string(),
    eventId: v.optional(v.id('events')),
    eventName: v.string(),
    eventTime: v.string(),
    title: v.string(),
    market: v.string(),
    selection: v.string(),
    odds: v.string(),
    units: v.string(),
    confidence: pickConfidence,
    body: v.optional(v.string()),
    teaser: v.optional(v.string()),
    status: v.optional(pickStatus),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Verify caller is linked to the creator or is admin
    if (user.creatorId !== args.creatorId && user.role !== 'super_admin') {
      throw new Error('Forbidden: not linked to this creator profile');
    }

    const now = Date.now();
    return await ctx.db.insert('picks', {
      creatorId: args.creatorId,
      access: args.access,
      sport: args.sport,
      league: args.league,
      eventId: args.eventId,
      eventName: args.eventName,
      eventTime: args.eventTime,
      title: args.title,
      market: args.market,
      selection: args.selection,
      odds: args.odds,
      units: args.units,
      confidence: args.confidence,
      body: args.body,
      teaser: args.teaser,
      status: args.status ?? 'draft',
      grade: 'pending',
      createdAt: now,
    });
  },
});

/** Grade a pick. Internal only — called by platform/cron, not clients. */
export const grade = internalMutation({
  args: {
    id: v.id('picks'),
    grade: pickGrade,
    netUnits: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pick = await ctx.db.get(args.id);
    if (!pick) throw new Error('Pick not found');

    await ctx.db.patch(args.id, {
      grade: args.grade,
      netUnits: args.netUnits,
      gradedAt: Date.now(),
    });
    return args.id;
  },
});
