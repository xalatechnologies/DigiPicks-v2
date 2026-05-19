/** Creator studio route paths — single source for nav and cross-links. */
export const STUDIO = {
  overview: '/dashboard',
  picks: '/dashboard/picks',
  createPick: '/dashboard/create',
  subscribers: '/dashboard/subscribers',
  products: '/dashboard/products',
  analytics: '/dashboard/performance',
  payouts: '/dashboard/earnings',
  profile: '/dashboard/profile',
  settings: '/dashboard/settings',
  settingsDiscord: '/dashboard/settings/discord',
} as const;

export type StudioRoute = (typeof STUDIO)[keyof typeof STUDIO];
