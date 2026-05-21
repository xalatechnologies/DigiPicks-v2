import type { ComponentType } from 'react';
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

export type AdminRouteEntry = {
  path?: string;
  Component: ComponentType;
};

/** Child routes under `/admin` (mounted from App.tsx). */
export const ADMIN_ROUTE_ENTRIES: AdminRouteEntry[] = [
  { Component: AdminOverview },
  { path: 'applications', Component: Applications },
  { path: 'creators', Component: CreatorsAdmin },
  { path: 'users', Component: Users },
  { path: 'users/:userId/entitlements', Component: UserEntitlements },
  { path: 'moderation', Component: Moderation },
  { path: 'billing', Component: Billing },
  { path: 'payouts', Component: PayoutsAdmin },
  { path: 'campaigns', Component: Campaigns },
  { path: 'support', Component: Support },
  { path: 'disputes', Component: DisputeQueue },
  { path: 'refunds', Component: Refunds },
  { path: 'analytics', Component: Analytics },
  { path: 'settings', Component: SettingsAdmin },
  { path: 'audit', Component: AuditLogs },
  { path: 'events/review', Component: AdminEventReview },
  { path: 'coupons', Component: Coupons },
];
