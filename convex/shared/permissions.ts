import { QueryCtx, MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// =============================================================================
// Permission Helpers
// Per guidelines: derive identity server-side, never accept userId as arg
// =============================================================================

type Ctx = QueryCtx | MutationCtx;

/**
 * Resolve the current authenticated user from the users table.
 * Uses tokenIdentifier (stable across sessions) per Convex guidelines.
 */
export async function getCurrentUser(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (q) =>
      q.eq('tokenIdentifier', identity.tokenIdentifier),
    )
    .unique();
}

/**
 * Require an authenticated user. Throws if not logged in or no users record.
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
export async function requireTenantRole(
  ctx: Ctx,
  tenantId: Id<'tenants'>,
  allowedRoles: string[],
) {
  const user = await requireUser(ctx);

  // super_admin bypasses
  if (user.role === 'super_admin') {
    return { user, membership: null };
  }

  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_tenant_and_user', (q) =>
      q.eq('tenantId', tenantId).eq('userId', user._id),
    )
    .unique();

  if (!membership || !membership.isActive) {
    throw new Error('Forbidden');
  }
  if (!allowedRoles.includes(membership.role)) {
    throw new Error('Forbidden');
  }

  return { user, membership };
}
