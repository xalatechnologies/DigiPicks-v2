import React, { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
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
  safeRedirectTarget,
  type SignupPersona,
} from '../lib/authPostLoginTarget';
import { formatAuthError } from '../lib/formatAuthError';

type AuthStep = 'methods' | 'email-password';

function defaultSignupPersonaFromLocation(): SignupPersona {
  return 'subscriber';
}

export function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');
  const [step, setStep] = useState<AuthStep>('methods');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [signupPersona, setSignupPersona] = useState<SignupPersona>(
    defaultSignupPersonaFromLocation,
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nextParam = params.get('next');
  const redirectToParam = params.get('redirectTo');

  // Tab session: OAuth often returns without `?next=`; keep Become a creator intent.
  useEffect(() => {
    persistAuthPostLoginTargetFromParams(nextParam, redirectToParam);
  }, [nextParam, redirectToParam]);

  const target = effectivePostAuthTarget(nextParam, redirectToParam);
  const applyIntent = hasCreatorApplyIntent() || isApplyIntentPath(target);

  // Returning applicants should sign in, not re-register on this page.
  useEffect(() => {
    if (applyIntent) setMode('signIn');
  }, [applyIntent]);

  // Already signed in (or OAuth just finished): leave `/auth` immediately.
  useEffect(() => {
    if (!isAuthenticated) return;

    const dest = resolvePostAuthDestination({
      target,
      flow: 'signIn',
      creatorId: me?.creatorId ?? null,
      applyIntent,
    });
    clearAuthRedirectState();
    navigate(dest, { replace: true });
  }, [isAuthenticated, me?.creatorId, navigate, target, applyIntent]);

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  async function runPasswordAuth(
    formData: FormData,
    flow: 'signIn' | 'signUp',
    signupPersonaForRedirect?: SignupPersona,
  ) {
    formData.set('flow', flow);

    try {
      await signIn('password', formData);

      const dest = resolvePostAuthDestination({
        target,
        flow,
        signupPersona: signupPersonaForRedirect,
        creatorId: me?.creatorId ?? null,
        applyIntent,
      });
      clearAuthRedirectState();
      navigate(dest, { replace: true });
    } catch (err: unknown) {
      setError(formatAuthError(err, flow));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email = emailInput.trim();
    const fd = new FormData();
    fd.set('email', email);
    fd.set('password', passwordInput);
    fd.set('flow', mode === 'signUp' ? 'signUp' : 'signIn');
    await runPasswordAuth(fd, mode, mode === 'signUp' ? signupPersona : undefined);
  }

  const isSignUp = mode === 'signUp';

  function openEmailFlow(nextMode: 'signIn' | 'signUp') {
    if (applyIntent && nextMode === 'signUp') {
      navigate('/apply');
      return;
    }
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
          brand={<Logo size={36} showWord />}
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
          footerRight="Bet responsibly · 1-800-GAMBLER"
        />
      }
    >
      {step === 'methods' ? (
        <AuthCard
          title={applyIntent ? 'Sign in' : 'Welcome'}
          subtitle={
            applyIntent
              ? 'Sign in to continue your application, open your creator studio, or access your subscriber hub.'
              : 'Sign in if you already have an account — creators, subscribers, and admins.'
          }
          error={error || undefined}
          footer={
            <Stack gap={4} align="stretch">
              {applyIntent ? (
                <AuthFooterLink
                  text="New creator?"
                  linkText="Start your application"
                  onClick={() => navigate('/apply')}
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
              : 'Enter your email and password to continue.'
          }
          error={error || undefined}
          footer={
            <AuthFooterLink
              text={isSignUp ? 'Already have an account?' : "Don't have an account?"}
              linkText={isSignUp ? 'Sign in' : 'Sign up free'}
              onClick={() => {
                setMode(isSignUp ? 'signIn' : 'signUp');
                setPasswordInput('');
                setError('');
                if (!isSignUp) {
                  setSignupPersona('subscriber');
                }
              }}
            />
          }
        >
          <form onSubmit={handlePasswordSubmit}>
            <Stack gap={4}>
              {isSignUp ? (
                <Stack gap={2}>
                  <Muted>
                    Subscriber accounts follow creators and track picks in the member hub.
                  </Muted>
                  <Muted>
                    Want to publish on DigiPicks?{' '}
                    <Button variant="ghost" size="sm" onClick={() => navigate('/apply')}>
                      Apply as a creator
                    </Button>
                  </Muted>
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
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
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
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
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
            </Stack>
          </form>
        </AuthCard>
      )}
    </AuthLayout>
  );
}
