import React, { useEffect, useRef, useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthActions, useAction, useConvexAuth, useMutation } from '../auth/convexAuth';
import {
  AuthLayout,
  AuthAside,
  AuthCard,
  AuthDivider,
  AuthFooterLink,
  AuthMethodButton,
  Field,
  Input,
  PasswordInput,
  Button,
  Logo,
  Icon,
  Stack,
  Muted,
} from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';
import { becomeCreatorCtaLabel, navigateBecomeCreator } from '../lib/becomeCreator';
import {
  clearAuthRedirectState,
  effectivePostAuthTarget,
  hasCreatorApplyIntent,
  isApplyIntentPath,
  persistAuthPostLoginTargetFromParams,
  resolvePostAuthDestination,
  type SignupPersona,
} from '../lib/authPostLoginTarget';
import { formatAuthError } from '../lib/formatAuthError';
import { passwordSignInWithRetry } from '../lib/authRetry';
import { resetConvexAuthSession } from '../lib/clearStaleConvexAuth';
import {
  fingerprintToken,
  getStoredConvexAuthToken,
  waitForConvexAuthSession,
} from '../lib/waitForConvexAuthSession';
import { clearDevAdminSignedOut } from '../lib/devAdminSession';
import {
  canDevAutoSignInAdmin,
  DEFAULT_DEV_ADMIN_EMAIL,
  isDevAdminEmail,
} from '../lib/devAdminDefaults';
import { useAuthSession } from '../auth/useAuthSession';

type AuthStep = 'methods' | 'email-password';

function defaultSignupPersonaFromLocation(): SignupPersona {
  return 'subscriber';
}

function readCredentialsFromForm(form: HTMLFormElement): { email: string; password: string } {
  const fd = new FormData(form);
  return {
    email: String(fd.get('email') ?? '').trim(),
    password: String(fd.get('password') ?? ''),
  };
}

