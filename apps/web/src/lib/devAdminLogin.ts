import { useAuthActions, useAction, useConvexAuth, useMutation } from '../auth/convexAuth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../../convex/_generated/api';
import { formatAuthError } from './formatAuthError';
import {
  canDevAutoSignInAdmin,
  resolveDevAdminCredentials,
  isDevAdminEmail,
} from './devAdminDefaults';
import { clearDevAdminPreview } from './devAdminPreview';
import { hasStoredConvexAuthToken } from './waitForConvexAuthSession';
import { resetConvexAuthSession } from './clearStaleConvexAuth';
import { clearDevAdminSignedOut, hasDevAdminSignedOut } from './devAdminSession';

export { markDevAdminSignedOut, clearDevAdminSignedOut } from './devAdminSession';
export { canDevAutoSignInAdmin, isDevAdminEmail } from './devAdminDefaults';

const STEP_TIMEOUT_MS = 45_000;

export type DevAdminSignInPhase = 'idle' | 'waiting_auth' | 'booting' | 'done' | 'error';

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`));
    }, ms);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        window.clearTimeout(timer);
        reject(err);
      });
  });
}

function authErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function isCredentialMismatch(msg: string): boolean {
  return /InvalidAccountId|InvalidSecret|Invalid credentials|invalid password|account not found/i.test(
    msg,
  );
}

function isTransientAuthError(msg: string): boolean {
  return (
    msg.includes('Connection lost') ||
    msg.includes('in flight') ||
    msg.includes('WebSocket') ||
    msg.includes('timed out')
  );
}

type SignInFn = (provider: string, formData: FormData) => Promise<unknown>;

async function passwordAuth(signIn: SignInFn, flow: 'signIn' | 'signUp') {
  const { email, password } = resolveDevAdminCredentials();
  const fd = new FormData();
  fd.set('email', email);
  fd.set('password', password);
  fd.set('flow', flow);
  await signIn('password', fd);
}

/** Sign in, or register once — role/email finalized via `claimDevAdminSession`. */
async function devAdminSignInOrRegister(signIn: SignInFn) {
  try {
    await passwordAuth(signIn, 'signIn');
    return;
  } catch (signInErr: unknown) {
    const signInMsg = authErrorMessage(signInErr);
    if (isTransientAuthError(signInMsg)) {
      throw signInErr;
    }
    if (!isCredentialMismatch(signInMsg)) {
      throw signInErr;
    }
  }

  try {
    await passwordAuth(signIn, 'signUp');
  } catch (signUpErr: unknown) {
    const signUpMsg = authErrorMessage(signUpErr);
    if (signUpMsg.includes('already exists')) {
      throw new Error(
        'Dev admin account exists but the password did not match. Use admin@digipicks.com / AdminDev123! or run `npx convex run devProvisionActions:bootstrapDevAdmin` then try again.',
      );
    }
    throw signUpErr;
  }
}

type BootstrapFn = () => Promise<{ email: string; userId: string }>;
type ClaimFn = () => Promise<{ userId: string; email: string; role: 'admin' }>;

async function runDevAdminAuthPipeline(
  bootstrap: BootstrapFn,
  signIn: SignInFn,
  claimSession: ClaimFn,
) {
  try {
    await bootstrap();
  } catch (bootstrapErr: unknown) {
    const msg = authErrorMessage(bootstrapErr);
    if (!isTransientAuthError(msg) && !msg.includes('disabled')) {
      console.warn('[devAdmin] bootstrapDevAdmin:', msg);
    }
  }

  await devAdminSignInOrRegister(signIn);
  await claimSession();
}

/**
 * Wraps admin routes: bootstrap credentials → password sign-in → claim admin role.
 */
export function useDevAdminAutoSignIn(): {
  phase: DevAdminSignInPhase;
  ready: boolean;
  error: string | null;
  retry: () => void;
} {
  const { signIn, signOut } = useAuthActions();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const serverAuthed = isAuthenticated;
  const bootstrapDevAdmin = useAction(api.devProvisionActions.bootstrapDevAdmin);
  const claimDevAdminSession = useMutation(api.devProvision.claimDevAdminSession);
  const [phase, setPhase] = useState<DevAdminSignInPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const runGen = useRef(0);
  const bootStartedForAttempt = useRef(-1);

  const retry = useCallback(() => {
    clearDevAdminSignedOut();
    runGen.current += 1;
    bootStartedForAttempt.current = -1;
    setError(null);
    setPhase('idle');
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!canDevAutoSignInAdmin()) {
      setPhase('done');
      return;
    }
    if (hasDevAdminSignedOut()) {
      setPhase('done');
      return;
    }
    if (authLoading) {
      setPhase((prev) => (prev === 'booting' ? 'booting' : 'waiting_auth'));
      return;
    }
    // Convex sees a valid identity — no password sign-in needed.
    if (serverAuthed) {
      setPhase('done');
      return;
    }
    if (bootStartedForAttempt.current === attempt) {
      return;
    }
    bootStartedForAttempt.current = attempt;

    const gen = ++runGen.current;
    setPhase('booting');
    setError(null);

    void (async () => {
      const stale = () => gen !== runGen.current;

      try {
        if (hasStoredConvexAuthToken()) {
          await resetConvexAuthSession(signOut);
          if (stale()) return;
        }
        await withTimeout(
          runDevAdminAuthPipeline(
            () => bootstrapDevAdmin({}),
            signIn,
            () => claimDevAdminSession({}),
          ),
          STEP_TIMEOUT_MS,
          'Dev admin auth',
        );
        if (stale()) return;
        clearDevAdminPreview();
        setPhase('done');
      } catch (err: unknown) {
        if (stale()) return;
        setPhase('error');
        setError(formatAuthError(err, 'signIn'));
      }
    })();
  }, [
    attempt,
    authLoading,
    bootstrapDevAdmin,
    claimDevAdminSession,
    isAuthenticated,
    serverAuthed,
    signIn,
    signOut,
  ]);

  const ready = !canDevAutoSignInAdmin() || phase === 'done' || phase === 'error';

  return { phase, ready, error, retry };
}

const ADMIN_ROLES = new Set(['super_admin', 'tenant_admin', 'admin']);

/**
 * After password sign-in, ensure `users.role` is admin (covers stale rows / missed callbacks).
 */
export function useClaimDevAdminRole(
  isAuthenticated: boolean,
  me: { role?: string; email?: string | null } | null | undefined,
): { claiming: boolean; claimError: string | null; retryClaim: () => void } {
  const claimDevAdminSession = useMutation(api.devProvision.claimDevAdminSession);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimAttempt, setClaimAttempt] = useState(0);
  const claimStarted = useRef(false);

  const retryClaim = useCallback(() => {
    claimStarted.current = false;
    setClaimError(null);
    setClaimAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!canDevAutoSignInAdmin() || !isAuthenticated || me === undefined || me === null) {
      return;
    }
    if (ADMIN_ROLES.has(me.role ?? '')) {
      claimStarted.current = false;
      return;
    }
    if (claimStarted.current) {
      return;
    }
    claimStarted.current = true;
    setClaiming(true);
    setClaimError(null);

    void (async () => {
      const maxAttempts = 6;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          await claimDevAdminSession({});
          setClaimError(null);
          return;
        } catch (err: unknown) {
          const msg = authErrorMessage(err);
          const unauthorized = msg.includes('Unauthorized');
          if (!unauthorized || attempt === maxAttempts - 1) {
            setClaimError(formatAuthError(err, 'signIn'));
            claimStarted.current = false;
            return;
          }
          await new Promise((r) => window.setTimeout(r, 400 * (attempt + 1)));
        }
      }
    })().finally(() => {
      setClaiming(false);
    });
  }, [claimAttempt, claimDevAdminSession, isAuthenticated, me?.email, me?.role]);

  return { claiming, claimError, retryClaim };
}
