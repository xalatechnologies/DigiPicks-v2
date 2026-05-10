import { RateLimiter, MINUTE, HOUR } from '@convex-dev/rate-limiter';
import { components } from '../_generated/api';

// =============================================================================
// Centralized rate limiter (NFR-003 §security, FM-011 §abuse-resistance).
//
// One RateLimiter instance per process keeps named buckets and configuration
// in one spot. Use `rateLimiter.limit(ctx, name, { key, throws: true })` from
// any query/mutation/action that needs throttling.
//
// Bucket choice cheat-sheet:
//   - token bucket: bursty allowances (UX-friendly retries)
//   - fixed window: strict per-minute caps (abuse vectors)
//
// Re-key sensitively: by userId for authed paths, by ipFromHeader for public.
// Public, unauthenticated queries should rely on Convex's built-in protections
// — we mainly throttle write paths and expensive reads.
// =============================================================================

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // ── Application submission (FM-002): 3/min, capacity 5 — manual review
  //    queue should never be flooded by a single client.
  applicationsSubmit: {
    kind: 'token bucket',
    rate: 3,
    period: MINUTE,
    capacity: 5,
  },

  // ── Community channel posting (FM-006): 30/min per user — anti-spam.
  // NFR-005 readiness — sharded for hot-channel events (live streams /
  // marquee creators) so the bucket can sustain 10k+ rps cumulatively.
  channelsPost: {
    kind: 'token bucket',
    rate: 30,
    period: MINUTE,
    capacity: 30,
    shards: 8,
  },

  // ── Stripe checkout creation (FM-009): 5 per 10min per user — Stripe
  //    itself dedupes via Idempotency-Key, this is just an anti-abuse cap.
  //    Same bucket reused by ai.suggestPick — capped Anthropic spend.
  stripeCheckout: {
    kind: 'token bucket',
    rate: 5,
    period: 10 * MINUTE,
    capacity: 5,
    shards: 4,
  },

  // ── AI Copilot turns (M24): per-user copilot turns; multiplies via
  //    tool fan-out so the cap is per-turn not per-tool. 20 turns refilled
  //    per hour with a small burst capacity for back-to-back follow-ups.
  //    Sharded so a marquee user doesn't hot-spot the bucket.
  aiCopilot: {
    kind: 'token bucket',
    rate: 20,
    period: HOUR,
    capacity: 6,
    shards: 4,
  },

  // ── GDPR export (NFR-003): 3/hour per user — full-table scans are heavy.
  // Sharded so the global bucket doesn't bottleneck during compliance
  // audits when many users export simultaneously.
  gdprExport: {
    kind: 'fixed window',
    rate: 3,
    period: HOUR,
    shards: 4,
  },
});
