/** Creator studio route paths — single source for nav and cross-links. */
export const STUDIO = {
  overview: '/dashboard',
  picks: '/dashboard/picks',
  createPick: '/dashboard/create',
  events: '/dashboard/events',
  createEvent: '/dashboard/events/new',
  messages: '/dashboard/messages',
  copilot: '/dashboard/copilot',
  growth: '/dashboard/growth',
  discordDiscussions: '/dashboard/discord/discussions',
  subscribers: '/dashboard/subscribers',
  products: '/dashboard/products',
  analytics: '/dashboard/performance',
  payouts: '/dashboard/earnings',
  earningsOnboarding: '/dashboard/earnings/onboarding',
  access: '/dashboard/access',
  profile: '/dashboard/profile',
  settings: '/dashboard/settings',
  settingsDiscord: '/dashboard/settings/discord',
} as const;

export type StudioRoute = (typeof STUDIO)[keyof typeof STUDIO];
