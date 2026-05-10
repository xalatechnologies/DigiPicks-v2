'use node';

import * as Sentry from '@sentry/node';

// =============================================================================
// Sentry capture for Convex Node actions (Phase 15c).
//
// Convex's V8 runtime can't run @sentry/node — only Node actions can. This
// helper bootstraps Sentry once per worker and wraps action handlers with
// `withSentry` so any thrown error is captured AND re-thrown so existing
// retry / scheduler behavior is preserved.
//
// Required env vars:
//   - SENTRY_DSN_NODE   server-side DSN. Quiet no-op when unset.
//   - SENTRY_ENVIRONMENT  optional override
//   - VITE_RELEASE / SENTRY_RELEASE  optional release tag
// =============================================================================

let initialized = false;

function ensureInit(): boolean {
  if (initialized) return true;
  const dsn = process.env.SENTRY_DSN_NODE;
  if (!dsn) return false;
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'production',
    release: process.env.SENTRY_RELEASE ?? process.env.VITE_RELEASE,
    tracesSampleRate: 0.05,
    // Convex actions are short-lived workers — capture every error.
    sampleRate: 1.0,
  });
  initialized = true;
  return true;
}

/**
 * Wrap an async Node action handler. Capture-and-rethrow on uncaught
 * exceptions; tags the event with `convex.action` + the supplied label.
 */
export async function withSentry<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const ready = ensureInit();
  if (!ready) {
    return await fn();
  }
  try {
    return await fn();
  } catch (err) {
    Sentry.withScope((scope) => {
      scope.setTag('source', 'convex.action');
      scope.setTag('action', label);
      Sentry.captureException(err);
    });
    await Sentry.flush(2000).catch(() => {});
    throw err;
  }
}
