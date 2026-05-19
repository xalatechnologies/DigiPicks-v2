import type { NavigateFunction } from 'react-router-dom';

/**
 * Public CTAs for the creator journey:
 * - Guests → creator application (account created on the form)
 * - Signed-in creators → creator studio
 * - Signed-in applicants → application form
 */
export function navigateBecomeCreator(
  navigate: NavigateFunction,
  opts: { isAuthenticated: boolean; creatorId?: string | null },
) {
  if (opts.creatorId) {
    navigate('/dashboard');
    return;
  }
  navigate('/apply');
}

export function becomeCreatorCtaLabel(creatorId?: string | null): string {
  return creatorId ? 'Creator studio' : 'Become a creator';
}
