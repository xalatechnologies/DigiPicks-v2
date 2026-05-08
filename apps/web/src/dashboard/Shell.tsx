import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppLayout,
  AppHeader,
  Sidebar,
  NavSection,
  NavItem,
  ThemeToggle,
} from '@digipicks/ds';

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

const NAV_SECTIONS: StudioNavSection[] = [
  {
    title: 'Studio',
    items: [
      { to: '/dashboard', label: 'Overview', sub: 'Today across your business', icon: 'home', end: true },
      { to: '/dashboard/picks', label: 'Posts & Picks', sub: 'Drafts, scheduled, graded', icon: 'feed' },
      { to: '/dashboard/create', label: 'Create Pick', sub: 'Publish before cutoff', icon: 'plus' },
      { to: '/dashboard/products', label: 'Products', sub: 'Plans & pricing tiers', icon: 'tag' },
    ],
  },
  {
    title: 'Audience',
    items: [
      { to: '/dashboard/subscribers', label: 'Subscribers', sub: '426 active members', icon: 'users' },
      { to: '/dashboard/messages', label: 'Messages', sub: 'DMs from members', icon: 'message', badge: '3' },
      { to: '/dashboard/performance', label: 'Performance', sub: 'Win rate, ROI, streaks', icon: 'chart' },
    ],
  },
  {
    title: 'Growth',
    items: [
      { to: '/dashboard/growth', label: 'Growth Manager', sub: 'Promo, referrals, funnels', icon: 'megaphone' },
      { to: '/dashboard/access', label: 'Access Control', sub: 'Map plans to content', icon: 'key' },
      { to: '/dashboard/earnings', label: 'Earnings', sub: 'MRR, payouts, invoices', icon: 'dollar' },
    ],
  },
];

function isActive(pathname: string, to: string, end?: boolean): boolean {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function DashboardShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const header = (
    <AppHeader
      userName="CourtVision Pro"
      userMail="creator@digipicks.io"
      userMonogram="CV"
    />
  );

  const sidebar = (
    <Sidebar footer={<ThemeToggle />}>
      {NAV_SECTIONS.map((section) => (
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
