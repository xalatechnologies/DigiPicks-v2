import React, { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { Badge, Button, UserMenu } from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';
import { useDevAdminSignOut } from './useDevAdminSignOut';
import { canDevAutoSignInAdmin } from '../lib/devAdminLogin';
import { useAuthSession } from './useAuthSession';
import { buildUserMenuItems, getUserMenuSurface, isPlatformAdmin } from './userMenuItems';

export interface AccountUserMenuProps {
  align?: 'left' | 'right';
  signInVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export function AccountUserMenu({
  align = 'right',
  signInVariant = 'primary',
}: AccountUserMenuProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { signOut } = useAuthActions();
  const devAdminSignOut = useDevAdminSignOut();
  const surface = getUserMenuSurface(pathname);
  const { isAuthenticated, authLoading, me, status, profileReady } = useAuthSession();
  const unread = useQuery(api.notifications.unreadCount, profileReady ? {} : 'skip');

  if (surface === 'admin') return null;

  if (authLoading || status === 'profile-loading') return null;
  if (!isAuthenticated || status === 'orphan') {
    return (
      <Button variant={signInVariant} onClick={() => navigate('/auth')}>
        Sign in
      </Button>
    );
  }

  if (!profileReady || !me) return null;

  const onSignOut = useCallback(() => {
    if (pathname.startsWith('/admin') && canDevAutoSignInAdmin()) {
      void devAdminSignOut();
      return;
    }
    void signOut();
  }, [pathname, devAdminSignOut, signOut]);

  const items = useMemo(() => {
    const base = buildUserMenuItems({
      surface,
      navigate,
      hasCreator: Boolean(me.creatorId),
      isAdmin: isPlatformAdmin(me.role),
      onSignOut,
    });
    if (surface !== 'public') return base;
    return base.map((item) => {
      if (item.label !== 'Notifications') return item;
      return {
        ...item,
        trailing:
          unread && unread > 0 ? (
            <Badge tone="red" dot>
              {unread > 9 ? '9+' : String(unread)}
            </Badge>
          ) : undefined,
      };
    });
  }, [surface, navigate, me.creatorId, me.role, unread, onSignOut]);

  return (
    <UserMenu
      key={pathname}
      user={{
        name: me.name ?? 'Account',
        email: me.email ?? undefined,
        mono: me.name?.charAt(0).toUpperCase(),
      }}
      items={items}
      align={align}
    />
  );
}
