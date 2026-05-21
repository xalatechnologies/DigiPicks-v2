export type LayoutContext = 'public' | 'account';

export interface AccountLayoutPaths {
  feed: string;
  discover: string;
  creatorsBrowse: string;
}

/** Navigation targets for shared pages rendered inside or outside the account shell. */
export function accountLayoutPaths(context: LayoutContext = 'public'): AccountLayoutPaths {
  if (context === 'account') {
    return {
      feed: '/account/feed',
      discover: '/account/discover',
      creatorsBrowse: '/account/discover',
    };
  }
  return {
    feed: '/feed',
    discover: '/creators',
    creatorsBrowse: '/creators',
  };
}
