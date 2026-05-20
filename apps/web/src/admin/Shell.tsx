import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  AppLayout,
  Sidebar,
  NavItem,
  Stack,
  StudioTopBar,
  StudioSidebarBrand,
  CreatorStudioProfile,
  Badge,
} from '@digipicks/ds';
import { AccountUserMenu } from '../auth/AccountUserMenu';
import { api } from '../../../../convex/_generated/api';
import { ADMIN } from './lib/adminRoutes';

const ADMIN_NAV = [
  { to: ADMIN.overview, label: 'Overview', icon: 'home', end: true },
  {
    to: ADMIN.applications,
    label: 'Creator applications',
    icon: 'user',
    badgeKey: 'applications' as const,
  },
  { to: ADMIN.creators, label: 'Creators', icon: 'verified' },
  { to: ADMIN.users, label: 'Users', icon: 'users' },
  { to: ADMIN.moderation, label: 'Moderation', icon: 'shield' },
  { to: ADMIN.billing, label: 'Billing', icon: 'card' },
  { to: ADMIN.payouts, label: 'Payouts', icon: 'dollar' },
  { to: ADMIN.campaigns, label: 'Campaigns', icon: 'megaphone' },
  { to: ADMIN.support, label: 'Support', icon: 'inbox' },
  { to: ADMIN.disputes, label: 'Pick disputes', icon: 'flag' },
  { to: ADMIN.refunds, label: 'Refunds', icon: 'card' },
  { to: ADMIN.analytics, label: 'Analytics', icon: 'chart' },
  { to: ADMIN.settings, label: 'Settings', icon: 'gear' },
  { to: ADMIN.audit, label: 'Audit logs', icon: 'audit' },
  { to: ADMIN.eventsReview, label: 'Event review', icon: 'calendar' },
  { to: ADMIN.coupons, label: 'Coupons', icon: 'tag' },
] as const;

function isActive(pathname: string, to: string, end?: boolean): boolean {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function formatRole(role: string | undefined): string {
  if (!role) return 'Administrator';
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function AdminShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const me = useQuery(api.users.me, {});
  const appCounts = useQuery(api.applications.queueCounts, {});

  const displayName = me?.name ?? me?.email ?? 'Admin';
  const userMonogram = me?.name?.[0]?.toUpperCase() ?? 'A';

  const header = (
    <StudioTopBar
      userMenu={<AccountUserMenu align="right" />}
      onSearch={() => navigate(ADMIN.users)}
    />
  );

  const sidebar = (
    <Sidebar
      footer={
        <CreatorStudioProfile
          name={displayName}
          monogram={userMonogram}
          planLabel={formatRole(me?.role)}
          onClick={() => navigate(ADMIN.overview)}
        />
      }
    >
      <StudioSidebarBrand title="DigiPicks" tagline="Platform operations" />
      <Stack gap={1}>
        {ADMIN_NAV.map((item) => (
          <NavItem
            key={item.to}
            as="button"
            type="button"
            icon={item.icon}
            label={item.label}
            hideChevron
            badge={
              'badgeKey' in item &&
              item.badgeKey === 'applications' &&
              (appCounts?.pending ?? 0) > 0 ? (
                <Badge tone="amber">{appCounts?.pending}</Badge>
              ) : undefined
            }
            active={isActive(pathname, item.to, 'end' in item ? item.end : undefined)}
            onClick={() => navigate(item.to)}
          />
        ))}
      </Stack>
    </Sidebar>
  );

  return (
    <AppLayout header={header} sidebar={sidebar} mainVariant="studio">
      <Outlet />
    </AppLayout>
  );
}
