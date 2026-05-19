import type { QuickActionGridItem } from '@digipicks/ds';
import { STUDIO } from './studioRoutes';

type StudioPage =
  | 'overview'
  | 'picks'
  | 'subscribers'
  | 'products'
  | 'analytics'
  | 'payouts'
  | 'profile'
  | 'settings';

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
      { id: 'analytics', icon: 'chart', label: 'Analytics', onClick: go(STUDIO.analytics) },
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    subscribers: [
      { id: 'plans', icon: 'tag', label: 'Plans', onClick: go(STUDIO.products) },
      { id: 'pay', icon: 'dollar', label: 'Payouts', onClick: go(STUDIO.payouts) },
      { id: 'picks', icon: 'feed', label: 'Posts / picks', onClick: go(STUDIO.picks) },
      { id: 'dash', icon: 'home', label: 'Dashboard', onClick: go(STUDIO.overview) },
    ],
    products: [
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'pay', icon: 'dollar', label: 'Payouts', onClick: go(STUDIO.payouts) },
      { id: 'analytics', icon: 'chart', label: 'Analytics', onClick: go(STUDIO.analytics) },
      { id: 'profile', icon: 'user', label: 'Profile', onClick: go(STUDIO.profile) },
    ],
    analytics: [
      { id: 'picks', icon: 'feed', label: 'Posts / picks', onClick: go(STUDIO.picks) },
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'plans', icon: 'tag', label: 'Pricing', onClick: go(STUDIO.products) },
      { id: 'pay', icon: 'dollar', label: 'Payouts', onClick: go(STUDIO.payouts) },
    ],
    payouts: [
      { id: 'plans', icon: 'tag', label: 'Pricing', onClick: go(STUDIO.products) },
      { id: 'subs', icon: 'users', label: 'Subscribers', onClick: go(STUDIO.subscribers) },
      { id: 'analytics', icon: 'chart', label: 'Analytics', onClick: go(STUDIO.analytics) },
      { id: 'settings', icon: 'gear', label: 'Settings', onClick: go(STUDIO.settings) },
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
  };

  return all[page];
}
