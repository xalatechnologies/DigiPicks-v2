import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConvexAuth, useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { Badge, Button, UserMenu, type UserMenuItem } from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';

// =============================================================================
// AccountUserMenu — single source of truth for the avatar dropdown.
//
// Mounts in every public + dashboard + admin + account shell so the auth
// surface is identical everywhere. Owns:
//   - auth state check (`useConvexAuth`)
//   - profile read (`api.users.meSafe`)
//   - unread badge (`api.notifications.unreadCount`)
//   - the canonical /account route list
//   - sign-out wiring
//
// When unauthenticated → renders a Sign in button instead of the menu.
// =============================================================================

export interface AccountUserMenuProps {
  /** Side the dropdown opens on. Defaults to right (header-edge). */
  align?: 'left' | 'right';
  /** Auth fallback button variant. `'primary'` for marketing surfaces,
   *  `'secondary'` when you don't want it competing with a hero CTA. */
  signInVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export function AccountUserMenu({
  align = 'right',
  signInVariant = 'primary',
}: AccountUserMenuProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');
  const unread = useQuery(api.notifications.unreadCount, isAuthenticated ? {} : 'skip');

  if (isLoading) return null;
  if (!isAuthenticated) {
    return (
      <Button variant={signInVariant} onClick={() => navigate('/auth')}>
        Sign in
      </Button>
    );
  }

  const items: UserMenuItem[] = [
    { label: 'My account', icon: 'user', onClick: () => navigate('/account') },
    ...(me?.creatorId
      ? [
          {
            label: 'Creator studio',
            icon: 'grid',
            onClick: () => navigate('/dashboard'),
          } satisfies UserMenuItem,
        ]
      : []),
    {
      label: 'Discover',
      icon: 'compass',
      hint: 'Personalized feed',
      onClick: () => navigate('/account/discover'),
    },
    {
      label: 'My subscriptions',
      icon: 'card',
      onClick: () => navigate('/account/subscriptions'),
    },
    {
      label: 'Saved picks',
      icon: 'bookmark',
      onClick: () => navigate('/account/saved'),
    },
    {
      label: 'Watchlists',
      icon: 'eye',
      onClick: () => navigate('/account/watchlists'),
    },
    {
      label: 'Results',
      icon: 'trophy',
      onClick: () => navigate('/account/results'),
    },
    {
      label: 'Notifications',
      icon: 'bell',
      onClick: () => navigate('/account/notifications'),
      trailing:
        unread && unread > 0 ? (
          <Badge tone="red" dot>
            {unread > 9 ? '9+' : String(unread)}
          </Badge>
        ) : undefined,
    },
    {
      label: 'Messages',
      icon: 'inbox',
      onClick: () => navigate('/account/messages'),
    },
    {
      label: 'Copilot',
      icon: 'sparkles',
      hint: 'Ask anything',
      onClick: () => navigate('/account/copilot'),
    },
    { divider: true },
    {
      label: 'Settings',
      icon: 'gear',
      onClick: () => navigate('/account/settings'),
    },
    {
      label: 'Sign out',
      icon: 'key',
      destructive: true,
      onClick: () => {
        void signOut();
      },
    },
  ];

  return (
    <UserMenu
      user={{
        name: me?.name ?? 'Account',
        email: me?.email ?? undefined,
        mono: me?.name?.charAt(0).toUpperCase(),
      }}
      items={items}
      align={align}
    />
  );
}
