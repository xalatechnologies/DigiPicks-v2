// =============================================================================
// i18n dictionary types (Phase 15e). en + nb seed maps live alongside.
// Keys live under flat namespace dot-paths so an external translation
// service can ingest them as-is. The schema is enforced by TypeScript so
// adding a new English key forces the same in nb (or vice versa).
// =============================================================================

export interface Dictionary {
  /** Top-level navigation surfaces. */
  nav: {
    home: string;
    creators: string;
    events: string;
    feed: string;
    community: string;
    notifications: string;
    saved: string;
    settings: string;
    signIn: string;
    signOut: string;
  };
  /** Common action labels used across forms and CTAs. */
  actions: {
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    follow: string;
    following: string;
    subscribe: string;
    unsubscribe: string;
    share: string;
  };
  /** Notification surfaces. */
  notify: {
    pickPublished: string;
    pickGraded: string;
    lineMoved: string;
    creatorLive: string;
    watchlistHit: string;
  };
  /** Error / empty / loading copy. */
  state: {
    loading: string;
    empty: string;
    error: string;
    networkError: string;
    unauthorized: string;
  };
}

export type LocaleCode = 'en' | 'nb';
