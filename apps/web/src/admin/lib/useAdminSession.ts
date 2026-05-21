import { useConvexAuth, useQuery } from '../../auth/convexAuth';
import { api } from '../../../../../convex/_generated/api';

const ADMIN_ROLES = new Set(['super_admin', 'tenant_admin', 'admin']);

/** True when the session user has an admin-tier role (safe to run admin Convex queries). */
export function useAdminSession() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');
  const isAdmin = Boolean(me?.role && ADMIN_ROLES.has(me.role));
  const profileReady = !isAuthenticated || me !== undefined;

  return { me, isAdmin, isAuthenticated, authLoading, profileReady };
}

/** Pass as the second argument to `useQuery` for admin-only functions. */
export function useAdminQueryArgs(): Record<string, never> | 'skip' {
  const { isAdmin, profileReady } = useAdminSession();
  return profileReady && isAdmin ? {} : 'skip';
}
