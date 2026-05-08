import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireUser, getCurrentUser } from './shared/permissions';

// =============================================================================
// Users Module — Convex Auth edition
// Auth tables (users, authSessions, authAccounts, authRefreshTokens) are
// managed by @convex-dev/auth. This module adds DigiPicks-specific profile ops.
// =============================================================================

/** Get the current authenticated user profile. Throws if not authenticated. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    return await requireUser(ctx);
  },
});

/** Safe version — returns null for unauthenticated users (for conditional UI). */
export const meSafe = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

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
