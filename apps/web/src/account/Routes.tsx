import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { AuthGate } from '../auth/AuthGate';
import { SubscriberShell } from './Shell';

// Existing pages (re-used inside account layout)
import { Saved } from '../pages/Saved';
import { Community } from '../pages/Community';
import { Notifications } from '../pages/Notifications';
import { Events } from '../pages/Events';

// Account-specific pages
import { Dashboard } from './pages/Dashboard';
import { Discover } from './pages/Discover';
import { Subscriptions } from './pages/Subscriptions';
import { Results } from './pages/Results';
import { AccountSettings } from './pages/AccountSettings';

export function AccountRoutes() {
  return (
    <AuthGate
      forbiddenTitle="Sign in to access your account"
      forbiddenSubtitle="Your subscriber dashboard is tied to your account. Sign in to view your feed, subscriptions, and results."
    >
      <Routes>
        <Route element={<SubscriberShell />}>
          <Route index element={<Dashboard />} />
          <Route path="discover" element={<Discover />} />
          <Route path="events" element={<Events />} />
          <Route path="results" element={<Results />} />
          <Route path="saved" element={<Saved />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="community" element={<Community />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>
      </Routes>
    </AuthGate>
  );
}

export default AccountRoutes;
