import { v } from 'convex/values';
import { mutation, query, type QueryCtx } from './_generated/server';
import {
  requireCreator,
  requireUser,
  requireCreatorOwnership,
  getCurrentUser,
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
          return {
            channel: c,
            creator,
            // 'public' is the default for legacy rows that predate the
            // access field. Subscriber-gating ships from this row up.
            requiredAccess: c.access ?? 'public',
          };
        }),
    );
    return enriched;
  },
});

/**
 * Whether the calling user is allowed to read+post in `channel`. Returns the
 * required tier so the UI can render the right CTA when blocked.
 *
 * Logic:
 *   public      → always allowed
 *   subscriber  → allowed iff caller has an active subscription on that creator
 *   vip         → allowed iff caller has an active VIP-tier sub (legacyPlan === 'vip')
 *
 * Creator-owners always pass through their own channels regardless of tier.
 */
async function checkChannelAccess(
  ctx: QueryCtx,
  channel: {
    creatorId: import('./_generated/dataModel').Id<'creators'>;
    access?: 'public' | 'subscriber' | 'vip';
  },
  userId: import('./_generated/dataModel').Id<'users'> | null,
): Promise<{ allowed: boolean; requiredTier: 'public' | 'subscriber' | 'vip' }> {
  const required = channel.access ?? 'public';
  if (required === 'public') return { allowed: true, requiredTier: required };
  if (!userId) return { allowed: false, requiredTier: required };

  // Creator owner bypass.
  const user = await ctx.db.get(userId);
  if (user?.creatorId === channel.creatorId) {
    return { allowed: true, requiredTier: required };
  }
  // Admin bypass.
  if (user?.role === 'admin' || user?.role === 'tenant_admin' || user?.role === 'super_admin') {
    return { allowed: true, requiredTier: required };
  }

  const sub = await ctx.db
    .query('subscriptions')
    .withIndex('by_subscriber_and_creator', (q) =>
      q.eq('subscriberId', userId).eq('creatorId', channel.creatorId),
    )
    .first();
  if (!sub || sub.status !== 'active') {
    return { allowed: false, requiredTier: required };
  }
  if (required === 'vip' && sub.plan !== 'vip') {
    return { allowed: false, requiredTier: required };
  }
  return { allowed: true, requiredTier: required };
}

export { checkChannelAccess };

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

/**
 * Access check for the calling user — UI renders the locked panel
 * (subscribe CTA) when this returns `allowed: false`.
 */
export const myAccess = query({
  args: { channelId: v.id('channels') },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) return { allowed: false as const, requiredTier: 'public' as const };
    const user = await getCurrentUser(ctx);
    return await checkChannelAccess(ctx, channel, user?._id ?? null);
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
    access: v.optional(v.union(v.literal('public'), v.literal('subscriber'), v.literal('vip'))),
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
      // Explicit access tier on every new channel — legacy rows fall back to
      // 'public' on read, but new channels persist the chosen tier so the
      // gating decision is auditable.
      access: args.access ?? 'public',
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
    access: v.optional(v.union(v.literal('public'), v.literal('subscriber'), v.literal('vip'))),
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
    if (args.access !== undefined) patch.access = args.access;
    if (args.isActive !== undefined) patch.isActive = args.isActive;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.channelId, patch);
    }
    return args.channelId;
  },
});
