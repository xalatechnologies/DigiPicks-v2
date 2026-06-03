import { STUDIO } from '../lib/studioRoutes';

export type StudioNavItem = {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
};

export type StudioNavSection = {
  title: string;
  items: StudioNavItem[];
};

/** Sidebar IA — keep in sync with [`studioRoutes.ts`](../lib/studioRoutes.ts). */
export const STUDIO_NAV_SECTIONS: StudioNavSection[] = [
  {
    title: 'Home',
    items: [{ to: STUDIO.overview, label: 'Dashboard', icon: 'home', end: true }],
  },
  {
    title: 'Content',
    items: [
      { to: STUDIO.picks, label: 'Posts / Picks', icon: 'feed' },
      { to: STUDIO.events, label: 'Events', icon: 'calendar' },
      { to: STUDIO.messages, label: 'Messages', icon: 'inbox' },
    ],
  },
  {
    title: 'Audience',
    items: [{ to: STUDIO.subscribers, label: 'Subscribers', icon: 'users' }],
  },
  {
    title: 'Monetization',
    items: [
      { to: STUDIO.products, label: 'Products / Pricing', icon: 'tag' },
      { to: STUDIO.access, label: 'Access levels', icon: 'lock' },
      { to: STUDIO.payouts, label: 'Payouts', icon: 'dollar' },
    ],
  },
  {
    title: 'Insights',
    items: [{ to: STUDIO.analytics, label: 'Analytics', icon: 'chart' }],
  },
  {
    title: 'Tools',
    items: [{ to: STUDIO.copilot, label: 'Copilot', icon: 'sparkles' }],
  },
  {
    title: 'Account',
    items: [
      { to: STUDIO.profile, label: 'Profile', icon: 'user' },
      { to: STUDIO.settings, label: 'Settings', icon: 'gear' },
    ],
  },
];
