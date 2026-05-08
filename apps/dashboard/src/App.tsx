import React from 'react';
import { Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppLayout,
  AppHeader,
  Sidebar,
  NavSection,
  NavItem,
  ThemeToggle,
} from '@digipicks/ds';

import { Overview } from './pages/Overview';
import { Picks } from './pages/Picks';
import { CreatePick } from './pages/CreatePick';
import { Subscribers } from './pages/Subscribers';
import { Performance } from './pages/Performance';
import { Products } from './pages/Products';
import { Growth } from './pages/Growth';
import { Access } from './pages/Access';
import { Earnings } from './pages/Earnings';
import { Messages } from './pages/Messages';
import { Settings } from './pages/Settings';

// =============================================================================
// Studio Sidebar — creator role nav
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
      { to: '/', label: 'Overview', sub: 'Today across your business', icon: 'home', end: true },
      { to: '/picks', label: 'Posts & Picks', sub: 'Drafts, scheduled, graded', icon: 'feed' },
      { to: '/create', label: 'Create Pick', sub: 'Publish before cutoff', icon: 'plus' },
      { to: '/products', label: 'Products', sub: 'Plans & pricing tiers', icon: 'tag' },
    ],
  },
  {
    title: 'Audience',
    items: [
      { to: '/subscribers', label: 'Subscribers', sub: '426 active members', icon: 'users' },
      { to: '/messages', label: 'Messages', sub: 'DMs from members', icon: 'message', badge: '3' },
      { to: '/performance', label: 'Performance', sub: 'Win rate, ROI, streaks', icon: 'chart' },
    ],
  },
  {
    title: 'Growth',
    items: [
      { to: '/growth', label: 'Growth Manager', sub: 'Promo, referrals, funnels', icon: 'megaphone' },
      { to: '/access', label: 'Access Control', sub: 'Map plans to content', icon: 'key' },
      { to: '/earnings', label: 'Earnings', sub: 'MRR, payouts, invoices', icon: 'dollar' },
    ],
  },
];

function isActive(pathname: string, to: string, end?: boolean): boolean {
  if (end || to === '/') return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function StudioShell() {
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

// =============================================================================
// Router
// =============================================================================

export function App() {
  return (
    <Routes>
      <Route element={<StudioShell />}>
        <Route path="/" element={<Overview />} />
        <Route path="/picks" element={<Picks />} />
        <Route path="/create" element={<CreatePick />} />
        <Route path="/subscribers" element={<Subscribers />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/products" element={<Products />} />
        <Route path="/growth" element={<Growth />} />
        <Route path="/access" element={<Access />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
