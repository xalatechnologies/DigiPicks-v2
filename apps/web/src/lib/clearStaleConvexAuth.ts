import { signOutWithTimeout } from './authRetry';

const AUTH_KEY_PREFIXES = [
  '__convexAuthJWT',
  '__convexAuthRefreshToken',
  '__convexAuthOAuthVerifier',
  '__convexAuthServerStateFetchTime',
] as const;

function storageNamespace(convexUrl: string): string {
  return convexUrl.replace(/[^a-zA-Z0-9]/g, '');
}

/** Remove persisted Convex Auth tokens for this deployment (stale JWT after key rotation). */
export function clearStaleConvexAuthStorage(convexUrl?: string): void {
  const url = convexUrl ?? (import.meta.env.VITE_CONVEX_URL as string | undefined);
  if (!url || typeof localStorage === 'undefined') return;
  const ns = storageNamespace(url);
  for (const prefix of AUTH_KEY_PREFIXES) {
    localStorage.removeItem(`${prefix}_${ns}`);
  }
}

/**
 * Sign out via Convex Auth and wipe local tokens so the next sign-in sends a fresh JWT.
 */
export async function resetConvexAuthSession(
  signOut: () => Promise<unknown>,
  convexUrl?: string,
): Promise<void> {
  await signOutWithTimeout(signOut);
  clearStaleConvexAuthStorage(convexUrl);
}
