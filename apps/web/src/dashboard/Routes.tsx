import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { AuthGate } from '../auth/AuthGate';
import { DEV_DEMO_UNLOCK } from '../lib/devDemoLogin';
import { DashboardShell } from './Shell';
import { Overview } from './pages/Overview';
import { Picks } from './pages/Picks';
import { CreatePick } from './pages/CreatePick';
import { MyEvents } from './pages/MyEvents';
import { CreateEvent } from './pages/CreateEvent';
import { Subscribers } from './pages/Subscribers';
import { Performance } from './pages/Performance';
import { Products } from './pages/Products';
import { Growth } from './pages/Growth';
import { Access } from './pages/Access';
import { Earnings } from './pages/Earnings';
import { Messages } from './pages/Messages';
import { Settings } from './pages/Settings';
import { DiscordSettings } from './pages/DiscordSettings';
import { DiscordDiscussions } from './pages/DiscordDiscussions';
import { CreatorCopilot } from './pages/Copilot';

export function DashboardRoutes() {
  return (
    <AuthGate
      {...(DEV_DEMO_UNLOCK
        ? {}
        : {
            requireCreator: true,
            allowedRoles: ['super_admin', 'tenant_admin', 'admin'] as const,
          })}
      forbiddenTitle="The creator studio is creator-only."
      forbiddenSubtitle="Apply to publish on DigiPicks to unlock this dashboard. Subscribers can browse picks on the public site."
    >
      <Routes>
        <Route element={<DashboardShell />}>
          <Route index element={<Overview />} />
          <Route path="picks" element={<Picks />} />
          <Route path="create" element={<CreatePick />} />
          <Route path="events" element={<MyEvents />} />
          <Route path="events/new" element={<CreateEvent />} />
          <Route path="subscribers" element={<Subscribers />} />
          <Route path="performance" element={<Performance />} />
          <Route path="products" element={<Products />} />
          <Route path="growth" element={<Growth />} />
          <Route path="access" element={<Access />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="messages" element={<Messages />} />
          <Route path="copilot" element={<CreatorCopilot />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/discord" element={<DiscordSettings />} />
          <Route path="discord/discussions" element={<DiscordDiscussions />} />
        </Route>
      </Routes>
    </AuthGate>
  );
}

// Default export so the route file can be code-split via React.lazy().
export default DashboardRoutes;
