import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  AppLayout,
  Sidebar,
  NavItem,
  Stack,
  Card,
  Row,
  Muted,
  Mono,
  Button,
  Badge,
  StudioTopBar,
  StudioSidebarBrand,
  CreatorStudioProfile,
} from '@digipicks/ds';
import { AccountUserMenu } from '../auth/AccountUserMenu';
import { api } from '../../../../convex/_generated/api';
import { hasDevStudioPreview, clearDevStudioPreview } from '../lib/devDemoLogin';
import { STUDIO } from '../lib/studioRoutes';

const STUDIO_NAV = [
  { to: STUDIO.overview, label: 'Dashboard', icon: 'home', end: true },
  { to: STUDIO.picks, label: 'Posts / Picks', icon: 'feed' },
  { to: STUDIO.subscribers, label: 'Subscribers', icon: 'users' },
  { to: STUDIO.products, label: 'Products / Pricing', icon: 'tag' },
  { to: STUDIO.analytics, label: 'Analytics', icon: 'chart' },
  { to: STUDIO.payouts, label: 'Payouts', icon: 'dollar' },
  { to: STUDIO.profile, label: 'Profile', icon: 'user' },
  { to: STUDIO.settings, label: 'Settings', icon: 'gear' },
] as const;

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

  const userName = creator?.name ?? me?.name ?? 'Elite Editor';
  const userMonogram = creator?.avatarMono ?? me?.name?.[0]?.toUpperCase() ?? 'E';
  const avatarColor = creator?.avatarColor;
  const brandTitle = creator?.name ?? 'The Elite Editorial';
  const devPreview = hasDevStudioPreview();

  const header = (
    <StudioTopBar
      userMenu={<AccountUserMenu align="right" />}
      onPrimaryClick={() => navigate(STUDIO.createPick)}
    />
  );

  const sidebar = (
    <Sidebar
      footer={
        <CreatorStudioProfile
          name={userName}
          monogram={userMonogram}
          color={avatarColor}
          planLabel={
            typeof subCount === 'number'
              ? `${subCount.toLocaleString()} subscribers`
              : 'Pro Account'
          }
        />
      }
    >
      <StudioSidebarBrand title={brandTitle} tagline="Premium Curator" />
      <Stack gap={1}>
        {STUDIO_NAV.map((item) => (
          <NavItem
            key={`${item.to}-${item.label}`}
            as="button"
            type="button"
            icon={item.icon}
            label={item.label}
            hideChevron
            active={isActive(pathname, item.to, 'end' in item ? item.end : false)}
            onClick={() => navigate(item.to)}
          />
        ))}
      </Stack>
    </Sidebar>
  );

  return (
    <AppLayout header={header} sidebar={sidebar}>
      <Stack gap={4}>
        {devPreview ? (
          <Card pad="md" elev>
            <Row gap={3}>
              <Badge tone="amber">Dev preview</Badge>
              <Muted>
                Studio shell with sample metrics. Set <Mono>VITE_DEV_CREATOR_EMAIL</Mono> and{' '}
                <Mono>VITE_DEV_CREATOR_PASSWORD</Mono> in <Mono>.env.local</Mono> for live Convex
                data.
              </Muted>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearDevStudioPreview();
                  navigate('/apply');
                }}
              >
                Exit preview
              </Button>
            </Row>
          </Card>
        ) : null}
        <Outlet />
      </Stack>
    </AppLayout>
  );
}
