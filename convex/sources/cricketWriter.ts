import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';

// =============================================================================
// V8/edge mutation that the ESPNcricinfo node action delegates to. Lives in
// its own file because Convex Node.js modules ('use node') can only contain
// actions — mutations and queries must live in regular V8 modules.
// =============================================================================

export const upsertCricketFixture = internalMutation({
  args: {
    externalId: v.string(),
    series: v.string(),
    home: v.string(),
    away: v.string(),
    startsAtMs: v.number(),
    sourceUrl: v.string(),
  },
  handler: async (ctx, args): Promise<'inserted' | 'updated'> => {
    const existing = await ctx.db
      .query('events')
      .withIndex('by_external_id', (q) => q.eq('externalId', args.externalId))
      .first();

    const time =
      new Date(args.startsAtMs).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC',
      }) + ' UTC';

    if (existing) {
      await ctx.db.patch(existing._id, {
        sport: 'Cricket',
        league: args.series,
        home: args.home,
        away: args.away,
        time,
        startsAt: args.startsAtMs,
        title: `${args.home} vs ${args.away}`,
        sourceType: 'sport_source',
        providerName: 'espncricinfo',
        sourceUrl: args.sourceUrl,
        verificationStatus: 'source_verified',
        visibility: 'public',
        resultSource: 'provider',
        participants: [
          { name: args.home, type: 'team' },
          { name: args.away, type: 'team' },
        ],
      });
      return 'updated';
    }

    await ctx.db.insert('events', {
      sport: 'Cricket',
      league: args.series,
      home: args.home,
      away: args.away,
      time,
      startsAt: args.startsAtMs,
      creatorCount: 0,
      pickCount: 0,
      featured: false,
      status: 'upcoming',
      externalId: args.externalId,
      title: `${args.home} vs ${args.away}`,
      sourceType: 'sport_source',
      providerName: 'espncricinfo',
      sourceUrl: args.sourceUrl,
      verificationStatus: 'source_verified',
      visibility: 'public',
      resultSource: 'provider',
      participants: [
        { name: args.home, type: 'team' },
        { name: args.away, type: 'team' },
      ],
    });
    return 'inserted';
  },
});
