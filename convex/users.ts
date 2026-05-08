import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireUser } from './shared/permissions';

// =============================================================================
// Users Module
// =============================================================================

/** Get the current authenticated user. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    return await requireUser(ctx);
  },
});

/**
 * Idempotent upsert — called on auth callback.
 * Creates or updates a user record linked to the auth identity.
 */
export const upsertCurrentUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    externalId: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const now = Date.now();
    const tokenIdentifier = identity.tokenIdentifier;

    const existing = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) =>
        q.eq('tokenIdentifier', tokenIdentifier),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        externalId: args.externalId,
        imageUrl: args.imageUrl,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert('users', {
      tokenIdentifier,
      email: args.email,
      name: args.name,
      externalId: args.externalId,
      imageUrl: args.imageUrl,
      role: 'user',
      locale: 'nb',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});
