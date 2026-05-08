import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
import { internalMutation } from './_generated/server';

// =============================================================================
// Cron Jobs
// =============================================================================

const crons = cronJobs();

// ─── Auto-grade picks after event completion ────────────────────────────────
// Checks for events that should be completed and marks them.

crons.interval(
  'check completed events',
  { hours: 1 },
  internal.crons.checkCompletedEvents,
  {},
);

// ─── Clean up expired listings ──────────────────────────────────────────────
// Archives listings past their expiration date.

crons.interval(
  'archive expired listings',
  { hours: 6 },
  internal.crons.archiveExpiredListings,
  {},
);

export default crons;

// ─── Cron Handlers ──────────────────────────────────────────────────────────

/**
 * Mark events as completed when they're past their start time + 4 hours.
 * Date.now() is fine in mutations (W5 only applies to queries).
 */
export const checkCompletedEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 4 * 60 * 60 * 1000;
    const events = await ctx.db
      .query('events')
      .withIndex('by_status_and_startsAt', (q) => q.eq('status', 'upcoming'))
      .take(100);

    let updated = 0;
    for (const event of events) {
      if (event.startsAt < cutoff) {
        await ctx.db.patch(event._id, { status: 'completed' });
        updated++;
      }
    }
  },
});

/**
 * Archive listings past their expiration date.
 */
export const archiveExpiredListings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const listings = await ctx.db
      .query('listings')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .take(100);

    let archived = 0;
    for (const listing of listings) {
      if (listing.expiresAt && listing.expiresAt < now) {
        await ctx.db.patch(listing._id, { status: 'archived', updatedAt: now });
        archived++;
      }
    }
  },
});
