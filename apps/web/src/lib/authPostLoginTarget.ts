/**
 * OAuth and some auth redirects return to `/auth` without preserving `?next=`.
 * Persist post-login paths and creator-apply intent in sessionStorage.
 */
const AUTH_POST_LOGIN_NEXT_KEY = 'digipicks:auth:postLoginNext';
const CREATOR_APPLY_INTENT_KEY = 'digipicks:auth:creatorApplyIntent';

/** True when the resolved target is the creator application route. */
export function isApplyIntentPath(resolvedTarget: string): boolean {
  return (
    resolvedTarget === '/apply' ||
    resolvedTarget.startsWith('/apply?') ||
    resolvedTarget.startsWith('/apply/')
  );
}

/** Resolve the post-auth landing target from the URL. Honors ?next= (AuthGate)
 *  and ?redirectTo= (legacy) then defaults to /account. Same-origin paths only. */
export function safeRedirectTarget(raw: string | null): string {
  if (!raw) return '/account';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/account';
  if (raw.startsWith('/auth')) return '/account';
  return raw;
}

export function markCreatorApplyIntent(): void {
  try {
    sessionStorage.setItem(CREATOR_APPLY_INTENT_KEY, '1');
  } catch {
    /* quota / private mode */
  }
}

export function hasCreatorApplyIntent(): boolean {
  try {
    return sessionStorage.getItem(CREATOR_APPLY_INTENT_KEY) === '1';
  } catch {
    return false;
  }
}

/** Remember a non-default target from the current auth URL (tab session). */
export function persistAuthPostLoginTargetFromParams(
  next: string | null,
  redirectTo: string | null,
): void {
  const t = safeRedirectTarget(next ?? redirectTo);
  if (isApplyIntentPath(t)) markCreatorApplyIntent();
  if (t === '/account') return;
  try {
    sessionStorage.setItem(AUTH_POST_LOGIN_NEXT_KEY, t);
  } catch {
    /* quota / private mode */
  }
}

/** Prefer explicit URL params; otherwise reuse the last persisted intent (OAuth bounce). */
export function effectivePostAuthTarget(next: string | null, redirectTo: string | null): string {
  const fromUrl = safeRedirectTarget(next ?? redirectTo);
  if (fromUrl !== '/account') return fromUrl;
  try {
    const stored = sessionStorage.getItem(AUTH_POST_LOGIN_NEXT_KEY);
    if (stored) return safeRedirectTarget(stored);
  } catch {
    /* noop */
  }
  if (hasCreatorApplyIntent()) return '/apply';
  return '/account';
}

export function clearPersistedAuthPostLoginTarget(): void {
  try {
    sessionStorage.removeItem(AUTH_POST_LOGIN_NEXT_KEY);
  } catch {
    /* noop */
  }
}

export function clearCreatorApplyIntent(): void {
  try {
    sessionStorage.removeItem(CREATOR_APPLY_INTENT_KEY);
  } catch {
    /* noop */
  }
}

export function clearAuthRedirectState(): void {
  clearPersistedAuthPostLoginTarget();
  clearCreatorApplyIntent();
}

/** Subscriber email sign-ups must land in the member hub, not studio/apply,
 * unless they explicitly chose Subscriber while in the creator-apply flow. */
function subscriberSignupLanding(resolvedSafeTarget: string): string {
  if (resolvedSafeTarget.startsWith('/dashboard') || resolvedSafeTarget.startsWith('/apply')) {
    return '/account';
  }
  return resolvedSafeTarget;
}

export type AuthRedirectFlow = 'signIn' | 'signUp';
export type SignupPersona = 'subscriber' | 'creator';

/** Single resolver for OAuth bounce, password auth, and already-signed-in visits to `/auth`. */
export function resolvePostAuthDestination(opts: {
  target: string;
  flow: AuthRedirectFlow;
  signupPersona?: SignupPersona;
  creatorId?: string | null;
  applyIntent?: boolean;
}): string {
  const applyIntent =
    opts.applyIntent ?? (hasCreatorApplyIntent() || isApplyIntentPath(opts.target));

  if (opts.creatorId) return '/dashboard';

  if (applyIntent) {
    if (opts.flow === 'signUp' && opts.signupPersona === 'subscriber') {
      return '/account';
    }
    return '/apply';
  }

  if (opts.flow === 'signUp' && opts.signupPersona === 'subscriber') {
    return subscriberSignupLanding(opts.target);
  }

  return opts.target;
}
