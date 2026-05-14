import React, { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react';
import {
  AuthLayout,
  AuthAside,
  AuthCard,
  AuthDivider,
  AuthFooterLink,
  AuthMethodButton,
  AuthSavedGroup,
  Field,
  Input,
  PasswordInput,
  Button,
  Checkbox,
  Logo,
  Icon,
  Stack,
  Row,
  Muted,
} from '@digipicks/ds';
import { listSavedEmails, rememberEmail, forgetEmail, type SavedEmail } from '../lib/savedEmails';
import { DEV_DEMO_EMAIL, DEV_DEMO_PASSWORD, DEV_DEMO_UNLOCK } from '../lib/devDemoLogin';

type AuthStep = 'methods' | 'email-password';

/** Resolve the post-auth landing target. Honors ?next= (AuthGate) and
 *  ?redirectTo= (legacy) then defaults to /account. Same-origin paths only. */
function safeRedirectTarget(raw: string | null): string {
  if (!raw) return '/account';
  // Only accept relative same-origin paths.
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/account';
  // Don't bounce back to the auth page itself.
  if (raw.startsWith('/auth')) return '/account';
  return raw;
}

export function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const [step, setStep] = useState<AuthStep>('methods');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const target = safeRedirectTarget(params.get('next') ?? params.get('redirectTo'));

  // Already signed in → don't strand the user on the auth page. Covers
  // both "land on /auth while authed" and "Discord OAuth round-tripped
  // back to /auth before completing the session" (the redirect fires as
  // soon as `isAuthenticated` flips true).
  useEffect(() => {
    if (isAuthenticated) navigate(target, { replace: true });
  }, [isAuthenticated, navigate, target]);

  // Saved emails (30-day TTL via localStorage). The list is hydrated on
  // mount; clicking a saved row pre-fills the email + jumps to the
  // password step so returning users skip retyping the address.
  const [saved, setSaved] = useState<SavedEmail[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  function fillDemoCredentials(forSignUp: boolean) {
    setEmailInput(DEV_DEMO_EMAIL);
    setPasswordInput(DEV_DEMO_PASSWORD);
    setMode(forSignUp ? 'signUp' : 'signIn');
    setStep('email-password');
    setError('');
  }

  useEffect(() => {
    setSaved(listSavedEmails());
  }, []);

  // Saved-email click → pre-fill the password form so the browser's
  // password manager auto-fills the password field (when it has the
  // credential cached). The user lands one Submit-click away from sign
  // in. If they're already authenticated on this device, the effect
  // above redirects them away from /auth before this even runs. We do
  // NOT send a magic link here — explicit user choice (kept as a future
  // feature with its own button).
  function pickSavedEmail(email: string) {
    setEmailInput(email);
    setPasswordInput('');
    setMode('signIn');
    setStep('email-password');
    setError('');
    // Defer focusing the password input so the browser's autofill has
    // a chance to populate it on the email field first.
    setTimeout(() => {
      const pw = document.getElementById('auth-password') as HTMLInputElement | null;
      pw?.focus();
    }, 50);
  }

  function handleForgetEmail(e: React.MouseEvent, email: string) {
    e.stopPropagation();
    forgetEmail(email);
    setSaved(listSavedEmails());
  }

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('flow', mode);
    const submittedEmail = String(formData.get('email') ?? '').trim();

    try {
      await signIn('password', formData);
      // Persist the email locally only on explicit opt-in. Saved on
      // success so a wrong-password attempt doesn't pollute the list.
      if (rememberMe && submittedEmail) {
        rememberEmail(submittedEmail);
      }
      // signIn resolves once the session is established; navigate
      // immediately so the user lands on their account instead of
      // staring at the form. The effect above covers race cases where
      // useConvexAuth flips after the navigate.
      navigate(target, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('InvalidAccountId') || msg.includes('InvalidSecret')) {
          setError(mode === 'signIn' ? 'Invalid email or password.' : 'Account already exists.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const isSignUp = mode === 'signUp';

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
          onClick={() => navigate('/apply')}
        >
          Become a creator
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
          title="Welcome"
          subtitle="Sign in or create an account — we figure out the rest."
          error={error || undefined}
          footer={
            <AuthFooterLink
              text="Privacy"
              linkText="Terms of Use"
              onClick={() => navigate('/terms')}
            />
          }
        >
          <Stack gap={4}>
            {DEV_DEMO_UNLOCK ? (
              <Stack gap={2}>
                <Muted>
                  Dev: visiting <strong>/dashboard</strong> while signed out sends you here with{' '}
                  <strong>?next=/dashboard</strong>. Use demo credentials below on the email step.
                </Muted>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fillDemoCredentials(true)}
                >
                  Continue with demo account
                </Button>
              </Stack>
            ) : null}

            {saved.length > 0 && (
              <AuthSavedGroup label="Continue as">
                <Stack gap={2}>
                  {saved.map((entry) => (
                    <AuthMethodButton
                      key={entry.email}
                      icon={<Icon name="user" size={18} />}
                      label={entry.email}
                      description="Saved on this device · sign in"
                      arrow
                      onClick={() => pickSavedEmail(entry.email)}
                      onAuxClick={(ev) => handleForgetEmail(ev, entry.email)}
                      onContextMenu={(ev) => {
                        ev.preventDefault();
                        handleForgetEmail(ev, entry.email);
                      }}
                      title="Right-click or middle-click to forget this email"
                    />
                  ))}
                </Stack>
              </AuthSavedGroup>
            )}

            <AuthMethodButton
              icon={<Icon name="discord" size={18} />}
              label="Continue with Discord"
              description="Sign in with your Discord account"
              onClick={() => void signIn('discord')}
            />

            <AuthMethodButton
              icon={<Icon name="email" size={18} />}
              label="Continue with email"
              description="Sign in with your email and password"
              onClick={() => {
                setMode('signIn');
                setStep('email-password');
              }}
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
              ? "Join thousands of subscribers following the network's top creators."
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
              }}
            />
          }
        >
          <form onSubmit={handlePasswordSubmit}>
            <Stack gap={4}>
              {DEV_DEMO_UNLOCK ? (
                <Stack gap={2}>
                  <Muted>
                    Dev shortcut — email <strong>{DEV_DEMO_EMAIL}</strong>, password{' '}
                    <strong>{DEV_DEMO_PASSWORD}</strong>. Sign up once, then sign in later.
                  </Muted>
                  <Row gap={2}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fillDemoCredentials(true)}
                    >
                      Fill demo · Sign up
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fillDemoCredentials(false)}
                    >
                      Fill demo · Sign in
                    </Button>
                  </Row>
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

              <Row gap={2}>
                <Checkbox
                  id="auth-remember"
                  checked={rememberMe}
                  onChange={setRememberMe}
                  label={
                    <>
                      Remember my email for 30 days
                      <br />
                      <Muted>Skips the typing next time on this device.</Muted>
                    </>
                  }
                />
              </Row>

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
