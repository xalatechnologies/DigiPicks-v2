import { ACCOUNT } from './accountRoutes';

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
      feed: ACCOUNT.feed,
      discover: ACCOUNT.discover,
      creatorsBrowse: ACCOUNT.discover,
    };
  }
  return {
    feed: ACCOUNT.feed,
    discover: '/creators',
    creatorsBrowse: '/creators',
  };
}
