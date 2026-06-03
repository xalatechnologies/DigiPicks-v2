import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppLayout,
  Container,
  Sidebar,
  NavItem,
  NavSection,
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
import { STUDIO_NAV_SECTIONS } from './studioNav';
import { useStudioContext } from './useStudioContext';

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
      searchPlaceholder="Search subscribers…"
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
      <StudioSidebarBrand
        title={brandTitle}
        tagline="Premium Curator"
        onLogoClick={() => navigate('/')}
      />
      <Stack gap={4}>
        {STUDIO_NAV_SECTIONS.map((section) => (
          <NavSection key={section.title} title={section.title}>
            {section.items.map((item) => (
              <NavItem
                key={`${item.to}-${item.label}`}
                as="button"
                type="button"
                icon={item.icon}
                label={item.label}
                hideChevron
                active={isActive(pathname, item.to, item.end)}
                onClick={() => navigate(item.to)}
              />
            ))}
          </NavSection>
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
