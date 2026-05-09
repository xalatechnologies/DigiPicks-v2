import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import { AuthGate } from '../auth/AuthGate';
import { SubscriberShell } from './Shell';

// Existing pages (re-used inside account layout)
import { Feed } from '../pages/Feed';
import { Saved } from '../pages/Saved';
import { Community } from '../pages/Community';
import { Notifications } from '../pages/Notifications';
import { Events } from '../pages/Events';
import { Creators } from '../pages/Creators';

// New account-specific pages
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
          <Route index element={<Feed />} />
          <Route path="feed" element={<Feed />} />
          <Route path="discover" element={<Creators />} />
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

// Default export so the route file can be code-split via React.lazy().
export default AccountRoutes;
