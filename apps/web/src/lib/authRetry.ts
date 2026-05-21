/** True when Convex Auth / WebSocket failed transiently (safe to retry). */
export function isTransientAuthErrorMessage(msg: string): boolean {
  return (
    msg.includes('Connection lost') ||
    msg.includes('in flight') ||
    msg.includes('WebSocket') ||
    msg.includes('network') ||
    msg.includes('timed out')
  );
}

export function authErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

const RETRY_DELAY_MS = 600;

/**
 * Password sign-in with short retries — avoids surfacing WebSocket blips from
 * sign-out → sign-in or Vite HMR as hard failures.
 */
/** Avoid hung submit when switching accounts — Convex `signOut` can stall the UI. */
export async function signOutWithTimeout(
  signOut: () => Promise<unknown>,
  timeoutMs = 4_000,
): Promise<void> {
  try {
    await Promise.race([
      signOut(),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('signOut timed out')), timeoutMs);
      }),
    ]);
  } catch {
    /* Next password sign-in still runs; session will be replaced if successful. */
  }
}

export async function passwordSignInWithRetry(
  signIn: (provider: string, formData: FormData) => Promise<unknown>,
  formData: FormData,
  maxAttempts = 4,
): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await Promise.race([
        signIn('password', formData),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('Sign-in timed out after 20s')), 20_000);
        }),
      ]);
      return;
    } catch (err: unknown) {
      lastErr = err;
      const msg = authErrorMessage(err);
      if (!isTransientAuthErrorMessage(msg) || attempt === maxAttempts - 1) {
        throw err;
      }
      await new Promise((r) => window.setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastErr;
}
