import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useConvexAuth, useQuery } from '../auth/convexAuth';
import { AppLayout, AppHeader, Sidebar, NavSection, NavItem, Stack } from '@digipicks/ds';
import { AccountUserMenu } from '../auth/AccountUserMenu';
import { api } from '../../../../convex/_generated/api';

// =============================================================================
// Subscriber Shell — subscriber/customer nav (mounted at /account/*)
// Mirrors the creator DashboardShell exactly in structure and DS components.
// =============================================================================

interface AccountNavItem {
  to: string;
  label: string;
  sub?: string;
  icon: string;
  badge?: string;
  end?: boolean;
}
interface AccountNavSection {
  title: string;
  items: AccountNavItem[];
}

function buildNavSections(unreadLabel: string): AccountNavSection[] {
  return [
    {
      title: 'My Network',
      items: [
        {
          to: '/account',
          label: 'Dashboard',
          sub: 'Stats & live slate',
          icon: 'home',
          end: true,
        },
        {
          to: '/account/feed',
          label: 'My Feed',
          sub: 'Picks from creators you follow',
          icon: 'feed',
        },
        { to: '/account/discover', label: 'Discover', sub: 'Find new creators', icon: 'compass' },
        {
          to: '/account/events',
          label: "Today's Events",
          sub: 'Picks for tonight',
          icon: 'calendar',
        },
      ],
    },
    {
      title: 'Track',
      items: [
        { to: '/account/results', label: 'My Results', sub: 'Followed plays & ROI', icon: 'chart' },
        {
          to: '/account/saved',
          label: 'Saved',
          sub: 'Picks & creators bookmarked',
          icon: 'bookmark',
        },
        {
          to: '/account/subscriptions',
          label: 'Subscriptions',
          sub: 'Manage active plans',
          icon: 'card',
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          to: '/account/notifications',
          label: 'Notifications',
          sub: 'Pick alerts & billing',
          icon: 'bell',
          badge: unreadLabel,
        },
        { to: '/account/messages', label: 'Messages', sub: 'DMs & threads', icon: 'inbox' },
        { to: '/account/community', label: 'Community', sub: 'Live discussions', icon: 'message' },
        { to: '/account/settings', label: 'Settings', sub: 'Profile & preferences', icon: 'gear' },
      ],
    },
  ];
}

function isActive(pathname: string, to: string, end?: boolean): boolean {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function SubscriberShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');
  const unread = useQuery(
    api.notifications.unreadCount,
    isAuthenticated && me !== undefined && me !== null ? {} : 'skip',
  );

  const userName = me?.name ?? 'You';
  const userMail = me?.email ?? '';
  const userMonogram = me?.name?.[0]?.toUpperCase() ?? 'U';
  const unreadLabel = unread && unread > 0 ? String(unread) : '';

  const sections = buildNavSections(unreadLabel);

  // Single shared dropdown (auth + identity + items + sign-out). One
  // component, one source of truth — see auth/AccountUserMenu.tsx.
  const header = (
    <AppHeader
      userName={userName}
      userMail={userMail}
      userMonogram={userMonogram}
      onLogoClick={() => navigate('/')}
      userMenu={<AccountUserMenu align="right" />}
    />
  );

  const sidebar = (
    <Sidebar>
      {sections.map((section) => (
        <NavSection key={section.title} title={section.title}>
          {section.items.map((item) => (
            <NavItem
              key={item.to}
              as="button"
              type="button"
              icon={item.icon}
              label={item.label}
              sub={item.sub}
              badge={item.badge}
              active={isActive(pathname, item.to, item.end)}
              onClick={() => navigate(item.to)}
            />
          ))}
        </NavSection>
      ))}
    </Sidebar>
  );

  return (
    <AppLayout header={header} sidebar={sidebar} mainVariant="studio">
      <Stack gap={6}>
        <Outlet />
      </Stack>
    </AppLayout>
  );
}
