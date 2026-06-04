import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useConvexAuth, useQuery } from '../auth/convexAuth';
import { AppLayout, AppHeader, Sidebar, NavSection, NavItem, Stack } from '@digipicks/ds';
import { AccountUserMenu } from '../auth/AccountUserMenu';
import { api } from '../../../../convex/_generated/api';
import { buildAccountNavSections } from './accountNav';

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

  const sections = buildAccountNavSections(unreadLabel);

  function isActive(to: string, end?: boolean): boolean {
    if (end) return pathname === to;
    return pathname === to || pathname.startsWith(`${to}/`);
  }

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
              active={isActive(item.to, item.end)}
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
