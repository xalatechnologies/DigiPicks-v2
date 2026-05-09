import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import {
  requireCreator,
  requireUser,
  requireCreatorOwnership,
} from './shared/permissions';
import { channelType } from './shared/validators';

// =============================================================================
// Channels — creator community channels (PRD M12). Subscriber-only access
// gating ships in Phase 4.5; Phase 4 treats every authenticated user as
// able to read and post.
// =============================================================================

/** Public list of all active community channels, most-recently-active first. */
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);

    const rows = await ctx.db
      .query('channels')
      .withIndex('by_type', (q) => q.eq('type', 'public'))
      .order('desc')
      .take(limit);

    const enriched = await Promise.all(
      rows
        .filter((c) => c.isActive)
        .map(async (c) => {
          const creator = await ctx.db.get(c.creatorId);
          return { channel: c, creator };
        }),
    );
    return enriched;
  },
});

/** Channels owned by a specific creator. */
export const byCreator = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('channels')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .order('desc')
      .take(50);
  },
});

/** Resolve a channel by its public slug (used in URLs). */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const channel = await ctx.db
      .query('channels')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();
    if (!channel) return null;
    const creator = await ctx.db.get(channel.creatorId);
    return { channel, creator };
  },
});

/** Creator-only: create a new channel under the calling creator's profile. */
export const create = mutation({
  args: {
    creatorId: v.id('creators'),
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    type: channelType,
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);

    const existing = await ctx.db
      .query('channels')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();
    if (existing) {
      throw new Error('A channel with that slug already exists.');
    }

    return await ctx.db.insert('channels', {
      creatorId: args.creatorId,
      slug: args.slug,
      name: args.name,
      description: args.description,
      type: args.type,
      isActive: true,
      memberCount: 0,
      createdAt: Date.now(),
    });
  },
});

/** Creator-only: update channel name/description/type/active flag. */
export const update = mutation({
  args: {
    channelId: v.id('channels'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(channelType),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireCreator(ctx);
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error('Channel not found');

    if (channel.creatorId !== user.creatorId) {
      // Admins fall through requireCreatorOwnership; otherwise deny.
      await requireCreatorOwnership(ctx, channel.creatorId);
    }

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.type !== undefined) patch.type = args.type;
    if (args.isActive !== undefined) patch.isActive = args.isActive;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.channelId, patch);
    }
    return args.channelId;
  },
});
