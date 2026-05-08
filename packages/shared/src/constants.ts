// =============================================================================
// Constants — Sports, statuses, and domain enums
// =============================================================================

export const SPORTS = ['NFL', 'NBA', 'NHL', 'MLB', 'Soccer', 'Tennis', 'UFC'] as const;
export type Sport = (typeof SPORTS)[number];

export const PICK_ACCESS_LEVELS = ['free', 'premium', 'vip'] as const;
export const GRADE_RESULTS = ['win', 'loss', 'push', 'pending'] as const;
export const APPLICATION_STATUSES = ['review', 'more_info', 'flagged', 'approved', 'rejected'] as const;

export const SPORT_COLORS: Record<string, string> = {
  NFL: '#00b87a',
  NBA: '#f7b928',
  NHL: '#1c9cf0',
  MLB: '#f4212e',
  Soccer: '#b58cff',
  Tennis: '#00b87a',
  UFC: '#f4212e',
};
