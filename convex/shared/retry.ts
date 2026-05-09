// =============================================================================
// Retry helper — exponential backoff with jitter for external-provider calls.
// Used by Stripe, Odds API, and AI actions. Convex actions can `setTimeout`,
// so this is safe to use from any internalAction or action.
// =============================================================================

export interface RetryOptions {
  /** Total attempts including the first call. Default 3. */
  maxAttempts?: number;
  /** Base delay in ms; actual delay = base * 2^(attempt-1) + jitter. Default 250. */
  baseDelayMs?: number;
  /** Cap on the computed delay. Default 5000. */
  maxDelayMs?: number;
  /** Override retryability decision. Defaults to a network/5xx/429 heuristic. */
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  /** Tag for log lines. */
  label?: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const max = opts.maxAttempts ?? 3;
  const base = opts.baseDelayMs ?? 250;
  const cap = opts.maxDelayMs ?? 5000;
  const shouldRetry = opts.shouldRetry ?? defaultShouldRetry;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === max || !shouldRetry(err, attempt)) break;
      const delay = Math.min(cap, base * 2 ** (attempt - 1)) + Math.random() * base;
      if (opts.label) {
        console.warn(
          `[retry] ${opts.label} attempt ${attempt}/${max} failed; retrying in ${Math.round(delay)}ms:`,
          err instanceof Error ? err.message : err,
        );
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

function defaultShouldRetry(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  if (/timeout|fetch failed|network|econnreset|etimedout|enotfound|socket/.test(msg)) {
    return true;
  }
  // HTTP status hints surfaced through error messages.
  if (/\b(429|500|502|503|504)\b/.test(msg)) return true;
  return false;
}
