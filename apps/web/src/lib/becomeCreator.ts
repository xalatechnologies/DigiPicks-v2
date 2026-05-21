import type { NavigateFunction } from 'react-router-dom';

/**
 * Public CTAs for the creator journey:
 * - Guests → sign up as a subscriber, then `/apply` (via `?next=/apply`)
 * - Signed-in subscribers → creator application form
 * - Signed-in creators → creator studio
 */
export function navigateBecomeCreator(
  navigate: NavigateFunction,
  opts: { isAuthenticated: boolean; creatorId?: string | null },
) {
  if (opts.creatorId) {
    navigate('/dashboard');
    return;
  }
  if (!opts.isAuthenticated) {
    navigate('/auth?next=/apply');
    return;
  }
  navigate('/apply');
}

export function becomeCreatorCtaLabel(creatorId?: string | null): string {
  return creatorId ? 'Creator studio' : 'Become a creator';
}
