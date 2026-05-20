import type { QuickActionGridItem } from '@digipicks/ds';
import { STUDIO } from './studioRoutes';

export type StudioPage =
  | 'overview'
  | 'picks'
  | 'createPick'
  | 'events'
  | 'createEvent'
  | 'subscribers'
  | 'products'
  | 'analytics'
  | 'payouts'
  | 'payoutOnboarding'
  | 'access'
  | 'growth'
  | 'messages'
  | 'copilot'
  | 'profile'
  | 'settings'
  | 'discordSettings'
  | 'discordDiscussions';

/** Related studio destinations for the footer quick-link grid on each page. */
export function studioCrossLinks(
  page: StudioPage,
  navigate: (path: string) => void,
): QuickActionGridItem[] {
  const go = (path: string) => () => navigate(path);

  const all: Record<StudioPage, QuickActionGridItem[]> = {
    overview: [
      { id: 'picks', icon: 'feed', label: 'Posts / picks', onClick: go(STUDIO.picks) },
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'plans', icon: 'tag', label: 'Pricing', onClick: go(STUDIO.products) },
      { id: 'pay', icon: 'dollar', label: 'Payouts', onClick: go(STUDIO.payouts) },
    ],
    picks: [
      { id: 'create', icon: 'plus', label: 'New pick', onClick: go(STUDIO.createPick) },
      { id: 'events', icon: 'calendar', label: 'Events', onClick: go('/dashboard/events') },
      { id: 'analytics', icon: 'chart', label: 'Analytics', onClick: go(STUDIO.analytics) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    createPick: [
      { id: 'picks', icon: 'feed', label: 'All picks', onClick: go(STUDIO.picks) },
      { id: 'events', icon: 'calendar', label: 'Events', onClick: go('/dashboard/events') },
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    events: [
      { id: 'create', icon: 'plus', label: 'New event', onClick: go('/dashboard/events/new') },
      { id: 'picks', icon: 'feed', label: 'Posts / picks', onClick: go(STUDIO.picks) },
      { id: 'analytics', icon: 'chart', label: 'Analytics', onClick: go(STUDIO.analytics) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    createEvent: [
      { id: 'events', icon: 'calendar', label: 'My events', onClick: go('/dashboard/events') },
      { id: 'picks', icon: 'feed', label: 'Posts / picks', onClick: go(STUDIO.picks) },
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    subscribers: [
      { id: 'plans', icon: 'tag', label: 'Plans', onClick: go(STUDIO.products) },
      { id: 'pay', icon: 'dollar', label: 'Payouts', onClick: go(STUDIO.payouts) },
      { id: 'messages', icon: 'inbox', label: 'Messages', onClick: go('/dashboard/messages') },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    products: [
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'pay', icon: 'dollar', label: 'Payouts', onClick: go(STUDIO.payouts) },
      { id: 'access', icon: 'lock', label: 'Access levels', onClick: go(STUDIO.access) },
      { id: 'profile', icon: 'user', label: 'Profile', onClick: go(STUDIO.profile) },
    ],
    analytics: [
      { id: 'picks', icon: 'feed', label: 'Posts / picks', onClick: go(STUDIO.picks) },
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'growth', icon: 'megaphone', label: 'Growth', onClick: go('/dashboard/growth') },
      { id: 'pay', icon: 'dollar', label: 'Payouts', onClick: go(STUDIO.payouts) },
    ],
    payouts: [
      {
        id: 'onboard',
        icon: 'dollar',
        label: 'Payout setup',
        onClick: go(STUDIO.earningsOnboarding),
      },
      { id: 'plans', icon: 'tag', label: 'Pricing', onClick: go(STUDIO.products) },
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'settings', icon: 'gear', label: 'Settings', onClick: go(STUDIO.settings) },
    ],
    payoutOnboarding: [
      { id: 'pay', icon: 'dollar', label: 'Payouts', onClick: go(STUDIO.payouts) },
      { id: 'plans', icon: 'tag', label: 'Pricing', onClick: go(STUDIO.products) },
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    access: [
      { id: 'plans', icon: 'tag', label: 'Pricing', onClick: go(STUDIO.products) },
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'discord', icon: 'discord', label: 'Discord', onClick: go(STUDIO.settingsDiscord) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    growth: [
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'analytics', icon: 'chart', label: 'Analytics', onClick: go(STUDIO.analytics) },
      { id: 'picks', icon: 'feed', label: 'Posts / picks', onClick: go(STUDIO.picks) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    messages: [
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'copilot', icon: 'sparkles', label: 'Copilot', onClick: go('/dashboard/copilot') },
      {
        id: 'discord',
        icon: 'discord',
        label: 'Discord',
        onClick: go('/dashboard/discord/discussions'),
      },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    copilot: [
      { id: 'picks', icon: 'feed', label: 'Posts / picks', onClick: go(STUDIO.picks) },
      { id: 'events', icon: 'calendar', label: 'Events', onClick: go('/dashboard/events') },
      { id: 'analytics', icon: 'chart', label: 'Analytics', onClick: go(STUDIO.analytics) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    profile: [
      { id: 'settings', icon: 'gear', label: 'Settings', onClick: go(STUDIO.settings) },
      { id: 'plans', icon: 'tag', label: 'Pricing', onClick: go(STUDIO.products) },
      { id: 'picks', icon: 'feed', label: 'Posts / picks', onClick: go(STUDIO.picks) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    settings: [
      { id: 'profile', icon: 'user', label: 'Profile', onClick: go(STUDIO.profile) },
      { id: 'pay', icon: 'dollar', label: 'Payouts', onClick: go(STUDIO.payouts) },
      { id: 'discord', icon: 'discord', label: 'Discord', onClick: go(STUDIO.settingsDiscord) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    discordSettings: [
      {
        id: 'discuss',
        icon: 'message',
        label: 'Discussions',
        onClick: go('/dashboard/discord/discussions'),
      },
      { id: 'access', icon: 'lock', label: 'Access levels', onClick: go(STUDIO.access) },
      { id: 'settings', icon: 'gear', label: 'Settings', onClick: go(STUDIO.settings) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    discordDiscussions: [
      {
        id: 'discord',
        icon: 'discord',
        label: 'Discord setup',
        onClick: go(STUDIO.settingsDiscord),
      },
      { id: 'messages', icon: 'inbox', label: 'Messages', onClick: go('/dashboard/messages') },
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
  };

  return all[page];
}
