import { getAuthUserId } from '@convex-dev/auth/server';
import { mutation, query, internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { requireUser, getCurrentUser } from './shared/permissions';

// =============================================================================
// Users Module — Convex Auth edition
// Auth tables (users, authSessions, authAccounts, authRefreshTokens) are
// managed by @convex-dev/auth. This module adds DigiPicks-specific profile ops.
// =============================================================================

// Auth-only.
/** Get the current authenticated user profile. Throws if not authenticated. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    return await requireUser(ctx);
  },
});

// Public.
/** Safe version — returns null for unauthenticated users (for conditional UI). */
export const meSafe = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Public.
/** Whether the current request carries a valid Convex Auth identity (no profile join). */
export const authSessionProbe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = await getAuthUserId(ctx);
    return {
      userId: userId ?? null,
      hasIdentity: identity !== null,
      issuer: identity?.issuer ?? null,
    };
  },
});

// Auth-only.
/**
 * Update the current user's profile (display name, locale, etc).
 * Auth-gated: derives userId from session.
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    locale: v.optional(v.union(v.literal('nb'), v.literal('en'))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.locale !== undefined) updates.locale = args.locale;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }
    return user._id;
  },
});

// Internal-only.
/** Internal — fetch a user row by id. Used by email verification + other
 *  internal actions that need to read user state. */
export const meSafeById = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Internal-only.
/** Persist a Stripe customer ID on the user. Called by stripe.createCheckoutSession. */
export const _setStripeCustomerId = internalMutation({
  args: {
    userId: v.id('users'),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { stripeCustomerId: args.stripeCustomerId });
    return args.userId;
  },
});
