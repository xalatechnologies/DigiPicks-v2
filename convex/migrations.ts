import { internalMutation } from './_generated/server';

/**
 * One-off: delete all events so the cron + seed can repopulate.
 */
export const clearEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query('events').collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    return { deleted: events.length };
  },
});

/**
 * Seed high-profile upcoming events across Soccer, Cricket, Tennis.
 */
export const seedEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const DAY = 86400000;

    const events = [
      // ── Soccer · Champions League ──────────────────────────────────
      { sport: 'Soccer', league: 'Champions League', home: 'Inter Milan', away: 'Paris Saint-Germain', time: '9:00 PM CET', startsAt: now + DAY * 2, creatorCount: 42, pickCount: 68, featured: true, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Soccer', league: 'Champions League', home: 'Arsenal', away: 'Bayern Munich', time: '9:00 PM CET', startsAt: now + DAY * 3, creatorCount: 38, pickCount: 54, featured: true, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      // ── Soccer · EPL ───────────────────────────────────────────────
      { sport: 'Soccer', league: 'EPL', home: 'Liverpool', away: 'Chelsea', time: '12:30 PM GMT', startsAt: now + DAY, creatorCount: 28, pickCount: 42, featured: true, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Soccer', league: 'EPL', home: 'Fulham', away: 'Bournemouth', time: '3:00 PM GMT', startsAt: now + DAY, creatorCount: 12, pickCount: 18, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Soccer', league: 'EPL', home: 'Brighton', away: 'Wolves', time: '3:00 PM GMT', startsAt: now + DAY, creatorCount: 8, pickCount: 11, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Soccer', league: 'EPL', home: 'Nottingham Forest', away: 'Crystal Palace', time: '3:00 PM GMT', startsAt: now + DAY, creatorCount: 6, pickCount: 9, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Soccer', league: 'EPL', home: 'Everton', away: 'Southampton', time: '5:30 PM GMT', startsAt: now + DAY, creatorCount: 5, pickCount: 7, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      // ── Soccer · La Liga ───────────────────────────────────────────
      { sport: 'Soccer', league: 'La Liga', home: 'Real Madrid', away: 'Barcelona', time: '9:00 PM CET', startsAt: now + DAY * 4, creatorCount: 48, pickCount: 72, featured: true, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Soccer', league: 'La Liga', home: 'Atlético Madrid', away: 'Sevilla', time: '4:15 PM CET', startsAt: now + DAY * 2, creatorCount: 9, pickCount: 14, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Soccer', league: 'La Liga', home: 'Real Sociedad', away: 'Athletic Bilbao', time: '6:30 PM CET', startsAt: now + DAY * 2, creatorCount: 7, pickCount: 10, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      // ── Soccer · Bundesliga ────────────────────────────────────────
      { sport: 'Soccer', league: 'Bundesliga', home: 'Leverkusen', away: 'Dortmund', time: '5:30 PM CET', startsAt: now + DAY * 3, creatorCount: 14, pickCount: 22, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Soccer', league: 'Bundesliga', home: 'Bayern Munich', away: 'RB Leipzig', time: '6:30 PM CET', startsAt: now + DAY * 5, creatorCount: 18, pickCount: 28, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      // ── Cricket · IPL ──────────────────────────────────────────────
      { sport: 'Cricket', league: 'IPL', home: 'Mumbai Indians', away: 'Chennai Super Kings', time: '7:30 PM IST', startsAt: now + DAY, creatorCount: 22, pickCount: 34, featured: true, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Cricket', league: 'IPL', home: 'Royal Challengers', away: 'Kolkata Knight Riders', time: '3:30 PM IST', startsAt: now + DAY * 2, creatorCount: 16, pickCount: 24, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Cricket', league: 'IPL', home: 'Delhi Capitals', away: 'Rajasthan Royals', time: '7:30 PM IST', startsAt: now + DAY * 3, creatorCount: 10, pickCount: 15, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Cricket', league: 'IPL', home: 'Gujarat Titans', away: 'Punjab Kings', time: '7:30 PM IST', startsAt: now + DAY * 4, creatorCount: 8, pickCount: 11, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      // ── Cricket · T20 International ────────────────────────────────
      { sport: 'Cricket', league: 'T20 International', home: 'India', away: 'England', time: '2:00 PM IST', startsAt: now + DAY * 6, creatorCount: 28, pickCount: 40, featured: true, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      // ── Tennis · Italian Open ──────────────────────────────────────
      { sport: 'Tennis', league: 'ATP Italian Open', home: 'Sinner', away: 'Alcaraz', time: '2:30 PM CET', startsAt: now + DAY * 2, creatorCount: 8, pickCount: 12, featured: true, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Tennis', league: 'ATP Italian Open', home: 'Djokovic', away: 'Medvedev', time: '8:00 PM CET', startsAt: now + DAY * 2, creatorCount: 6, pickCount: 9, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Tennis', league: 'WTA Italian Open', home: 'Świątek', away: 'Gauff', time: '12:00 PM CET', startsAt: now + DAY * 2, creatorCount: 5, pickCount: 7, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
      { sport: 'Tennis', league: 'ATP Italian Open', home: 'Rune', away: 'Fritz', time: '4:00 PM CET', startsAt: now + DAY * 3, creatorCount: 3, pickCount: 5, featured: false, status: 'upcoming' as const, gameStatus: 'Upcoming' },
    ];

    let count = 0;
    for (const event of events) {
      await ctx.db.insert('events', event);
      count++;
    }
    return { seeded: count };
  },
});
