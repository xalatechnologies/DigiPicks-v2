import { query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { requireUser } from './shared/permissions';

// =============================================================================
// Subscriber Stats — portfolio performance for the current user
// Queries graded picks from subscribed creators to build a subscriber's
// tracked results portfolio.
// =============================================================================

/**
 * Portfolio overview: aggregate stats across all graded picks from
 * creators the current user follows.
 */
export const myPortfolio = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // Get user's active subscriptions
    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriber_and_creator', (q) =>
        q.eq('subscriberId', user._id),
      )
      .take(100);

    const activeCreatorIds = subs
      .filter((s) => s.status === 'active')
      .map((s) => s.creatorId);

    if (activeCreatorIds.length === 0) {
      return {
        totalPicks: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        pending: 0,
        winRate: 0,
        netUnits: 0,
        streak: '—',
        bySport: [],
        byCreator: [],
      };
    }

    // Fetch all picks from subscribed creators
    const allPicks: Doc<'picks'>[] = [];
    for (const creatorId of activeCreatorIds) {
      const picks = await ctx.db
        .query('picks')
        .withIndex('by_creator', (q) => q.eq('creatorId', creatorId))
        .order('desc')
        .take(200);
      allPicks.push(...picks.filter((p) => p.status === 'published'));
    }

    // Sort by publishedAt desc
    allPicks.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));

    let wins = 0;
    let losses = 0;
    let pushes = 0;
    let pending = 0;
    let netUnits = 0;

    for (const p of allPicks) {
      if (p.grade === 'win') {
        wins++;
        netUnits += parseFloat(p.netUnits ?? p.units ?? '0');
      } else if (p.grade === 'loss') {
        losses++;
        netUnits -= parseFloat(p.units ?? '0');
      } else if (p.grade === 'push') {
        pushes++;
      } else {
        pending++;
      }
    }

    const decided = wins + losses;
    const winRate = decided > 0 ? Math.round((wins / decided) * 1000) / 10 : 0;

    // Calculate streak from most recent graded picks
    let streak = '—';
    const graded = allPicks.filter((p) => p.grade === 'win' || p.grade === 'loss');
    if (graded.length > 0) {
      const first = graded[0]!.grade;
      let count = 0;
      for (const p of graded) {
        if (p.grade === first) count++;
        else break;
      }
      streak = `${first === 'win' ? 'W' : 'L'}${count}`;
    }

    // By sport
    const sportMap = new Map<string, { wins: number; losses: number; net: number }>();
    for (const p of allPicks) {
      if (p.grade !== 'win' && p.grade !== 'loss') continue;
      const s = sportMap.get(p.sport) ?? { wins: 0, losses: 0, net: 0 };
      if (p.grade === 'win') {
        s.wins++;
        s.net += parseFloat(p.netUnits ?? p.units ?? '0');
      } else {
        s.losses++;
        s.net -= parseFloat(p.units ?? '0');
      }
      sportMap.set(p.sport, s);
    }
    const bySport = Array.from(sportMap.entries()).map(([sport, s]) => ({
      sport,
      wins: s.wins,
      losses: s.losses,
      winRate: Math.round((s.wins / (s.wins + s.losses)) * 1000) / 10,
      netUnits: Math.round(s.net * 10) / 10,
    }));

    // By creator
    const creatorMap = new Map<string, { id: string; wins: number; losses: number; net: number }>();
    for (const p of allPicks) {
      if (p.grade !== 'win' && p.grade !== 'loss') continue;
      const cid = p.creatorId as string;
      const c = creatorMap.get(cid) ?? { id: cid, wins: 0, losses: 0, net: 0 };
      if (p.grade === 'win') {
        c.wins++;
        c.net += parseFloat(p.netUnits ?? p.units ?? '0');
      } else {
        c.losses++;
        c.net -= parseFloat(p.units ?? '0');
      }
      creatorMap.set(cid, c);
    }

    const byCreatorRaw = Array.from(creatorMap.values());
    const byCreator = await Promise.all(
      byCreatorRaw.map(async (c) => {
        const creator = await ctx.db.get(c.id as Id<'creators'>);
        return {
          creatorId: c.id,
          creatorName: creator?.name ?? 'Unknown',
          creatorHandle: creator?.handle ?? '',
          creatorMono: creator?.avatarMono ?? 'U',
          creatorColor: creator?.avatarColor ?? '#3A4F7A',
          wins: c.wins,
          losses: c.losses,
          winRate: Math.round((c.wins / (c.wins + c.losses)) * 1000) / 10,
          netUnits: Math.round(c.net * 10) / 10,
        };
      }),
    );

    return {
      totalPicks: allPicks.length,
      wins,
      losses,
      pushes,
      pending,
      winRate,
      netUnits: Math.round(netUnits * 10) / 10,
      streak,
      bySport,
      byCreator: byCreator.sort((a, b) => b.netUnits - a.netUnits),
    };
  },
});

/**
 * Recent graded picks across subscribed creators — for the results table.
 */
export const recentResults = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriber_and_creator', (q) =>
        q.eq('subscriberId', user._id),
      )
      .take(100);

    const activeCreatorIds = subs
      .filter((s) => s.status === 'active')
      .map((s) => s.creatorId);

    const allPicks: Doc<'picks'>[] = [];
    for (const creatorId of activeCreatorIds) {
      const picks = await ctx.db
        .query('picks')
        .withIndex('by_creator', (q) => q.eq('creatorId', creatorId))
        .order('desc')
        .take(50);
      allPicks.push(...picks.filter((p) => p.status === 'published'));
    }

    allPicks.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));

    const enriched = await Promise.all(
      allPicks.slice(0, 30).map(async (pick) => {
        const creator = await ctx.db.get(pick.creatorId);
        return {
          ...pick,
          creatorName: creator?.name ?? 'Unknown',
          creatorHandle: creator?.handle ?? '',
          creatorMono: creator?.avatarMono ?? 'U',
          creatorColor: creator?.avatarColor ?? '#3A4F7A',
          creatorVerified: creator?.verified ?? false,
        };
      }),
    );

    return enriched;
  },
});
