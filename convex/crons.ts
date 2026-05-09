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
// ─── Poll live scores from The Odds API ─────────────────────────────────
// Runs every 60 seconds. Gracefully no-ops when THE_ODDS_API_KEY is not set.

crons.interval(
  'poll-live-scores',
  { seconds: 60 },
  internal.liveScores.pollActive,
);

// ─── Poll upcoming events from The Odds API ─────────────────────────────
// Runs hourly. The /events endpoint is cheap (1 quota credit per call),
// and the upcoming list changes slowly. Gracefully no-ops when
// THE_ODDS_API_KEY is not set.

crons.interval(
  'poll-upcoming-events',
  { hours: 1 },
  internal.oddsApi.pollUpcoming,
);

// ─── Poll bookmaker odds snapshots ──────────────────────────────────────
// Runs daily and only writes rows when ODDS_SNAPSHOTS_ENABLED=true. The
// /odds endpoint is more expensive than /events (h2h+spreads+totals × 3
// regions = ~9 credits per sport per call), so we keep this opt-in and
// run at most once per day to stay inside reasonable quota.

crons.interval(
  'poll-odds-snapshots',
  { hours: 24 },
  internal.oddsApi.pollOddsSnapshots,
);

// ─── Poll Twitch / YouTube / Kick for creator stream live state ─────────
// Runs every 5 minutes (Phase 10). Per-platform credentials are optional —
// missing env keys quietly skip that platform without breaking the rest.

crons.interval(
  'poll-creator-streams',
  { minutes: 5 },
  internal.streams.pollStreams,
);

// ─── Poll sport-specific sources (ESPNcricinfo etc.) ────────────────────
// Runs daily; each source checks its own enable flag. Cricket is gated by
// SPORT_SOURCE_CRICKET_ENABLED so we never pull a fragile scraper in
// production unintentionally.

crons.interval(
  'poll-sport-sources',
  { hours: 24 },
  internal.sources.espncricinfo.pollCricketFixtures,
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
