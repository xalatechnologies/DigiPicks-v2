import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { AppLayout, AppHeader, Sidebar, NavSection, NavItem, ThemeToggle } from '@digipicks/ds';
import { AccountUserMenu } from '../auth/AccountUserMenu';
import { api } from '../../../../convex/_generated/api';

// =============================================================================
// Studio Sidebar — creator role nav (mounted at /dashboard/*)
// =============================================================================

interface StudioNavItem {
  to: string;
  label: string;
  sub?: string;
  icon: string;
  badge?: string;
  end?: boolean;
}
interface StudioNavSection {
  title: string;
  items: StudioNavItem[];
}

function buildNavSections(subscriberCount: string): StudioNavSection[] {
  return [
    {
      title: 'Studio',
      items: [
        {
          to: '/dashboard',
          label: 'Overview',
          sub: 'Today across your business',
          icon: 'home',
          end: true,
        },
        {
          to: '/dashboard/picks',
          label: 'Posts & Picks',
          sub: 'Drafts, scheduled, graded',
          icon: 'feed',
        },
        {
          to: '/dashboard/create',
          label: 'Create Pick',
          sub: 'Publish before cutoff',
          icon: 'plus',
        },
        {
          to: '/dashboard/events',
          label: 'My Events',
          sub: 'Author custom events for review',
          icon: 'calendar',
        },
        { to: '/dashboard/products', label: 'Products', sub: 'Plans & pricing tiers', icon: 'tag' },
      ],
    },
    {
      title: 'Audience',
      items: [
        {
          to: '/dashboard/subscribers',
          label: 'Subscribers',
          sub: `${subscriberCount} active members`,
          icon: 'users',
        },
        // TODO: convex — wire badge count to api.messages.unreadCount when available.
        { to: '/dashboard/messages', label: 'Messages', sub: 'DMs from members', icon: 'message' },
        {
          to: '/dashboard/discord/discussions',
          label: 'Discord',
          sub: 'Linked threads & sentiment',
          icon: 'discord',
        },
        {
          to: '/dashboard/performance',
          label: 'Performance',
          sub: 'Win rate, ROI, streaks',
          icon: 'chart',
        },
      ],
    },
    {
      title: 'Growth',
      items: [
        {
          to: '/dashboard/growth',
          label: 'Growth Manager',
          sub: 'Promo, referrals, funnels',
          icon: 'megaphone',
        },
        {
          to: '/dashboard/access',
          label: 'Access Control',
          sub: 'Map plans to content',
          icon: 'key',
        },
        {
          to: '/dashboard/earnings',
          label: 'Earnings',
          sub: 'MRR, payouts, invoices',
          icon: 'dollar',
        },
      ],
    },
    {
      title: 'Tools',
      items: [
        {
          to: '/dashboard/copilot',
          label: 'Copilot',
          sub: 'Studio AI assistant',
          icon: 'sparkles',
        },
        {
          to: '/dashboard/settings',
          label: 'Settings',
          sub: 'Profile · Discord · Telegram',
          icon: 'gear',
        },
      ],
    },
  ];
}

function isActive(pathname: string, to: string, end?: boolean): boolean {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function DashboardShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const me = useQuery(api.users.meSafe);
  const creator = useQuery(api.creators.get, me?.creatorId ? { id: me.creatorId } : 'skip');
  const subCount = useQuery(
    api.subscriptions.countByCreator,
    me?.creatorId ? { creatorId: me.creatorId } : 'skip',
  );

  const userName = creator?.name ?? me?.name ?? 'You';
  const userMail = me?.email ?? '';
  const userMonogram = creator?.avatarMono ?? me?.name?.[0]?.toUpperCase() ?? 'U';
  const subscriberCountLabel = typeof subCount === 'number' ? subCount.toLocaleString() : '—';

  const sections = buildNavSections(subscriberCountLabel);

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
