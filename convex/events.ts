import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { eventStatus } from './shared/validators';
import { requireAdmin } from './shared/permissions';

// =============================================================================
// Event Queries & Mutations
// =============================================================================

// Public.
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

// Public.
export const featured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('events')
      .withIndex('by_featured_and_startsAt', (q) => q.eq('featured', true))
      .take(10);
  },
});

// Admin-only.
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
    await requireAdmin(ctx);

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

// Public.
/** Events currently in progress (status === 'live'). */
export const live = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('events')
      .withIndex('by_status_and_startsAt', (q) => q.eq('status', 'live'))
      .take(20);
  },
});

/** Recently completed events. */
export const recent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('events')
      .withIndex('by_status_and_startsAt', (q) => q.eq('status', 'completed'))
      .order('desc')
      .take(10);
  },
});

/** Upcoming events (not yet started). */
export const upcoming = query({
  args: { sport: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.sport) {
      return await ctx.db
        .query('events')
        .withIndex('by_sport_and_startsAt', (q) => q.eq('sport', args.sport!))
        .take(20);
    }
    return await ctx.db
      .query('events')
      .withIndex('by_status_and_startsAt', (q) => q.eq('status', 'upcoming'))
      .order('asc')
      .take(20);
  },
});
