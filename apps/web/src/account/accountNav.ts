import { ACCOUNT } from '../lib/accountRoutes';

export type AccountNavItem = {
  to: string;
  label: string;
  sub?: string;
  icon: string;
  badge?: string;
  end?: boolean;
};

export type AccountNavSection = {
  title: string;
  items: AccountNavItem[];
};

/** Sidebar IA — keep in sync with [`accountRoutes.ts`](../lib/accountRoutes.ts). */
export function buildAccountNavSections(unreadLabel: string): AccountNavSection[] {
  return [
    {
      title: 'My Network',
      items: [
        {
          to: ACCOUNT.home,
          label: 'Dashboard',
          sub: 'Stats & live slate',
          icon: 'home',
          end: true,
        },
        {
          to: ACCOUNT.feed,
          label: 'My Feed',
          sub: 'Picks from creators you follow',
          icon: 'feed',
        },
        {
          to: ACCOUNT.discover,
          label: 'Discover',
          sub: 'Find new creators',
          icon: 'compass',
        },
        {
          to: ACCOUNT.events,
          label: "Today's Events",
          sub: 'Picks for tonight',
          icon: 'calendar',
        },
      ],
    },
    {
      title: 'Track',
      items: [
        {
          to: ACCOUNT.results,
          label: 'My Results',
          sub: 'Followed plays & ROI',
          icon: 'chart',
        },
        {
          to: ACCOUNT.saved,
          label: 'Saved',
          sub: 'Picks & creators bookmarked',
          icon: 'bookmark',
        },
        {
          to: ACCOUNT.subscriptions,
          label: 'Subscriptions',
          sub: 'Plans & payment methods',
          icon: 'card',
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          to: ACCOUNT.notifications,
          label: 'Notifications',
          sub: 'Pick alerts & billing',
          icon: 'bell',
          badge: unreadLabel,
        },
        { to: ACCOUNT.messages, label: 'Messages', sub: 'DMs & threads', icon: 'inbox' },
        {
          to: ACCOUNT.community,
          label: 'Community',
          sub: 'Live discussions',
          icon: 'message',
        },
        { to: ACCOUNT.settings, label: 'Settings', sub: 'Profile & preferences', icon: 'gear' },
      ],
    },
  ];
}
