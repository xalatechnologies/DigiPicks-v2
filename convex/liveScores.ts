import { internalAction, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

// =============================================================================
// Live Scores — Polls The Odds API and updates events with live game data
// =============================================================================

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

/** Sport keys mapped from our schema sport names to The Odds API sport keys. */
const SPORT_KEY_MAP: Record<string, string[]> = {
  Soccer: ['soccer_epl', 'soccer_spain_la_liga', 'soccer_uefa_champs_league'],
  Cricket: ['cricket_ipl', 'cricket_international_t20'],
  Tennis: ['tennis_atp_italian_open', 'tennis_wta_italian_open'],
};

/**
 * Poll The Odds API for live scores on all active events.
 * Called by the cron job every 60 seconds.
 */
export const pollActive = internalAction({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.THE_ODDS_API_KEY;
    if (!apiKey) {
      console.log('THE_ODDS_API_KEY not set — skipping live score poll');
      return;
    }

    // Get all sport keys to poll (flatten arrays)
    const sportKeys = Object.values(SPORT_KEY_MAP).flat();

    for (const sportKey of sportKeys) {
      try {
        const url = `${ODDS_API_BASE}/sports/${sportKey}/scores/?apiKey=${apiKey}&daysFrom=3`;
        const res = await fetch(url);

        if (!res.ok) {
          console.warn(`Odds API error for ${sportKey}: ${res.status}`);
          continue;
        }

        const games: OddsApiScore[] = await res.json();
        const sportName = sportKeyToName(sportKey);

        for (const game of games) {
          if (!game.completed && game.scores) {
            // Game is live
            await ctx.runMutation(internal.liveScores.upsertEvent, {
              externalId: game.id,
              sport: sportName,
              league: game.sport_title,
              homeTeam: game.home_team,
              awayTeam: game.away_team,
              commenceTime: game.commence_time,
              homeScore: parseScore(game.scores, game.home_team),
              awayScore: parseScore(game.scores, game.away_team),
              gameStatus: 'Live',
              completed: false,
            });
          } else if (game.completed && game.scores) {
            // Game finished
            await ctx.runMutation(internal.liveScores.upsertEvent, {
              externalId: game.id,
              sport: sportName,
              league: game.sport_title,
              homeTeam: game.home_team,
              awayTeam: game.away_team,
              commenceTime: game.commence_time,
              homeScore: parseScore(game.scores, game.home_team),
              awayScore: parseScore(game.scores, game.away_team),
              gameStatus: 'Final',
              completed: true,
            });
          } else {
            // Upcoming — no scores yet
            await ctx.runMutation(internal.liveScores.upsertEvent, {
              externalId: game.id,
              sport: sportName,
              league: game.sport_title,
              homeTeam: game.home_team,
              awayTeam: game.away_team,
              commenceTime: game.commence_time,
              homeScore: 0,
              awayScore: 0,
              gameStatus: 'Upcoming',
              completed: false,
            });
          }
        }
      } catch (err) {
        console.error(`Failed to poll ${sportKey}:`, err);
      }
    }
  },
});

/** Upsert an event — create if not found, update if exists. */
export const upsertEvent = internalMutation({
  args: {
    externalId: v.string(),
    sport: v.string(),
    league: v.string(),
    homeTeam: v.string(),
    awayTeam: v.string(),
    commenceTime: v.string(),
    homeScore: v.number(),
    awayScore: v.number(),
    gameStatus: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Try to find by externalId first
    let event = await ctx.db
      .query('events')
      .withIndex('by_external_id', (q) => q.eq('externalId', args.externalId))
      .first();

    // Fallback: match by team names
    if (!event) {
      const allEvents = await ctx.db.query('events').collect();
      event = allEvents.find(
        (e) =>
          (e.home === args.homeTeam && e.away === args.awayTeam) ||
          (e.home === args.awayTeam && e.away === args.homeTeam),
      ) ?? null;
    }

    const startsAt = new Date(args.commenceTime).getTime();
    const status = args.completed ? 'completed' as const : (args.gameStatus === 'Live' ? 'live' as const : 'upcoming' as const);
    const time = new Date(args.commenceTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
    }) + ' ET';

    if (event) {
      // Update existing — also self-heal federated fields if missing on
      // pre-migration rows. The 60s polling cron acts as a continuous
      // backfill so any row touched by the provider becomes federated.
      const heal: Record<string, unknown> = {};
      if (event.sourceType === undefined) heal.sourceType = 'provider';
      if (event.providerName === undefined) heal.providerName = 'the-odds-api';
      if (event.verificationStatus === undefined) heal.verificationStatus = 'source_verified';
      if (event.visibility === undefined) heal.visibility = 'public';
      if (event.resultSource === undefined) heal.resultSource = 'provider';
      if (event.title === undefined) heal.title = `${event.home} vs ${event.away}`;
      if (event.participants === undefined) {
        heal.participants = [
          { name: event.home, type: 'team' },
          { name: event.away, type: 'team' },
        ];
      }

      await ctx.db.patch(event._id, {
        homeScore: args.homeScore,
        awayScore: args.awayScore,
        gameStatus: args.gameStatus,
        lastScoreUpdate: Date.now(),
        externalId: args.externalId,
        status,
        ...heal,
      });
    } else {
      // Create new event from API
      await ctx.db.insert('events', {
        sport: args.sport,
        league: args.league,
        home: args.homeTeam,
        away: args.awayTeam,
        time,
        startsAt,
        creatorCount: 0,
        pickCount: 0,
        featured: false,
        status,
        homeScore: args.homeScore,
        awayScore: args.awayScore,
        gameStatus: args.gameStatus,
        lastScoreUpdate: Date.now(),
        externalId: args.externalId,
        title: `${args.homeTeam} vs ${args.awayTeam}`,
        sourceType: 'provider',
        providerName: 'the-odds-api',
        visibility: 'public',
        verificationStatus: 'source_verified',
        resultSource: 'provider',
        participants: [
          { name: args.homeTeam, type: 'team' },
          { name: args.awayTeam, type: 'team' },
        ],
      });
    }
  },
});

// ── Types & helpers ──────────────────────────────────────────────────────

interface OddsApiScore {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  completed: boolean;
  last_update: string | null;
  scores: Array<{ name: string; score: string }> | null;
}

function parseScore(
  scores: Array<{ name: string; score: string }> | null,
  teamName: string,
): number {
  if (!scores) return 0;
  const entry = scores.find((s) => s.name === teamName);
  return entry ? parseInt(entry.score, 10) || 0 : 0;
}

/** Reverse-map an API sport key back to our schema sport name. */
function sportKeyToName(key: string): string {
  for (const [name, keys] of Object.entries(SPORT_KEY_MAP)) {
    if (keys.includes(key)) return name;
  }
  return 'Other';
}
