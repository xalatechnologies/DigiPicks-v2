import { useConvexAuth, useQuery } from './convexAuth';
import { useEffect, useState } from 'react';
import { api } from '../../../../convex/_generated/api';

/** Brief wait before treating a null profile as orphan (repair runs next). */
const ORPHAN_GRACE_MS = 3_000;
/** If `meSafe` never resolves while signed in, surface repair / re-sign-in. */
const PROFILE_STALL_MS = 10_000;

export type AuthSessionStatus = 'loading' | 'anonymous' | 'profile-loading' | 'orphan' | 'ready';

/**
 * Single auth + profile read for headers and route gates (avoids split UI).
 *
 * Uses `useConvexAuth` from `convex/react` (not `@convex-dev/auth/react`) so
 * `isAuthenticated` means the Convex backend accepted the JWT — not merely that
 * a token exists in localStorage.
 */
export function useAuthSession() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const [allowOrphan, setAllowOrphan] = useState(false);
  const [profileStalled, setProfileStalled] = useState(false);

  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');

  useEffect(() => {
    if (!isAuthenticated || me === undefined || me !== null) {
      setAllowOrphan(false);
      return;
    }
    setAllowOrphan(false);
    const timer = window.setTimeout(() => setAllowOrphan(true), ORPHAN_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, me]);

  useEffect(() => {
    if (!isAuthenticated || me !== undefined) {
      setProfileStalled(false);
      return;
    }
    setProfileStalled(false);
    const timer = window.setTimeout(() => setProfileStalled(true), PROFILE_STALL_MS);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, me]);

  let status: AuthSessionStatus;
  if (authLoading) {
    status = 'loading';
  } else if (!isAuthenticated) {
    status = 'anonymous';
  } else if (
    (me === undefined && !profileStalled) ||
    (me === null && !allowOrphan && !profileStalled)
  ) {
    status = 'profile-loading';
  } else if (me === null || (me === undefined && profileStalled)) {
    status = 'orphan';
  } else {
    status = 'ready';
  }

  /** Linked `users` row when the deployment has synced auth → profile (see `users.meSafe`). */
  const serverAuthUserId = me?._id ?? null;

  return {
    isAuthenticated,
    authLoading,
    me,
    status,
    profileReady: status === 'ready',
    profileStalled,
    serverAuthUserId,
    /** @deprecated No longer used — backend-confirmed auth removed ghost state. */
    ghostSession: false,
  };
}
