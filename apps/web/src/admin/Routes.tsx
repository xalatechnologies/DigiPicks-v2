import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { AuthGate } from '../auth/AuthGate';
import { AdminShell } from './Shell';
import { AdminOverview } from './pages/Overview';
import { AuditLogs } from './pages/AuditLogs';
import { AdminEventReview } from './pages/EventReview';
import { DisputeQueue } from './pages/DisputeQueue';
import { Coupons } from './pages/Coupons';
import { Applications } from './pages/Applications';
import { Users } from './pages/Users';
import { UserEntitlements } from './pages/UserEntitlements';
import { CreatorsAdmin } from './pages/CreatorsAdmin';
import { Moderation } from './pages/Moderation';
import { Billing } from './pages/Billing';
import { PayoutsAdmin } from './pages/PayoutsAdmin';
import { Campaigns } from './pages/Campaigns';
import { Analytics } from './pages/Analytics';
import { SettingsAdmin } from './pages/SettingsAdmin';
import { Refunds } from './pages/Refunds';
import { Support } from './pages/Support';

export function AdminRoutes() {
  return (
    <AuthGate
      allowedRoles={['super_admin', 'tenant_admin', 'admin']}
      forbiddenTitle="Admin access required"
      forbiddenSubtitle="The admin portal is restricted to platform admins."
    >
      <Routes>
        <Route element={<AdminShell />}>
          <Route index element={<AdminOverview />} />
          <Route path="applications" element={<Applications />} />
          <Route path="creators" element={<CreatorsAdmin />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:userId/entitlements" element={<UserEntitlements />} />
          <Route path="moderation" element={<Moderation />} />
          <Route path="billing" element={<Billing />} />
          <Route path="payouts" element={<PayoutsAdmin />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="support" element={<Support />} />
          <Route path="disputes" element={<DisputeQueue />} />
          <Route path="refunds" element={<Refunds />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="events/review" element={<AdminEventReview />} />
          <Route path="coupons" element={<Coupons />} />
        </Route>
      </Routes>
    </AuthGate>
  );
}

export default AdminRoutes;
