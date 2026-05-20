import type { QuickActionGridItem } from '@digipicks/ds';
import { ADMIN } from './adminRoutes';

export type AdminPage =
  | 'overview'
  | 'applications'
  | 'creators'
  | 'users'
  | 'moderation'
  | 'billing'
  | 'payouts'
  | 'disputes'
  | 'support'
  | 'refunds'
  | 'analytics'
  | 'audit'
  | 'eventsReview';

export function adminCrossLinks(
  page: AdminPage,
  navigate: (path: string) => void,
): QuickActionGridItem[] {
  const go = (path: string) => () => navigate(path);

  const all: Record<AdminPage, QuickActionGridItem[]> = {
    overview: [
      { id: 'apps', icon: 'user', label: 'Applications', onClick: go(ADMIN.applications) },
      { id: 'creators', icon: 'verified', label: 'Creators', onClick: go(ADMIN.creators) },
      { id: 'users', icon: 'users', label: 'Users', onClick: go(ADMIN.users) },
      { id: 'billing', icon: 'card', label: 'Billing', onClick: go(ADMIN.billing) },
    ],
    applications: [
      { id: 'creators', icon: 'verified', label: 'Creators', onClick: go(ADMIN.creators) },
      { id: 'users', icon: 'users', label: 'Users', onClick: go(ADMIN.users) },
      { id: 'events', icon: 'calendar', label: 'Event review', onClick: go(ADMIN.eventsReview) },
      { id: 'dash', icon: 'home', label: 'Overview', onClick: go(ADMIN.overview) },
    ],
    creators: [
      { id: 'apps', icon: 'user', label: 'Applications', onClick: go(ADMIN.applications) },
      { id: 'mod', icon: 'shield', label: 'Moderation', onClick: go(ADMIN.moderation) },
      { id: 'billing', icon: 'card', label: 'Billing', onClick: go(ADMIN.billing) },
      { id: 'dash', icon: 'home', label: 'Overview', onClick: go(ADMIN.overview) },
    ],
    users: [
      { id: 'creators', icon: 'verified', label: 'Creators', onClick: go(ADMIN.creators) },
      { id: 'support', icon: 'inbox', label: 'Support', onClick: go(ADMIN.support) },
      { id: 'refunds', icon: 'card', label: 'Refunds', onClick: go(ADMIN.refunds) },
      { id: 'dash', icon: 'home', label: 'Overview', onClick: go(ADMIN.overview) },
    ],
    moderation: [
      { id: 'disputes', icon: 'flag', label: 'Pick disputes', onClick: go(ADMIN.disputes) },
      { id: 'creators', icon: 'verified', label: 'Creators', onClick: go(ADMIN.creators) },
      { id: 'users', icon: 'users', label: 'Users', onClick: go(ADMIN.users) },
      { id: 'dash', icon: 'home', label: 'Overview', onClick: go(ADMIN.overview) },
    ],
    billing: [
      { id: 'refunds', icon: 'card', label: 'Refunds', onClick: go(ADMIN.refunds) },
      { id: 'payouts', icon: 'dollar', label: 'Payouts', onClick: go(ADMIN.payouts) },
      { id: 'users', icon: 'users', label: 'Users', onClick: go(ADMIN.users) },
      { id: 'dash', icon: 'home', label: 'Overview', onClick: go(ADMIN.overview) },
    ],
    payouts: [
      { id: 'billing', icon: 'card', label: 'Billing', onClick: go(ADMIN.billing) },
      { id: 'creators', icon: 'verified', label: 'Creators', onClick: go(ADMIN.creators) },
      { id: 'refunds', icon: 'card', label: 'Refunds', onClick: go(ADMIN.refunds) },
      { id: 'dash', icon: 'home', label: 'Overview', onClick: go(ADMIN.overview) },
    ],
    disputes: [
      { id: 'mod', icon: 'shield', label: 'Moderation', onClick: go(ADMIN.moderation) },
      { id: 'creators', icon: 'verified', label: 'Creators', onClick: go(ADMIN.creators) },
      { id: 'support', icon: 'inbox', label: 'Support', onClick: go(ADMIN.support) },
      { id: 'dash', icon: 'home', label: 'Overview', onClick: go(ADMIN.overview) },
    ],
    support: [
      { id: 'users', icon: 'users', label: 'Users', onClick: go(ADMIN.users) },
      { id: 'refunds', icon: 'card', label: 'Refunds', onClick: go(ADMIN.refunds) },
      { id: 'billing', icon: 'card', label: 'Billing', onClick: go(ADMIN.billing) },
      { id: 'dash', icon: 'home', label: 'Overview', onClick: go(ADMIN.overview) },
    ],
    refunds: [
      { id: 'billing', icon: 'card', label: 'Billing', onClick: go(ADMIN.billing) },
      { id: 'users', icon: 'users', label: 'Users', onClick: go(ADMIN.users) },
      { id: 'support', icon: 'inbox', label: 'Support', onClick: go(ADMIN.support) },
      { id: 'dash', icon: 'home', label: 'Overview', onClick: go(ADMIN.overview) },
    ],
    analytics: [
      { id: 'billing', icon: 'card', label: 'Billing', onClick: go(ADMIN.billing) },
      { id: 'creators', icon: 'verified', label: 'Creators', onClick: go(ADMIN.creators) },
      { id: 'audit', icon: 'audit', label: 'Audit logs', onClick: go(ADMIN.audit) },
      { id: 'dash', icon: 'home', label: 'Overview', onClick: go(ADMIN.overview) },
    ],
    audit: [
      { id: 'users', icon: 'users', label: 'Users', onClick: go(ADMIN.users) },
      { id: 'mod', icon: 'shield', label: 'Moderation', onClick: go(ADMIN.moderation) },
      { id: 'billing', icon: 'card', label: 'Billing', onClick: go(ADMIN.billing) },
      { id: 'dash', icon: 'home', label: 'Overview', onClick: go(ADMIN.overview) },
    ],
    eventsReview: [
      { id: 'creators', icon: 'verified', label: 'Creators', onClick: go(ADMIN.creators) },
      { id: 'apps', icon: 'user', label: 'Applications', onClick: go(ADMIN.applications) },
      { id: 'mod', icon: 'shield', label: 'Moderation', onClick: go(ADMIN.moderation) },
      { id: 'dash', icon: 'home', label: 'Overview', onClick: go(ADMIN.overview) },
    ],
  };

  return all[page];
}
