import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { withRetry } from './shared/retry';

// =============================================================================
// Odds API — Upcoming events importer.
//
// Polls the cheap /v4/sports/{key}/events endpoint (no odds payload, costs
// 1 quota credit per call) for a wide set of leagues and upserts each game
// into the events table via internal.liveScores.upsertEvent.
//
// After each upsert we fire-and-forget internal.teamLogos.resolveOne for
// the home + away teams so badge URLs get backfilled asynchronously.
//
// Cron schedule: hourly. The upcoming list changes slowly.
// =============================================================================

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

/**
 * Wide map from our schema sport names to The Odds API sport keys.
 * Add / remove keys here to expand coverage.
 */
const SPORT_KEY_MAP: Record<string, string[]> = {
  Soccer: [
    'soccer_epl',
    'soccer_spain_la_liga',
    'soccer_germany_bundesliga',
    'soccer_italy_serie_a',
    'soccer_france_ligue_one',
    'soccer_uefa_champs_league',
    'soccer_uefa_europa_league',
    'soccer_usa_mls',
  ],
  Football: ['americanfootball_nfl'],
  Basketball: ['basketball_nba', 'basketball_euroleague'],
  Baseball: ['baseball_mlb'],
  Hockey: ['icehockey_nhl'],
  Cricket: ['cricket_ipl', 'cricket_international_t20'],
  Tennis: ['tennis_atp_australian_open', 'tennis_wta_australian_open'],
  MMA: ['mma_mixed_martial_arts'],
  Rugby: ['rugbyleague_nrl'],
};

interface OddsApiUpcomingEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
}

/**
 * Reverse-map an API sport key back to our schema sport name.
 * Falls back to 'Other' so we never silently drop an event.
 */
function sportKeyToName(key: string): string {
  for (const [name, keys] of Object.entries(SPORT_KEY_MAP)) {
    if (keys.includes(key)) return name;
  }
  return 'Other';
}

/**
 * Poll The Odds API /events endpoint for every configured sport key
 * and upsert each upcoming game.
 *
 * Quota note: the /events endpoint costs 1 credit per call (vs /odds which
 * costs N markets × M regions). With ~20 sport keys this is ~20 credits/hour
 * = ~480/day, well within the free tier of 500/month if you tighten the cron.
 *
 * Each fetch is wrapped in try/catch so one bad sport key cannot break the
 * rest. Errors are logged, never re-thrown.
 */
export const pollUpcoming = internalAction({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.THE_ODDS_API_KEY;
    if (!apiKey) {
      console.log('THE_ODDS_API_KEY not set — skipping upcoming events poll');
      return;
    }

    const sportKeys = Object.values(SPORT_KEY_MAP).flat();
    let totalEvents = 0;
    let totalSports = 0;

    for (const sportKey of sportKeys) {
      try {
        const url = `${ODDS_API_BASE}/sports/${sportKey}/events?apiKey=${apiKey}`;
        const res = await withRetry(() => fetch(url), {
          label: `oddsApi events:${sportKey}`,
          maxAttempts: 3,
        });

        if (!res.ok) {
          console.warn(
            `Odds API /events error for ${sportKey}: ${res.status} ${res.statusText}`,
          );
          continue;
        }

        const events = (await res.json()) as OddsApiUpcomingEvent[];
        if (!Array.isArray(events)) {
          console.warn(`Odds API /events returned non-array for ${sportKey}`);
          continue;
        }

        const sportName = sportKeyToName(sportKey);
        totalSports++;

        for (const event of events) {
          // Defensive: skip malformed entries.
          if (!event?.id || !event.home_team || !event.away_team) continue;

          try {
            await ctx.runMutation(internal.liveScores.upsertEvent, {
              externalId: event.id,
              sport: sportName,
              league: event.sport_title,
              homeTeam: event.home_team,
              awayTeam: event.away_team,
              commenceTime: event.commence_time,
              homeScore: 0,
              awayScore: 0,
              gameStatus: 'Upcoming',
              completed: false,
            });
            totalEvents++;

            // Fire-and-forget logo resolution for both teams.
            // Scheduled at 0ms so it runs asynchronously after this action.
            await ctx.scheduler.runAfter(0, internal.teamLogos.resolveOne, {
              sport: sportName,
              name: event.home_team,
            });
            await ctx.scheduler.runAfter(0, internal.teamLogos.resolveOne, {
              sport: sportName,
              name: event.away_team,
            });
          } catch (err) {
            console.error(
              `Failed to upsert event ${event.id} for ${sportKey}:`,
              err,
            );
          }
        }
      } catch (err) {
        console.error(`Failed to poll upcoming for ${sportKey}:`, err);
      }
    }

    console.log(
      `pollUpcoming: imported ${totalEvents} events across ${totalSports} sports`,
    );
  },
});

