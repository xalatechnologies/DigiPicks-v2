import { useAuthActions } from '@convex-dev/auth/react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearDevAdminPreview } from '../lib/devAdminPreview';
import { markDevAdminSignedOut } from '../lib/devAdminSession';

/** Sign out and stop `/admin` from immediately auto-signing back in. */
export function useDevAdminSignOut() {
  const navigate = useNavigate();
  const { signOut } = useAuthActions();

  return useCallback(async () => {
    markDevAdminSignedOut();
    clearDevAdminPreview();
    try {
      await signOut();
    } finally {
      navigate('/', { replace: true });
    }
  }, [navigate, signOut]);
}
