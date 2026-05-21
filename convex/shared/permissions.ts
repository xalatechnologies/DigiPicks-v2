import { QueryCtx, MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { getAuthUserId } from '@convex-dev/auth/server';

// =============================================================================
// Permission Helpers
// Per guidelines: derive identity server-side, never accept userId as arg
// With Convex Auth: use getAuthUserId() which returns the users table _id
// =============================================================================

type Ctx = QueryCtx | MutationCtx;

/**
 * Resolve the current authenticated user from the users table.
 * Uses getAuthUserId from @convex-dev/auth (returns users._id directly).
 */
export async function getCurrentUser(ctx: Ctx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;

  const direct = await ctx.db.get(userId);
  if (direct) return direct;

  // Session `userId` can drift from the profile row after migrations / bootstrap.
  const account = await ctx.db
    .query('authAccounts')
    .filter((q) => q.eq(q.field('userId'), userId))
    .first();
  const accountEmail = account?.providerAccountId?.trim().toLowerCase();
  if (accountEmail?.includes('@')) {
    const byEmail = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), accountEmail))
      .first();
    if (byEmail) return byEmail;
  }

  return null;
}

/**
 * Require an authenticated user. Throws if not logged in.
 */
export async function requireUser(ctx: Ctx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Require a specific role within a tenant.
 * super_admin bypasses all tenant checks.
 */
export async function requireTenantRole(ctx: Ctx, tenantId: Id<'tenants'>, allowedRoles: string[]) {
  const user = await requireUser(ctx);

  // super_admin bypasses
  if (user.role === 'super_admin') {
    return { user, membership: null };
  }

  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_tenant_and_user', (q) => q.eq('tenantId', tenantId).eq('userId', user._id))
    .unique();

  if (!membership || !membership.isActive) {
    throw new Error('Forbidden');
  }
  if (!allowedRoles.includes(membership.role)) {
    throw new Error('Forbidden');
  }

  return { user, membership };
}

// =============================================================================
// Role-based helpers
// =============================================================================

export const ADMIN_ROLES = ['admin', 'tenant_admin', 'super_admin'] as const;
export const MODERATOR_OR_ADMIN_ROLES = ['moderator', ...ADMIN_ROLES] as const;

/** Throws unless the current user has admin-tier role. */
export async function requireAdmin(ctx: Ctx) {
  const user = await requireUser(ctx);
  if (!user.role || !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
    throw new Error('Forbidden: admin role required');
  }
  return user;
}

/** Throws unless the current user is a moderator or admin. */
export async function requireModerator(ctx: Ctx) {
  const user = await requireUser(ctx);
  if (
    !user.role ||
    !MODERATOR_OR_ADMIN_ROLES.includes(user.role as (typeof MODERATOR_OR_ADMIN_ROLES)[number])
  ) {
    throw new Error('Forbidden: moderator role required');
  }
  return user;
}

/** Throws unless the current user has creatorId set OR is an admin. */
export async function requireCreator(ctx: Ctx) {
  const user = await requireUser(ctx);
  const userIsAdmin = user.role && ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number]);
  if (!user.creatorId && !userIsAdmin) {
    throw new Error('Forbidden: creator status required');
  }
  return user;
}

/**
 * Throws unless the current user owns the given creator profile or is an admin.
 * Used by per-creator mutations (e.g., publish a pick for *this* creator).
 */
export async function requireCreatorOwnership(ctx: Ctx, creatorId: Id<'creators'>) {
  const user = await requireUser(ctx);
  const userIsAdmin = user.role && ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number]);
  if (user.creatorId !== creatorId && !userIsAdmin) {
    throw new Error('Forbidden: you do not own this creator profile');
  }
  return user;
}

/** True iff `user` has any admin-tier role. Synchronous helper. */
export function isAdmin(user: { role?: string | undefined } | null | undefined): boolean {
  return Boolean(user?.role && ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number]));
}
