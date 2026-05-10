// =============================================================================
// Discord-aware retry helper. Same shape as `shared/retry.ts` but additionally
// honors Discord's `Retry-After` header on 429 responses (rate limits) so we
// back off in lockstep with what Discord actually wants instead of guessing.
//
// NOT a registered Convex function — a pure helper used by inbound import
// and outbound fanout actions. Errors are re-thrown when retries are
// exhausted; callers that want fire-and-forget semantics catch+log.
// =============================================================================

export class DiscordRateLimitError extends Error {
  constructor(public readonly retryAfterMs: number) {
    super(`Discord rate-limited; retry after ${retryAfterMs}ms`);
    this.name = 'DiscordRateLimitError';
  }
}

export interface DiscordRetryOptions {
  /** Total attempts including the first call. Default 3. */
  maxAttempts?: number;
  /** Base delay (ms) used for non-429 backoff. Default 250. */
  baseDelayMs?: number;
  /** Cap applied to *both* exponential and 429-derived delays. Default 30s. */
  maxDelayMs?: number;
  /** Tag for log lines. */
  label?: string;
}

/** Sleep helper that resolves on the next macrotask after `ms`. */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Run an async function with Discord-aware retry.
 *
 * - On `DiscordRateLimitError`: sleep `retryAfterMs` (capped), retry.
 * - On other errors: exponential backoff with full jitter, retry.
 * - Stops + re-throws after `maxAttempts`.
 */
export async function withDiscordRetry<T>(
  fn: () => Promise<T>,
  opts: DiscordRetryOptions = {},
): Promise<T> {
  const max = opts.maxAttempts ?? 3;
  const base = opts.baseDelayMs ?? 250;
  const cap = opts.maxDelayMs ?? 30_000;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === max) break;

      let delay: number;
      if (err instanceof DiscordRateLimitError) {
        delay = Math.min(cap, Math.max(0, err.retryAfterMs));
      } else {
        delay = Math.min(cap, base * 2 ** (attempt - 1)) + Math.random() * base;
      }
      if (opts.label) {
        console.warn(
          `[discord retry] ${opts.label} attempt ${attempt}/${max} failed; retrying in ${Math.round(delay)}ms:`,
          err instanceof Error ? err.message : err,
        );
      }
      await sleep(delay);
    }
  }
  throw lastErr;
}

/**
 * Inspect a `fetch` Response from Discord and throw a typed error on
 * rate-limit (429) so `withDiscordRetry` can react. Other non-OK statuses
 * throw a plain Error so the default backoff path is taken.
 */
export async function ensureDiscordOk(res: Response, label: string): Promise<Response> {
  if (res.ok) return res;

  if (res.status === 429) {
    // Discord uses both seconds (header) and milliseconds (JSON) — read the
    // header first, fall back to JSON, then a sane default.
    const retryAfterHeader = res.headers.get('retry-after');
    let retryAfterMs = 1000;
    if (retryAfterHeader) {
      const seconds = Number(retryAfterHeader);
      if (Number.isFinite(seconds) && seconds > 0) retryAfterMs = seconds * 1000;
    } else {
      try {
        const body = (await res.clone().json()) as { retry_after?: number };
        if (typeof body.retry_after === 'number' && body.retry_after > 0) {
          retryAfterMs = body.retry_after * 1000;
        }
      } catch {
        // ignore parse failures
      }
    }
    throw new DiscordRateLimitError(retryAfterMs);
  }

  // Surface 5xx + 4xx alike — the default retry heuristic only retries 5xx/429.
  const text = await res.text().catch(() => '');
  throw new Error(
    `Discord ${label} ${res.status} ${res.statusText}${text ? `: ${text.slice(0, 200)}` : ''}`,
  );
}
