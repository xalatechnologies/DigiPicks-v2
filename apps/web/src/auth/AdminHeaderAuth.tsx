import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@digipicks/ds';
import { useAuthSession } from './useAuthSession';
import { isDevAdminEmail } from '../lib/devAdminDefaults';

const ADMIN_ROLES = new Set(['super_admin', 'tenant_admin', 'admin']);

function hasAdminRole(role: string | undefined): boolean {
  return Boolean(role && ADMIN_ROLES.has(role));
}

/** Public marketing header on `/admin` — mirrors AdminAuthGate, not subscriber AccountUserMenu. */
export function AdminHeaderAuth() {
  const navigate = useNavigate();
  const { status, me } = useAuthSession();

  if (status === 'loading' || status === 'profile-loading') {
    return null;
  }

  if (status === 'anonymous' || status === 'orphan') {
    return (
      <Button variant="primary" onClick={() => navigate('/auth?next=%2Fadmin')}>
        Sign in to admin
      </Button>
    );
  }

  const label = me?.email ?? me?.name ?? 'Admin';
  const adminOk = hasAdminRole(me?.role) || isDevAdminEmail(me?.email);

  return (
    <Button
      variant={adminOk ? 'secondary' : 'outline'}
      onClick={() => navigate(adminOk ? '/admin' : '/auth?next=%2Fadmin')}
    >
      {adminOk ? label : `Not admin · ${label}`}
    </Button>
  );
}
