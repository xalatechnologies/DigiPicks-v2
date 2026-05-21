import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConvexAuth, useQuery } from './convexAuth';
import { Button, UserMenu, type UserMenuItem } from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';
import { useDevAdminSignOut } from './useDevAdminSignOut';

export interface AdminUserMenuProps {
  align?: 'left' | 'right';
}

/** Avatar menu for platform admin — sidebar lists ops pages; menu is role switches + sign out. */
export function AdminUserMenu({ align = 'right' }: AdminUserMenuProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const devAdminSignOut = useDevAdminSignOut();
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');

  const items = useMemo((): UserMenuItem[] => {
    const rows: UserMenuItem[] = [];

    if (me?.creatorId) {
      rows.push({
        label: 'Switch to creator studio',
        icon: 'grid',
        onClick: () => navigate('/dashboard'),
      });
    }

    rows.push({
      label: 'Switch to subscriber',
      icon: 'user',
      onClick: () => navigate('/account'),
    });

    rows.push(
      { label: 'Browse DigiPicks', icon: 'compass', onClick: () => navigate('/') },
      { divider: true },
      {
        label: 'Sign out',
        icon: 'key',
        destructive: true,
        onClick: () => {
          void devAdminSignOut();
        },
      },
    );

    return rows;
  }, [me?.creatorId, navigate, devAdminSignOut]);

  if (isLoading) return null;
  if (!isAuthenticated) {
    return (
      <Button variant="secondary" onClick={() => navigate('/auth?next=%2Fadmin')}>
        Sign in
      </Button>
    );
  }

  const displayName = me?.name ?? 'Platform Admin';

  return (
    <UserMenu
      user={{
        name: displayName,
        email: me?.email ? `${me.email} · Admin` : 'Platform operations',
        mono: displayName.charAt(0).toUpperCase(),
      }}
      items={items}
      align={align}
      triggerLabel={`${displayName} menu`}
    />
  );
}
