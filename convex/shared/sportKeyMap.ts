// =============================================================================
// Sport key registry — single source of truth for the mapping between our
// schema sport names and The Odds API sport keys.
//
// Two maps are exported:
//   - SPORT_KEY_MAP_FULL  Wide coverage. Used by oddsApi.pollUpcoming
//                         (hourly; cheap /events endpoint).
//   - SPORT_KEY_MAP_LIVE  Narrow subset. Used by liveScores.pollActive
//                         (every 60s; quota-sensitive).
//
// Adding a sport should usually go into _FULL. Add to _LIVE only if the
// 60s poll cadence is justified (high-engagement live sports).
// =============================================================================

export const SPORT_KEY_MAP_FULL: Record<string, string[]> = {
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
  // The Odds API exposes IPL year-round and Test matches as separate keys.
  // International T20Is do not have a stable key in the catalog.
  Cricket: ['cricket_ipl', 'cricket_test_match'],
  // Tennis Grand Slams are seasonal — each key is only active near its
  // tournament window and returns 404 outside it. Pollers swallow 404s
  // silently for that reason.
  Tennis: [
    'tennis_atp_australian_open',
    'tennis_atp_french_open',
    'tennis_atp_us_open',
    'tennis_atp_wimbledon',
    'tennis_wta_australian_open',
    'tennis_wta_french_open',
    'tennis_wta_us_open',
    'tennis_wta_wimbledon',
  ],
  MMA: ['mma_mixed_martial_arts'],
  // Only rugby LEAGUE has stable Odds API coverage. Six Nations and the
  // Rugby World Cup do not appear in /sports? — they are not pollable
  // through this API.
  Rugby: ['rugbyleague_nrl'],
};

/**
 * Live-score poller subset. Intentionally narrower than _FULL because the
 * cron runs every 60s — broad coverage would burn quota fast.
 *
 * Tennis entries here track whichever Masters / Grand Slam is currently
 * in-window. Rotate as the calendar moves: in May it's Italian Open, in
 * June it's French Open, in July Wimbledon, in late August the US Open.
 */
export const SPORT_KEY_MAP_LIVE: Record<string, string[]> = {
  Soccer: ['soccer_epl', 'soccer_spain_la_liga', 'soccer_uefa_champs_league'],
  Cricket: ['cricket_ipl'],
  Tennis: ['tennis_atp_italian_open', 'tennis_wta_italian_open'],
};

/**
 * Reverse-map an API sport key back to our schema sport name. Falls back
 * to 'Other' so we never silently drop an event whose key isn't mapped.
 * Resolves against the FULL map so the live-score poller still gets a
 * proper sport name when its narrow keys land.
 */
export function sportKeyToName(key: string): string {
  for (const [name, keys] of Object.entries(SPORT_KEY_MAP_FULL)) {
    if (keys.includes(key)) return name;
  }
  for (const [name, keys] of Object.entries(SPORT_KEY_MAP_LIVE)) {
    if (keys.includes(key)) return name;
  }
  return 'Other';
}