// ─── Odds snapshots poll (Phase 6) ─────────────────────────────────────────
//
// Hits the /v4/sports/{key}/odds endpoint per sport, capturing one snapshot
// row per (event × bookmaker × market × outcome) into oddsSnapshots.
//
// Gated by env var ODDS_SNAPSHOTS_ENABLED — leave unset to keep API usage
// low. The /odds endpoint costs 1 credit per market per region (h2h+spreads
// +totals × US = 3 credits per call) so per hour with 20 sports = ~60 credits.

interface OddsApiOddsBookmaker {
  key: string;
  title: string;
  markets: Array<{
    key: string;
    outcomes: Array<{ name: string; price: number; point?: number }>;
  }>;
}

interface OddsApiOddsEvent extends OddsApiUpcomingEvent {
  bookmakers?: OddsApiOddsBookmaker[];
}

const SNAPSHOT_REGIONS = 'us,uk,eu';
const SNAPSHOT_MARKETS = 'h2h,spreads,totals';

export const pollOddsSnapshots = internalAction({
  args: {},
  handler: async (ctx) => {
    if (process.env.ODDS_SNAPSHOTS_ENABLED !== 'true') {
      console.log('pollOddsSnapshots disabled — set ODDS_SNAPSHOTS_ENABLED=true to enable.');
      return;
    }

    const apiKey = process.env.THE_ODDS_API_KEY;
    if (!apiKey) {
      console.log('THE_ODDS_API_KEY not set — skipping odds snapshot poll');
      return;
    }

    const sportKeys = Object.values(SPORT_KEY_MAP).flat();
    let totalSnapshots = 0;
    let totalEventsTouched = 0;

    for (const sportKey of sportKeys) {
      try {
        const url =
          `${ODDS_API_BASE}/sports/${sportKey}/odds` +
          `?regions=${SNAPSHOT_REGIONS}&markets=${SNAPSHOT_MARKETS}&oddsFormat=decimal&apiKey=${apiKey}`;
        const res = await withRetry(() => fetch(url), {
          label: `oddsApi odds:${sportKey}`,
          maxAttempts: 3,
        });
        if (!res.ok) {
          console.warn(
            `Odds API /odds error for ${sportKey}: ${res.status} ${res.statusText}`,
          );
          continue;
        }

        const events = (await res.json()) as OddsApiOddsEvent[];
        if (!Array.isArray(events)) continue;

        for (const ev of events) {
          if (!ev.id || !ev.bookmakers || ev.bookmakers.length === 0) continue;

          const eventId: Id<'events'> | null = await ctx.runMutation(
            internal.odds._findEventByExternalId,
            { externalId: ev.id },
          );
          if (!eventId) continue;

          const snapshots: Array<{
            market: string;
            book: string;
            bookTitle: string;
            side: string;
            price: number;
            point?: number;
          }> = [];

          for (const book of ev.bookmakers) {
            for (const market of book.markets) {
              for (const outcome of market.outcomes) {
                snapshots.push({
                  market: market.key,
                  book: book.key,
                  bookTitle: book.title,
                  side: outcome.name,
                  price: outcome.price,
                  point: outcome.point,
                });
              }
            }
          }

          if (snapshots.length === 0) continue;

          const written = await ctx.runMutation(
            internal.odds._writeSnapshots,
            {
              eventId,
              externalEventId: ev.id,
              snapshots,
            },
          );
          totalSnapshots += written;
          totalEventsTouched++;
        }
      } catch (err) {
        console.error(`Failed pollOddsSnapshots for ${sportKey}:`, err);
      }
    }

    console.log(
      `pollOddsSnapshots: wrote ${totalSnapshots} rows across ${totalEventsTouched} events`,
    );
  },
});
