import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

function storageNamespace(convexUrl: string): string {
  return convexUrl.replace(/[^a-zA-Z0-9]/g, '');
}

export function getStoredConvexAuthToken(convexUrl?: string): string | null {
  const url = convexUrl ?? (import.meta.env.VITE_CONVEX_URL as string | undefined);
  if (!url || typeof localStorage === 'undefined') return null;
  return localStorage.getItem(`__convexAuthJWT_${storageNamespace(url)}`);
}

export function hasStoredConvexAuthToken(convexUrl?: string): boolean {
  return getStoredConvexAuthToken(convexUrl) !== null;
}

/** Fingerprint for comparing tokens before/after sign-in (not cryptographic). */
export function fingerprintToken(token: string | null): string | null {
  if (!token) return null;
  return `${token.length}:${token.slice(0, 12)}:${token.slice(-12)}`;
}

type JwtPayloadPreview = { iss?: string; exp?: number; sub?: string };

/** Decode JWT payload without verification (dev diagnostics only). */
export function decodeJwtPayloadPreview(token: string): JwtPayloadPreview | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayloadPreview;
  } catch {
    return null;
  }
}

function expectedIssuer(convexUrl: string): string {
  return convexUrl.replace('.convex.cloud', '.convex.site');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export type WaitForConvexAuthSessionResult =
  | { ok: true; userId: string }
  | {
      ok: false;
      reason: 'no-token' | 'stale-token' | 'server-rejected';
      detail?: string;
    };

/**
 * After `signIn()`, wait until Convex Auth persisted a new JWT and the deployment
 * accepts it (does not rely on React re-renders).
 *
 * @param tokenBeforeSignIn - fingerprint from `fingerprintToken(getStoredConvexAuthToken())` before sign-in
 */
export async function waitForConvexAuthSession(
  timeoutMs = 30_000,
  convexUrl?: string,
  tokenBeforeSignIn?: string | null,
): Promise<WaitForConvexAuthSessionResult> {
  const url = convexUrl ?? (import.meta.env.VITE_CONVEX_URL as string | undefined);
  if (!url) {
    return { ok: false, reason: 'no-token', detail: 'VITE_CONVEX_URL is not set.' };
  }

  const started = Date.now();
  let token: string | null = null;

  while (Date.now() - started < timeoutMs) {
    token = getStoredConvexAuthToken(url);
    if (token) {
      const after = fingerprintToken(token);
      if (tokenBeforeSignIn && after === tokenBeforeSignIn) {
        await sleep(150);
        continue;
      }
      break;
    }
    await sleep(100);
  }

  if (!token) {
    return { ok: false, reason: 'no-token', detail: 'No __convexAuthJWT_* entry in localStorage.' };
  }

  if (tokenBeforeSignIn && fingerprintToken(token) === tokenBeforeSignIn) {
    return {
      ok: false,
      reason: 'stale-token',
      detail: 'Sign-in did not replace the previous JWT in localStorage.',
    };
  }

  const client = new ConvexHttpClient(url);

  let lastDetail = 'Convex returned no authenticated user for this token.';
  const probeStarted = Date.now();
  const remaining = () => Math.max(0, timeoutMs - (Date.now() - started));

  while (Date.now() - probeStarted < remaining()) {
    const freshToken = getStoredConvexAuthToken(url);
    if (freshToken) {
      client.setAuth(freshToken);
    }
    try {
      let userId: string | null = null;
      try {
        const probe = await client.query(api.users.authSessionProbe, {});
        userId = probe.userId;
        if (!userId && probe.hasIdentity === false && import.meta.env.DEV) {
          const preview = decodeJwtPayloadPreview(token);
          const expected = expectedIssuer(url);
          if (preview?.iss && preview.iss !== expected) {
            lastDetail = `JWT issuer "${preview.iss}" does not match deployment "${expected}". Run pnpm verify:convex-auth.`;
          } else if (preview?.exp && preview.exp * 1000 < Date.now()) {
            lastDetail = 'JWT is expired. Clear site data and sign in again.';
          }
        }
      } catch (probeErr: unknown) {
        const msg = probeErr instanceof Error ? probeErr.message : String(probeErr);
        if (msg.includes('Could not find public function')) {
          const me = await client.query(api.users.meSafe, {});
          userId = me?._id ?? null;
          if (!userId) {
            lastDetail =
              'Convex deployment is missing users.authSessionProbe. Run `npx convex deploy` for this project, or set VITE_CONVEX_URL to a deployment with the latest functions.';
          }
        } else {
          throw probeErr;
        }
      }
      if (userId) {
        return { ok: true, userId };
      }
    } catch (err: unknown) {
      lastDetail = err instanceof Error ? err.message : String(err);
    }
    await sleep(200);
  }

  return { ok: false, reason: 'server-rejected', detail: lastDetail };
}
