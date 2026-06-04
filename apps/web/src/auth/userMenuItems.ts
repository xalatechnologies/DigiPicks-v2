import type { UserMenuItem } from '@digipicks/ds';
import { ACCOUNT } from '../lib/accountRoutes';

const PLATFORM_ADMIN_ROLES = new Set(['super_admin', 'tenant_admin', 'admin', 'moderator']);

export type UserMenuSurface = 'public' | 'account' | 'dashboard' | 'admin';

export function getUserMenuSurface(pathname: string): UserMenuSurface {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/account')) return 'account';
  return 'public';
}

export function isPlatformAdmin(role: string | undefined): boolean {
  return Boolean(role && PLATFORM_ADMIN_ROLES.has(role));
}

export interface BuildUserMenuItemsArgs {
  surface: UserMenuSurface;
  navigate: (to: string) => void;
  hasCreator: boolean;
  isAdmin: boolean;
  onSignOut: () => void;
}

/** Public marketing header — full subscriber shortcuts. */
function publicMenuItems(args: BuildUserMenuItemsArgs): UserMenuItem[] {
  const { navigate, hasCreator, isAdmin, onSignOut } = args;
  const items: UserMenuItem[] = [
    { label: 'My account', icon: 'user', onClick: () => navigate(ACCOUNT.home) },
  ];

  if (isAdmin) {
    items.push({
      label: 'Admin',
      icon: 'shield',
      onClick: () => navigate('/admin'),
    });
  }

  if (hasCreator) {
    items.push({
      label: 'Creator studio',
      icon: 'grid',
      onClick: () => navigate('/dashboard'),
    });
  }

  items.push(
    {
      label: 'Discover',
      icon: 'compass',
      hint: 'Personalized feed',
      onClick: () => navigate(ACCOUNT.discover),
    },
    {
      label: 'My subscriptions',
      icon: 'card',
      onClick: () => navigate(ACCOUNT.subscriptions),
    },
    {
      label: 'Saved picks',
      icon: 'bookmark',
      onClick: () => navigate(ACCOUNT.saved),
    },
    {
      label: 'Results',
      icon: 'trophy',
      onClick: () => navigate(ACCOUNT.results),
    },
    {
      label: 'Notifications',
      icon: 'bell',
      onClick: () => navigate(ACCOUNT.notifications),
    },
    {
      label: 'Messages',
      icon: 'inbox',
      onClick: () => navigate(ACCOUNT.messages),
    },
    {
      label: 'My feed',
      icon: 'feed',
      hint: 'Personalized picks',
      onClick: () => navigate(ACCOUNT.feed),
    },
    { divider: true },
    {
      label: 'Settings',
      icon: 'gear',
      onClick: () => navigate(ACCOUNT.settings),
    },
    {
      label: 'Sign out',
      icon: 'key',
      destructive: true,
      onClick: onSignOut,
    },
  );

  return items;
}

/** Subscriber /account shell — sidebar already lists pages; offer role switches only. */
function accountShellMenuItems(args: BuildUserMenuItemsArgs): UserMenuItem[] {
  const { navigate, hasCreator, isAdmin, onSignOut } = args;
  const items: UserMenuItem[] = [];

  if (hasCreator) {
    items.push({
      label: 'Switch to creator studio',
      icon: 'grid',
      onClick: () => navigate('/dashboard'),
    });
  }

  if (isAdmin) {
    items.push({
      label: 'Admin backoffice',
      icon: 'shield',
      onClick: () => navigate('/admin'),
    });
  }

  items.push(
    { label: 'Browse DigiPicks', icon: 'compass', onClick: () => navigate('/') },
    { divider: true },
    {
      label: 'Sign out',
      icon: 'key',
      destructive: true,
      onClick: onSignOut,
    },
  );

  return items;
}

/** Creator /dashboard shell — sidebar lists studio pages; offer subscriber switch. */
function dashboardShellMenuItems(args: BuildUserMenuItemsArgs): UserMenuItem[] {
  const { navigate, isAdmin, onSignOut } = args;
  const items: UserMenuItem[] = [
    {
      label: 'Switch to subscriber',
      icon: 'user',
      onClick: () => navigate(ACCOUNT.home),
    },
  ];

  if (isAdmin) {
    items.push({
      label: 'Admin backoffice',
      icon: 'shield',
      onClick: () => navigate('/admin'),
    });
  }

  items.push(
    { label: 'Browse DigiPicks', icon: 'compass', onClick: () => navigate('/') },
    { divider: true },
    {
      label: 'Sign out',
      icon: 'key',
      destructive: true,
      onClick: onSignOut,
    },
  );

  return items;
}

export function buildUserMenuItems(args: BuildUserMenuItemsArgs): UserMenuItem[] {
  switch (args.surface) {
    case 'account':
      return accountShellMenuItems(args);
    case 'dashboard':
      return dashboardShellMenuItems(args);
    case 'admin':
      return [];
    default:
      return publicMenuItems(args);
  }
}
