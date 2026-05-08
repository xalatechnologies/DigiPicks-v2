import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { eventStatus } from './shared/validators';
import { requireUser } from './shared/permissions';

// =============================================================================
// Event Queries & Mutations
// =============================================================================

export const today = query({
  args: { sport: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.sport) {
      return await ctx.db
        .query('events')
        .withIndex('by_sport_and_startsAt', (q) => q.eq('sport', args.sport!))
        .take(50);
    }
    return await ctx.db.query('events').order('asc').take(50);
  },
});

export const featured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('events')
      .withIndex('by_featured_and_startsAt', (q) => q.eq('featured', true))
      .take(10);
  },
});

/** Create a new event. Admin-only. */
export const create = mutation({
  args: {
    sport: v.string(),
    league: v.string(),
    home: v.string(),
    away: v.string(),
    time: v.string(),
    startsAt: v.number(),
    featured: v.optional(v.boolean()),
    status: v.optional(eventStatus),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      throw new Error('Forbidden: admin role required');
    }

    return await ctx.db.insert('events', {
      sport: args.sport,
      league: args.league,
      home: args.home,
      away: args.away,
      time: args.time,
      startsAt: args.startsAt,
      creatorCount: 0,
      pickCount: 0,
      featured: args.featured ?? false,
      status: args.status ?? 'upcoming',
    });
  },
});
