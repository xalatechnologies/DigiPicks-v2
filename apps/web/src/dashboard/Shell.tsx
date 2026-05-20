import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppLayout,
  Container,
  Sidebar,
  NavItem,
  Stack,
  StudioTopBar,
  StudioSidebarBrand,
  CreatorStudioProfile,
  StudioDevBanner,
} from '@digipicks/ds';
import { AccountUserMenu } from '../auth/AccountUserMenu';
import {
  hasDevStudioPreview,
  clearDevStudioPreview,
  canDevAutoSignInCreator,
} from '../lib/devDemoLogin';
import { STUDIO } from '../lib/studioRoutes';
import { useStudioContext } from './useStudioContext';

const STUDIO_NAV = [
  { to: STUDIO.overview, label: 'Dashboard', icon: 'home', end: true },
  { to: STUDIO.picks, label: 'Posts / Picks', icon: 'feed' },
  { to: STUDIO.subscribers, label: 'Subscribers', icon: 'users' },
  { to: STUDIO.products, label: 'Products / Pricing', icon: 'tag' },
  { to: STUDIO.access, label: 'Access levels', icon: 'lock' },
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
  const { displayName, activeSubs, devPreview, creator, me } = useStudioContext();

  const userMonogram = creator?.avatarMono ?? me?.name?.[0]?.toUpperCase() ?? 'E';
  const avatarColor = creator?.avatarColor;
  const brandTitle = creator?.name ?? 'The Elite Editorial';
  const subLabel =
    activeSubs > 0 ? `${activeSubs.toLocaleString()} subscribers` : 'Premium Curator';

  const header = (
    <StudioTopBar
      userMenu={<AccountUserMenu align="right" />}
      onSearch={() => navigate(STUDIO.subscribers)}
    />
  );

  const sidebar = (
    <Sidebar
      footer={
        <CreatorStudioProfile
          name={displayName}
          monogram={userMonogram}
          color={avatarColor}
          planLabel={subLabel}
          onClick={() => navigate(STUDIO.profile)}
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
    <AppLayout header={header} sidebar={sidebar} mainVariant="studio">
      <Stack gap={6}>
        {devPreview && !creator ? (
          <Container size="2xl">
            <StudioDevBanner
              onExit={() => {
                clearDevStudioPreview();
                navigate('/apply');
              }}
              onSignIn={
                canDevAutoSignInCreator()
                  ? () => navigate(`/auth?next=${encodeURIComponent(STUDIO.overview)}`)
                  : undefined
              }
            />
          </Container>
        ) : null}
        <Outlet />
      </Stack>
    </AppLayout>
  );
}
