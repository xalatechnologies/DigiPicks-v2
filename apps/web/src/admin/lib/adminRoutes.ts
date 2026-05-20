/** Admin backoffice route paths (mounted at `/admin/*`). */
export const ADMIN = {
  overview: '/admin',
  applications: '/admin/applications',
  creators: '/admin/creators',
  users: '/admin/users',
  moderation: '/admin/moderation',
  billing: '/admin/billing',
  payouts: '/admin/payouts',
  campaigns: '/admin/campaigns',
  disputes: '/admin/disputes',
  support: '/admin/support',
  refunds: '/admin/refunds',
  analytics: '/admin/analytics',
  settings: '/admin/settings',
  audit: '/admin/audit',
  eventsReview: '/admin/events/review',
  coupons: '/admin/coupons',
} as const;
