import type { QuickActionGridItem } from '@digipicks/ds';

export type AccountPage =
  | 'dashboard'
  | 'discover'
  | 'events'
  | 'results'
  | 'saved'
  | 'subscriptions'
  | 'notifications'
  | 'messages'
  | 'watchlists'
  | 'copilot'
  | 'community'
  | 'settings'
  | 'paymentMethods'
  | 'billingHistory'
  | 'paymentIssue';

/** Related account destinations for the footer quick-link grid. */
export function accountCrossLinks(
  page: AccountPage,
  navigate: (path: string) => void,
): QuickActionGridItem[] {
  const go = (path: string) => () => navigate(path);

  const billing: QuickActionGridItem[] = [
    { id: 'pay', icon: 'card', label: 'Payment methods', onClick: go('/account/payment-methods') },
    {
      id: 'hist',
      icon: 'clock',
      label: 'Billing history',
      onClick: go('/account/billing-history'),
    },
    {
      id: 'issue',
      icon: 'shield',
      label: 'Payment issue',
      onClick: go('/account/billing/payment-issue'),
    },
    { id: 'subs', icon: 'card', label: 'Subscriptions', onClick: go('/account/subscriptions') },
  ];

  const all: Record<AccountPage, QuickActionGridItem[]> = {
    dashboard: [
      { id: 'discover', icon: 'compass', label: 'Discover', onClick: go('/account/discover') },
      { id: 'saved', icon: 'bookmark', label: 'Saved', onClick: go('/account/saved') },
      { id: 'results', icon: 'chart', label: 'Results', onClick: go('/account/results') },
      { id: 'subs', icon: 'card', label: 'Subscriptions', onClick: go('/account/subscriptions') },
    ],
    discover: [
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go('/account') },
      { id: 'events', icon: 'calendar', label: 'Events', onClick: go('/account/events') },
      { id: 'saved', icon: 'bookmark', label: 'Saved', onClick: go('/account/saved') },
      { id: 'subs', icon: 'card', label: 'Subscriptions', onClick: go('/account/subscriptions') },
    ],
    events: [
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go('/account') },
      { id: 'discover', icon: 'compass', label: 'Discover', onClick: go('/account/discover') },
      { id: 'saved', icon: 'bookmark', label: 'Saved', onClick: go('/account/saved') },
      { id: 'results', icon: 'chart', label: 'Results', onClick: go('/account/results') },
    ],
    results: [
      { id: 'saved', icon: 'bookmark', label: 'Saved', onClick: go('/account/saved') },
      { id: 'subs', icon: 'card', label: 'Subscriptions', onClick: go('/account/subscriptions') },
      { id: 'events', icon: 'calendar', label: 'Events', onClick: go('/account/events') },
      { id: 'discover', icon: 'compass', label: 'Discover', onClick: go('/account/discover') },
    ],
    saved: [
      { id: 'results', icon: 'chart', label: 'Results', onClick: go('/account/results') },
      { id: 'discover', icon: 'compass', label: 'Discover', onClick: go('/account/discover') },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go('/account') },
      { id: 'subs', icon: 'card', label: 'Subscriptions', onClick: go('/account/subscriptions') },
    ],
    subscriptions: [
      {
        id: 'pay',
        icon: 'card',
        label: 'Payment methods',
        onClick: go('/account/payment-methods'),
      },
      {
        id: 'hist',
        icon: 'clock',
        label: 'Billing history',
        onClick: go('/account/billing-history'),
      },
      { id: 'notify', icon: 'bell', label: 'Notifications', onClick: go('/account/notifications') },
      { id: 'discover', icon: 'compass', label: 'Discover', onClick: go('/account/discover') },
    ],
    notifications: [
      { id: 'settings', icon: 'gear', label: 'Settings', onClick: go('/account/settings') },
      { id: 'subs', icon: 'card', label: 'Subscriptions', onClick: go('/account/subscriptions') },
      {
        id: 'issue',
        icon: 'shield',
        label: 'Payment issue',
        onClick: go('/account/billing/payment-issue'),
      },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go('/account') },
    ],
    messages: [
      { id: 'community', icon: 'message', label: 'Community', onClick: go('/account/community') },
      { id: 'copilot', icon: 'sparkles', label: 'Copilot', onClick: go('/account/copilot') },
      { id: 'notify', icon: 'bell', label: 'Notifications', onClick: go('/account/notifications') },
      { id: 'discover', icon: 'compass', label: 'Discover', onClick: go('/account/discover') },
    ],
    watchlists: [
      { id: 'notify', icon: 'bell', label: 'Notifications', onClick: go('/account/notifications') },
      { id: 'settings', icon: 'gear', label: 'Settings', onClick: go('/account/settings') },
      { id: 'events', icon: 'calendar', label: 'Events', onClick: go('/account/events') },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go('/account') },
    ],
    copilot: [
      { id: 'events', icon: 'calendar', label: 'Events', onClick: go('/account/events') },
      { id: 'results', icon: 'chart', label: 'Results', onClick: go('/account/results') },
      { id: 'discover', icon: 'compass', label: 'Discover', onClick: go('/account/discover') },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go('/account') },
    ],
    community: [
      { id: 'messages', icon: 'inbox', label: 'Messages', onClick: go('/account/messages') },
      { id: 'discover', icon: 'compass', label: 'Discover', onClick: go('/account/discover') },
      { id: 'notify', icon: 'bell', label: 'Notifications', onClick: go('/account/notifications') },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go('/account') },
    ],
    settings: [
      {
        id: 'pay',
        icon: 'card',
        label: 'Payment methods',
        onClick: go('/account/payment-methods'),
      },
      {
        id: 'hist',
        icon: 'clock',
        label: 'Billing history',
        onClick: go('/account/billing-history'),
      },
      { id: 'subs', icon: 'card', label: 'Subscriptions', onClick: go('/account/subscriptions') },
      { id: 'notify', icon: 'bell', label: 'Notifications', onClick: go('/account/notifications') },
    ],
    paymentMethods: billing,
    billingHistory: billing,
    paymentIssue: billing,
  };

  return all[page];
}
