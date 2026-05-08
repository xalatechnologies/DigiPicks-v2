import React, { useState, FormEvent } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import {
  AuthLayout,
  AuthCard,
  AuthFooterLink,
  Field,
  Input,
  PasswordInput,
  Button,
  Logo,
} from '@digipicks/ds';

type AuthMode = 'signIn' | 'signUp';

export function Auth() {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('flow', mode);

    try {
      await signIn('password', formData);
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
    <AuthLayout logo={<Logo size={44} showWord />}>
      <AuthCard
        title={isSignUp ? 'Create your account' : 'Welcome back'}
        subtitle={
          isSignUp
            ? 'Join the premium sports picks network.'
            : 'Sign in to access your picks and subscriptions.'
        }
        error={error || undefined}
        footer={
          <AuthFooterLink
            text={isSignUp ? 'Already have an account?' : "Don't have an account?"}
            linkText={isSignUp ? 'Sign in' : 'Sign up'}
            onClick={() => {
              setMode(isSignUp ? 'signIn' : 'signUp');
              setError('');
            }}
          />
        }
      >
        <form onSubmit={handleSubmit}>
          <Field label="Email" htmlFor="auth-email" required>
            <Input
              id="auth-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </Field>

          <Field label="Password" htmlFor="auth-password" required>
            <PasswordInput
              id="auth-password"
              name="password"
              placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
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
          >
            {loading
              ? isSignUp
                ? 'Creating account...'
                : 'Signing in...'
              : isSignUp
                ? 'Create account'
                : 'Sign in'}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
