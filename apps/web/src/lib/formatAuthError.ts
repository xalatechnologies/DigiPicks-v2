import { ConvexError } from 'convex/values';

export function formatAuthError(err: unknown, flow: 'signIn' | 'signUp'): string {
  if (err instanceof ConvexError) {
    const data = err.data as { message?: string } | undefined;
    if (typeof data?.message === 'string' && data.message.length > 0) {
      return data.message;
    }
    if (
      typeof err.message === 'string' &&
      err.message.length > 0 &&
      err.message !== 'ConvexError'
    ) {
      return err.message;
    }
  }
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes('InvalidAccountId') || msg.includes('InvalidSecret')) {
      return flow === 'signIn' ? 'Invalid email or password.' : 'Account already exists.';
    }
    if (msg.includes('already exists')) {
      return 'An account with this email already exists. Sign in instead, then submit your application.';
    }
    if (msg.includes('Invalid credentials')) {
      return 'Invalid email or password.';
    }
    if (msg.includes('Invalid password')) {
      return flow === 'signUp'
        ? 'Password must be at least 8 characters.'
        : 'Invalid email or password.';
    }
    if (msg.includes('Missing `password`')) {
      return 'Please enter your password.';
    }
    if (msg.includes('Missing `flow`')) {
      return 'Sign-in could not complete. Please try again.';
    }
    if (import.meta.env.DEV) {
      return msg;
    }
  }
  return 'Something went wrong. Please try again.';
}
