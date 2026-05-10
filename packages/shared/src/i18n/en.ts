import type { Dictionary } from './dict';

export const en: Dictionary = {
  nav: {
    home: 'Home',
    creators: 'Creators',
    events: 'Events',
    feed: 'Feed',
    community: 'Community',
    notifications: 'Notifications',
    saved: 'Saved',
    settings: 'Settings',
    signIn: 'Sign in',
    signOut: 'Sign out',
  },
  actions: {
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    follow: 'Follow',
    following: 'Following',
    subscribe: 'Subscribe',
    unsubscribe: 'Unsubscribe',
    share: 'Share',
  },
  notify: {
    pickPublished: 'New pick',
    pickGraded: 'Pick graded',
    lineMoved: 'Line moved',
    creatorLive: 'Creator is live',
    watchlistHit: 'Watchlist hit',
  },
  state: {
    loading: 'Loading…',
    empty: 'Nothing here yet.',
    error: 'Something went wrong.',
    networkError: 'Network error — try again.',
    unauthorized: 'Sign in to continue.',
  },
};
