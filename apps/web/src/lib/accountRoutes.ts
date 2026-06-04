/** Subscriber account route paths — single source for nav and cross-links. */
export const ACCOUNT = {
  home: '/account',
  feed: '/account/feed',
  discover: '/account/discover',
  events: '/account/events',
  results: '/account/results',
  saved: '/account/saved',
  subscriptions: '/account/subscriptions',
  notifications: '/account/notifications',
  messages: '/account/messages',
  community: '/account/community',
  settings: '/account/settings',
  paymentMethods: '/account/payment-methods',
  billingHistory: '/account/billing-history',
  paymentIssue: '/account/billing/payment-issue',
} as const;

export type AccountRoute = (typeof ACCOUNT)[keyof typeof ACCOUNT];

/** Build events URL with optional highlight query for dashboard deep-links. */
export function accountEventsUrl(highlightEventId?: string): string {
  if (!highlightEventId) return ACCOUNT.events;
  return `${ACCOUNT.events}?highlight=${encodeURIComponent(highlightEventId)}`;
}

/** Discover with optional sport pre-filter from dashboard topic chips. */
export function accountDiscoverUrl(sport?: string): string {
  if (!sport) return ACCOUNT.discover;
  return `${ACCOUNT.discover}?sport=${encodeURIComponent(sport)}`;
}
