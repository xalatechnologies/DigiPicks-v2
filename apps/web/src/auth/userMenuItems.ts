import type { UserMenuItem } from '@digipicks/ds';

const PLATFORM_ADMIN_ROLES = new Set(['super_admin', 'tenant_admin', 'admin']);

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
  const { navigate, hasCreator, onSignOut } = args;
  const items: UserMenuItem[] = [
    { label: 'My account', icon: 'user', onClick: () => navigate('/account') },
  ];

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
      label: 'Results',
      icon: 'trophy',
      onClick: () => navigate('/account/results'),
    },
    {
      label: 'Notifications',
      icon: 'bell',
      onClick: () => navigate('/account/notifications'),
    },
    {
      label: 'Messages',
      icon: 'inbox',
      onClick: () => navigate('/account/messages'),
    },
    {
      label: 'My feed',
      icon: 'feed',
      hint: 'Personalized picks',
      onClick: () => navigate('/account/feed'),
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
      onClick: () => navigate('/account'),
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
