import { v } from 'convex/values';
import { internalMutation } from './_generated/server';

// =============================================================================
// Stripe webhook idempotency (BPMN-003 §preconditions, NFR-006).
//
// Stripe re-delivers webhook events on any non-2xx response or transient
// network error. Without idempotency on our side, a single subscription
// state change could double-apply and (e.g.) fan out two welcome
// notifications. The `stripeEvents` table records every event id we
// processed; subsequent deliveries with the same id short-circuit.
//
// `claim` returns true when this is the first time we're processing the
// event, false if it's already been processed. The caller skips dispatch
// when claim returns false.
// =============================================================================

export const claim = internalMutation({
  args: {
    eventId: v.string(),
    type: v.string(),
    payloadHash: v.string(),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const existing = await ctx.db
      .query('stripeEvents')
      .withIndex('by_eventId', (q) => q.eq('eventId', args.eventId))
      .first();
    if (existing) return false;

    await ctx.db.insert('stripeEvents', {
      eventId: args.eventId,
      type: args.type,
      payloadHash: args.payloadHash,
      processedAt: Date.now(),
    });
    return true;
  },
});

/**
 * Mark the outcome of an event after dispatch — purely for forensics on
 * drift between Stripe state and our subscriptions table. Optional.
 */
export const recordOutcome = internalMutation({
  args: {
    eventId: v.string(),
    outcome: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('stripeEvents')
      .withIndex('by_eventId', (q) => q.eq('eventId', args.eventId))
      .first();
    if (!row) return null;
    await ctx.db.patch(row._id, { outcome: args.outcome });
    return row._id;
  },
});
