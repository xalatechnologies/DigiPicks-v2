import { v } from 'convex/values';
import { internalMutation, internalQuery, type ActionCtx } from '../_generated/server';
import { internal } from '../_generated/api';

// =============================================================================
// External-provider circuit breaker.
//
// Pattern: a poll calls `circuitIsOpen` at the top of its run. If the
// circuit is open AND within the TTL window, the poll quiet-no-ops. After
// the TTL elapses we let one probe through (`half_open`); if that probe
// fails, the poll calls `circuitOpen` again, otherwise it calls
// `circuitClose`.
//
// Why this exists: a single bad/expired API key can otherwise generate
// hundreds of warnings per hour and burn provider quota on guaranteed-
// fail requests.
// =============================================================================

/** TTL after which an open circuit transitions to `half_open`. */
export const DEFAULT_CIRCUIT_TTL_MS = 30 * 60 * 1000; // 30 min

export interface CircuitGate {
  /** When true, callers should skip the run entirely. */
  shouldSkip: boolean;
  /** When true, callers should attempt a single probe. */
  isProbe: boolean;
  /** Reason text from the last open. */
  reason?: string;
}

export const _readCircuit = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('systemCircuit')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();
  },
});

export const _openCircuit = internalMutation({
  args: { key: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('systemCircuit')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        openedAt: now,
        status: 'open',
        reason: args.reason,
      });
    } else {
      await ctx.db.insert('systemCircuit', {
        key: args.key,
        openedAt: now,
        status: 'open',
        reason: args.reason,
      });
    }
  },
});

export const _markHalfOpen = internalMutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('systemCircuit')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();
    if (existing && existing.status === 'open') {
      await ctx.db.patch(existing._id, { status: 'half_open' });
    }
  },
});

export const _closeCircuit = internalMutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('systemCircuit')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/**
 * Check the circuit state at the top of a poll. Transitions an expired
 * `open` row to `half_open` so the next call is treated as a probe.
 */
export async function checkCircuit(
  ctx: ActionCtx,
  key: string,
  ttlMs: number = DEFAULT_CIRCUIT_TTL_MS,
): Promise<CircuitGate> {
  const row = await ctx.runQuery(internal.shared.circuit._readCircuit, { key });
  if (!row) return { shouldSkip: false, isProbe: false };

  const age = Date.now() - row.openedAt;
  if (row.status === 'open' && age < ttlMs) {
    return { shouldSkip: true, isProbe: false, reason: row.reason };
  }
  if (row.status === 'open' && age >= ttlMs) {
    await ctx.runMutation(internal.shared.circuit._markHalfOpen, { key });
    return { shouldSkip: false, isProbe: true, reason: row.reason };
  }
  // half_open: also a probe (the previous tick already flipped it).
  return { shouldSkip: false, isProbe: true, reason: row.reason };
}

/** Open or refresh the circuit. Idempotent. */
export async function openCircuit(ctx: ActionCtx, key: string, reason: string): Promise<void> {
  await ctx.runMutation(internal.shared.circuit._openCircuit, { key, reason });
}

/** Close the circuit (provider is healthy again). */
export async function closeCircuit(ctx: ActionCtx, key: string): Promise<void> {
  await ctx.runMutation(internal.shared.circuit._closeCircuit, { key });
}

/** Treat HTTP statuses 401 / 403 as auth/quota faults that should open the breaker. */
export function isUnrecoverableAuthStatus(status: number): boolean {
  return status === 401 || status === 403;
}
