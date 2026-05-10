import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { AppLayout, AppHeader, Sidebar, NavSection, NavItem, ThemeToggle } from '@digipicks/ds';
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
          sub: 'Feed, stats & analytics',
          icon: 'home',
          end: true,
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
        {
          to: '/account/watchlists',
          label: 'Watchlists',
          sub: 'Alert rules on the slate',
          icon: 'eye',
        },
        {
          to: '/account/copilot',
          label: 'Copilot',
          sub: 'Ask anything · cited',
          icon: 'sparkles',
        },
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

  const me = useQuery(api.users.meSafe);
  const unread = useQuery(api.notifications.unreadCount, me ? {} : 'skip');

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
      userMenu={<AccountUserMenu align="right" />}
    />
  );

  const sidebar = (
    <Sidebar footer={<ThemeToggle />}>
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
    <AppLayout header={header} sidebar={sidebar}>
      <Outlet />
    </AppLayout>
  );
}