export function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signIn, signOut } = useAuthActions();
  const { isLoading: convexAuthLoading, isAuthenticated: convexAuthenticated } = useConvexAuth();
  const { isAuthenticated, me, profileReady, serverAuthUserId } = useAuthSession();
  const authSnapshot = useRef({
    convexAuthenticated: false,
    convexAuthLoading: true,
    profileReady: false,
    me: null as typeof me,
    serverAuthUserId: null as string | null,
  });
  authSnapshot.current = {
    convexAuthenticated,
    convexAuthLoading,
    profileReady,
    me,
    serverAuthUserId,
  };
  const claimDevAdminSession = useMutation(api.devProvision.claimDevAdminSession);
  const bootstrapDevAdmin = useAction(api.devProvisionActions.bootstrapDevAdmin);
  const [step, setStep] = useState<AuthStep>('methods');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [signupPersona, setSignupPersona] = useState<SignupPersona>(
    defaultSignupPersonaFromLocation,
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [lastFlow, setLastFlow] = useState<'signIn' | 'signUp'>('signIn');
  const submittingRef = useRef(false);

  const nextParam = params.get('next');
  const redirectToParam = params.get('redirectTo');

  useEffect(() => {
    persistAuthPostLoginTargetFromParams(nextParam, redirectToParam);
  }, [nextParam, redirectToParam]);

  const target = effectivePostAuthTarget(nextParam, redirectToParam);
  const applyIntent = hasCreatorApplyIntent() || isApplyIntentPath(target);
  const adminIntent = target.startsWith('/admin');

  useEffect(() => {
    if (applyIntent) setMode('signIn');
  }, [applyIntent]);

  // Admin login: skip the method picker and open the email form directly.
  useEffect(() => {
    if (!adminIntent) return;
    setStep('email-password');
    setMode('signIn');
  }, [adminIntent]);

  useEffect(() => {
    if (submittingRef.current) return;
    if (!isAuthenticated || convexAuthLoading || !profileReady || !me) return;

    let cancelled = false;

    void (async () => {
      const dest = resolvePostAuthDestination({
        target,
        flow: lastFlow,
        signupPersona: lastFlow === 'signUp' ? signupPersona : undefined,
        creatorId: me.creatorId ?? null,
        applyIntent,
      });

      if (dest.startsWith('/admin')) {
        if (!isDevAdminEmail(me.email)) {
          setError(
            `Signed in as ${me.email ?? 'this account'}, not the platform admin. Sign out from the header menu, then sign in with ${DEFAULT_DEV_ADMIN_EMAIL}.`,
          );
          return;
        }
        try {
          await claimDevAdminSession({});
        } catch {
          /* AdminAuthGate surfaces claim errors */
        }
      }

      if (cancelled) return;
      clearAuthRedirectState();
      navigate(dest, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    applyIntent,
    claimDevAdminSession,
    convexAuthLoading,
    isAuthenticated,
    lastFlow,
    me,
    navigate,
    profileReady,
    signupPersona,
    target,
  ]);

  async function waitForAuthStatus(predicate: () => boolean, timeoutMs = 12_000): Promise<boolean> {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (predicate()) return true;
      await new Promise((r) => window.setTimeout(r, 80));
    }
    return predicate();
  }

  /** Navigate only after Convex confirms the server-side session. */
  async function finishAdminSignIn() {
    clearAuthRedirectState();
    clearDevAdminSignedOut();
    setStatusMessage('Opening admin portal…');
    navigate('/admin', { replace: true });
  }

  async function runPasswordAuth(
    form: HTMLFormElement,
    flow: 'signIn' | 'signUp',
    signupPersonaForRedirect?: SignupPersona,
  ) {
    const { email, password } = readCredentialsFromForm(form);
    const fd = new FormData(form);
    fd.set('flow', flow);

    const dest = resolvePostAuthDestination({
      target,
      flow,
      signupPersona: flow === 'signUp' ? signupPersonaForRedirect : undefined,
      creatorId: me?.creatorId ?? null,
      applyIntent,
    });
    const goingAdmin = dest.startsWith('/admin') || isDevAdminEmail(email);

    if (goingAdmin && !isDevAdminEmail(email)) {
      setError(`Use the platform admin email (${DEFAULT_DEV_ADMIN_EMAIL}) to open /admin.`);
      return;
    }

    try {
      const tokenBefore = fingerprintToken(getStoredConvexAuthToken());

      if (goingAdmin) {
        setStatusMessage('Clearing old session…');
        await resetConvexAuthSession(signOut);
      }

      if (goingAdmin && canDevAutoSignInAdmin()) {
        setStatusMessage('Preparing dev admin account…');
        try {
          await bootstrapDevAdmin({});
        } catch {
          /* bootstrap is best-effort in dev */
        }
      }

      setStatusMessage('Signing in…');
      await passwordSignInWithRetry(signIn, fd);
      clearDevAdminSignedOut();
      setLastFlow(flow);

      setStatusMessage('Confirming session…');
      const session = await waitForConvexAuthSession(
        35_000,
        undefined,
        goingAdmin ? null : tokenBefore,
      );
      if (!session.ok) {
        const base =
          session.reason === 'no-token'
            ? 'Sign-in did not finish — no auth token was saved. Wait until the page has fully loaded, then try again.'
            : session.reason === 'stale-token'
              ? 'Sign-in did not replace the previous session token. Clear site data for this localhost port and try again.'
              : 'Sign-in saved a token but Convex rejected it.';
        const detail = session.detail ? ` ${session.detail}` : '';
        const hint =
          session.reason === 'server-rejected'
            ? ' Run `pnpm verify:convex-auth` from the repo root.'
            : '';
        setError(`${base}${detail}${hint}`);
        return;
      }

      if (goingAdmin) {
        await waitForAuthStatus(
          () => !authSnapshot.current.convexAuthLoading && authSnapshot.current.convexAuthenticated,
          10_000,
        );
        try {
          await claimDevAdminSession({});
        } catch {
          /* AdminAuthGate can claim/repair */
        }
        await finishAdminSignIn();
        return;
      }

      setStatusMessage('');
      clearAuthRedirectState();
      navigate(dest, { replace: true });
    } catch (err: unknown) {
      setError(formatAuthError(err, flow));
      setStatusMessage('');
    }
  }

  async function submitPasswordForm(
    form: HTMLFormElement,
    flow: 'signIn' | 'signUp',
    signupPersonaForRedirect?: SignupPersona,
  ) {
    if (submittingRef.current) return;

    const { email, password } = readCredentialsFromForm(form);
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }

    submittingRef.current = true;
    setError('');
    setStatusMessage('');
    setLoading(true);

    try {
      await runPasswordAuth(form, flow, signupPersonaForRedirect);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await submitPasswordForm(e.currentTarget, mode, mode === 'signUp' ? signupPersona : undefined);
  }

  const isSignUp = mode === 'signUp';

  function openEmailFlow(nextMode: 'signIn' | 'signUp') {
    setMode(nextMode);
    setStep('email-password');
    setError('');
    if (nextMode === 'signUp') {
      setSignupPersona('subscriber');
    }
  }

  return (
    <AuthLayout
      formHeaderLeft={
        <Button
          variant="ghost"
          size="sm"
          iconLeft="arrow-left"
          onClick={() => (step === 'methods' ? navigate('/') : setStep('methods'))}
        >
          {step === 'methods' ? 'Back to home' : 'Back'}
        </Button>
      }
      formHeaderRight={
        <Button
          variant="ghost"
          size="sm"
          iconRight="arrow-right"
          onClick={() =>
            navigateBecomeCreator(navigate, {
              isAuthenticated,
              creatorId: me?.creatorId ?? null,
            })
          }
        >
          {becomeCreatorCtaLabel(me?.creatorId ?? null)}
        </Button>
      }
      aside={
        <AuthAside
          brand={
            <Logo size={36} showWord onClick={() => navigate('/')} aria-label="DigiPicks home" />
          }
          eyebrow="Welcome to the network"
          title={
            <>
              Premium picks. <em>Real edge.</em>
              <br />
              All in one place.
            </>
          }
          subtitle="A curated network for sports betting creators and the subscribers who back their edge — graded by the platform, not by anyone with skin in the game."
          stats={[
            { value: '142', label: 'Verified creators' },
            { value: '58.4%', label: 'Network win rate' },
            { value: '38.4k', label: 'Active subscribers' },
          ]}
          trust={[
            { icon: <Icon name="verified" size={14} />, label: 'Manual creator verification' },
            { icon: <Icon name="chart" size={14} />, label: 'Independently graded results' },
            { icon: <Icon name="shield" size={14} />, label: 'Stripe-backed billing · 21+ only' },
          ]}
          footerLeft="© 2026 DigiPicks"
        />
      }
    >
      {step === 'methods' ? (
        <AuthCard
          title={applyIntent ? 'Sign in' : 'Welcome'}
          subtitle={
            applyIntent
              ? 'Sign in with your subscriber account, or create one first — then you can complete your creator application.'
              : 'Sign in if you already have an account — creators, subscribers, and admins.'
          }
          error={error || undefined}
          footer={
            <Stack gap={4} align="stretch">
              {applyIntent ? (
                <AuthFooterLink
                  text="New to DigiPicks?"
                  linkText="Create subscriber account"
                  onClick={() => openEmailFlow('signUp')}
                />
              ) : (
                <AuthMethodButton
                  icon={<Icon name="user" size={18} />}
                  label="Sign up as a subscriber"
                  onClick={() => openEmailFlow('signUp')}
                />
              )}
              <Stack align="center">
                <AuthFooterLink
                  text="Privacy"
                  linkText="Terms of Use"
                  onClick={() => navigate('/legal/terms')}
                />
              </Stack>
            </Stack>
          }
        >
          <Stack gap={4}>
            <AuthMethodButton
              icon={<Icon name="discord" size={18} />}
              label="Continue with Discord"
              description="Sign in with your Discord account"
              onClick={() => {
                persistAuthPostLoginTargetFromParams(nextParam, redirectToParam);
                void signIn('discord');
              }}
            />

            <AuthMethodButton
              icon={<Icon name="inbox" size={18} />}
              label="Sign in with email"
              description="Sign in here with your email and password."
              onClick={() => openEmailFlow('signIn')}
            />

            <AuthDivider text="Or use one of these" />

            <AuthMethodButton
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
                    fill="#EA4335"
                  />
                </svg>
              }
              label="Google"
              description="Sign in with your Google account"
              arrow
            />
          </Stack>
        </AuthCard>
      ) : (
        <AuthCard
          title={isSignUp ? 'Create your account' : 'Sign in with email'}
          subtitle={
            isSignUp
              ? signupPersona === 'creator'
                ? 'Create your login, then complete your creator application on the next screen.'
                : 'Follow creators, save picks, and track your results.'
              : adminIntent
                ? `Platform admin sign-in (${DEFAULT_DEV_ADMIN_EMAIL}).`
                : 'Enter your email and password to continue.'
          }
          error={error || undefined}
          footer={
            <AuthFooterLink
              text={isSignUp ? 'Already have an account?' : "Don't have an account?"}
              linkText={isSignUp ? 'Sign in' : 'Sign up free'}
              onClick={() => {
                setMode(isSignUp ? 'signIn' : 'signUp');
                setError('');
                if (!isSignUp) {
                  setSignupPersona('subscriber');
                }
              }}
            />
          }
        >
          <form id="auth-email-form" onSubmit={handlePasswordSubmit} noValidate>
            <Stack gap={4}>
              {isSignUp ? (
                <Stack gap={2}>
                  <Muted>
                    {applyIntent
                      ? 'Step 1: create your subscriber login. Step 2: complete the creator application on the next screen.'
                      : 'Subscriber accounts follow creators and track picks in the member hub.'}
                  </Muted>
                  {!applyIntent ? (
                    <Muted>
                      Want to publish on DigiPicks?{' '}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/auth?next=/apply')}
                      >
                        Apply as a creator
                      </Button>
                    </Muted>
                  ) : null}
                </Stack>
              ) : null}

              <Field label="Email" htmlFor="auth-email" required>
                <Input
                  id="auth-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  defaultValue={adminIntent ? DEFAULT_DEV_ADMIN_EMAIL : undefined}
                />
              </Field>

              <Field label="Password" htmlFor="auth-password" required>
                <PasswordInput
                  id="auth-password"
                  name="password"
                  placeholder={
                    isSignUp ? 'Create a password (min. 8 characters)' : 'Enter your password'
                  }
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  minLength={8}
                  required
                />
              </Field>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                disabled={loading}
                iconRight={loading ? undefined : 'arrow-right'}
              >
                {loading
                  ? isSignUp
                    ? 'Creating account…'
                    : 'Signing in…'
                  : isSignUp
                    ? 'Create account'
                    : 'Sign in'}
              </Button>

              {statusMessage ? <Muted>{statusMessage}</Muted> : null}
            </Stack>
          </form>
        </AuthCard>
      )}
    </AuthLayout>
  );
}
