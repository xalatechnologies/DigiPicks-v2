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
    let msg = err.message;
    if (msg.includes('[CONVEX')) {
      if (msg.includes('Unauthorized')) {
        return flow === 'signIn'
          ? 'Your session is not ready yet. Wait a few seconds and try again.'
          : 'You must be signed in to continue.';
      }
      if (msg.includes('InvalidAccountId') || msg.includes('InvalidSecret')) {
        return flow === 'signIn' ? 'Invalid email or password.' : 'Account already exists.';
      }
      return import.meta.env.DEV
        ? 'Something went wrong on the server. Check the terminal running `npx convex dev` and try again.'
        : 'Something went wrong. Please try again.';
    }
    if (msg.includes('InvalidAccountId') || msg.includes('InvalidSecret')) {
      return flow === 'signIn' ? 'Invalid email or password.' : 'Account already exists.';
    }
    if (msg.includes('already exists')) {
      return 'An account with this email already exists. Sign in instead, then submit your application.';
    }
    if (msg.includes('Unauthorized') && flow === 'signIn') {
      return 'Session is not ready yet. Wait a moment and try again, or refresh the page and sign in once more.';
    }
    if (msg.includes('No auth user on this request')) {
      return 'Your browser has a stale sign-in token. Use “Clear session & sign in” (or sign out from the header), then sign in again at /auth?next=/admin.';
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
    if (msg.includes('JWT_PRIVATE_KEY') || msg.includes('JWKS')) {
      return import.meta.env.DEV
        ? 'Convex Auth is not configured on this deployment. From the repo root run `pnpm setup:convex-auth`, restart `npx convex dev`, then try again. (JWT keys live on Convex — not in .env.local; keep VITE_CONVEX_URL aligned with CONVEX_URL.)'
        : 'Sign-in is not configured on the server. Contact the platform operator.';
    }
    if (msg.includes('Connection lost') || msg.includes('in flight') || msg.includes('WebSocket')) {
      return import.meta.env.DEV
        ? 'Connection to Convex was interrupted while signing in. Wait a few seconds and try again. If it keeps failing, confirm VITE_CONVEX_URL in apps/web/.env.local matches your deployment (quirky-goldfinch-990), restart the Vite dev server, and run `npx convex login` if `convex dev` reports no project access.'
        : 'Connection interrupted. Please try again.';
    }
    if (import.meta.env.DEV) {
      return msg;
    }
  }
  return 'Something went wrong. Please try again.';
}
