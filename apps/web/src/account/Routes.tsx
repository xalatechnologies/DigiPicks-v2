import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthGate } from '../auth/AuthGate';
import { SubscriberShell } from './Shell';
import { ACCOUNT } from '../lib/accountRoutes';

// Existing pages (re-used inside account layout)
import { Saved } from './pages/Saved';
import { Notifications } from './pages/Notifications';
import { AccountEvents } from './pages/Events';
import { AccountCommunity } from './pages/Community';

// Account-specific pages
import { Dashboard } from './pages/Dashboard';
import { Discover } from './pages/Discover';
import { Subscriptions } from './pages/Subscriptions';
import { Results } from './pages/Results';
import { AccountSettings } from './pages/AccountSettings';
import { MyFeed } from './pages/MyFeed';
import { AccountMessages } from './pages/Messages';
import { PaymentMethods } from './pages/PaymentMethods';
import { BillingHistory } from './pages/BillingHistory';
import { PaymentIssue } from './pages/PaymentIssue';

export function AccountRoutes() {
  return (
    <AuthGate
      forbiddenTitle="Sign in to access your account"
      forbiddenSubtitle="Your subscriber dashboard is tied to your account. Sign in to view your feed, subscriptions, and results."
    >
      <Routes>
        <Route element={<SubscriberShell />}>
          <Route index element={<Dashboard />} />
          <Route path="feed" element={<MyFeed />} />
          <Route path="copilot" element={<Navigate to={ACCOUNT.feed} replace />} />
          <Route path="discover" element={<Discover />} />
          <Route path="events" element={<AccountEvents />} />
          <Route path="results" element={<Results />} />
          <Route path="saved" element={<Saved />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="community" element={<AccountCommunity />} />
          <Route path="messages" element={<AccountMessages />} />
          <Route path="watchlists" element={<Navigate to={ACCOUNT.notifications} replace />} />
          <Route path="settings" element={<AccountSettings />} />
          <Route path="payment-methods" element={<PaymentMethods />} />
          <Route path="billing-history" element={<BillingHistory />} />
          <Route path="billing/payment-issue" element={<PaymentIssue />} />
        </Route>
      </Routes>
    </AuthGate>
  );
}

export default AccountRoutes;
