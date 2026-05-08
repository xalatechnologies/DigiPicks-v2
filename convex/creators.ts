import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { creatorStatus } from './shared/validators';

// =============================================================================
// Creator Queries & Mutations
// =============================================================================

export const list = query({
  args: {
    sport: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    trending: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let creators;

    if (args.trending !== undefined) {
      creators = await ctx.db
        .query('creators')
        .withIndex('by_trending', (q) => q.eq('trending', args.trending!))
        .take(100);
    } else if (args.verified !== undefined) {
      creators = await ctx.db
        .query('creators')
        .withIndex('by_verified', (q) => q.eq('verified', args.verified!))
        .take(100);
    } else {
      creators = await ctx.db.query('creators').take(100);
    }

    if (args.sport) {
      return creators.filter((c) => c.sports.includes(args.sport!));
    }
    return creators;
  },
});

export const getByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    return await ctx.db
      .query('creators')
      .withIndex('by_handle', (q) => q.eq('handle', handle))
      .first();
  },
});

export const get = query({
  args: { id: v.id('creators') },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/** Create a new creator profile. Used during onboarding/approval. */
export const create = mutation({
  args: {
    handle: v.string(),
    name: v.string(),
    avatarColor: v.string(),
    avatarMono: v.string(),
    niche: v.string(),
    sports: v.array(v.string()),
    bio: v.string(),
    startingPrice: v.number(),
    tags: v.array(v.string()),
    status: v.optional(creatorStatus),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('creators', {
      handle: args.handle,
      name: args.name,
      avatarColor: args.avatarColor,
      avatarMono: args.avatarMono,
      verified: false,
      niche: args.niche,
      sports: args.sports,
      bio: args.bio,
      subscriberCount: 0,
      startingPrice: args.startingPrice,
      winRate: 0,
      record: '0-0',
      last10: '',
      units: '+0.0u',
      streak: '',
      tags: args.tags,
      trending: false,
      status: args.status ?? 'pending',
      createdAt: Date.now(),
    });
  },
});
