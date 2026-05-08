import { mutation } from './_generated/server';
import { api } from './_generated/api';

// =============================================================================
// Seed Module — Populates dev environment with sample data
// =============================================================================

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Seed categories
    await ctx.runMutation(api.categories.seedDefaultCategories, {});

    // 2. Check if creators already seeded
    const existingCreators = await ctx.db.query('creators').take(1);
    if (existingCreators.length > 0) {
      return { status: 'already_seeded' };
    }

    // 3. Seed creators
    const creators = [
      {
        handle: '@sharpedgebets',
        name: 'SharpEdge Bets',
        avatarColor: '#00ba7c',
        avatarMono: 'SE',
        verified: true,
        niche: 'NFL sides & totals',
        sports: ['NFL', 'NCAAF'],
        bio: 'Former line analyst at offshore. Focused on NFL sides and totals using closing-line value methodology.',
        subscriberCount: 4120,
        startingPrice: 29,
        winRate: 58.2,
        record: '312-224',
        last10: 'WWLWWWLWWW',
        units: '+42.1u',
        streak: 'W4',
        tags: ['NFL', 'Sides', 'CLV'],
        trending: true,
        status: 'active' as const,
      },
      {
        handle: '@nordicpicks',
        name: 'Nordic Picks',
        avatarColor: '#1c9cf0',
        avatarMono: 'NP',
        verified: true,
        niche: 'EPL & Bundesliga',
        sports: ['EPL', 'Bundesliga', 'Champions League'],
        bio: 'European football specialist. 8+ years covering EPL and Bundesliga with a focus on Asian handicap markets.',
        subscriberCount: 2890,
        startingPrice: 24,
        winRate: 56.8,
        record: '198-151',
        last10: 'WLWWWLWWLW',
        units: '+28.7u',
        streak: 'W2',
        tags: ['EPL', 'Bundesliga', 'Soccer'],
        trending: false,
        status: 'active' as const,
      },
      {
        handle: '@courtvisionpro',
        name: 'CourtVision Pro',
        avatarColor: '#7a4dd9',
        avatarMono: 'CV',
        verified: true,
        niche: 'NBA props',
        sports: ['NBA'],
        bio: 'NBA props specialist using proprietary projection models. Player props, alt lines, and game totals.',
        subscriberCount: 3540,
        startingPrice: 34,
        winRate: 61.3,
        record: '287-182',
        last10: 'WWWWLWWWLW',
        units: '+51.2u',
        streak: 'W3',
        tags: ['NBA', 'Props', 'Models'],
        trending: true,
        status: 'active' as const,
      },
      {
        handle: '@pucklineking',
        name: 'Puckline King',
        avatarColor: '#f4212e',
        avatarMono: 'PK',
        verified: true,
        niche: 'NHL puck lines',
        sports: ['NHL'],
        bio: 'NHL specialist focused on puck lines and period betting. Deep dive into goaltender matchups and line movements.',
        subscriberCount: 1680,
        startingPrice: 19,
        winRate: 54.9,
        record: '156-128',
        last10: 'LWWWLLWWWL',
        units: '+18.4u',
        streak: 'L1',
        tags: ['NHL', 'Puck Lines'],
        trending: false,
        status: 'active' as const,
      },
      {
        handle: '@tennisedge',
        name: 'Tennis Edge',
        avatarColor: '#f7b928',
        avatarMono: 'TE',
        verified: true,
        niche: 'ATP & WTA',
        sports: ['ATP', 'WTA'],
        bio: 'Full-time tennis analyst covering ATP and WTA circuits. Set betting, live markets, and surface-specific analysis.',
        subscriberCount: 920,
        startingPrice: 22,
        winRate: 59.1,
        record: '178-123',
        last10: 'WWWLWWWWLW',
        units: '+34.6u',
        streak: 'W5',
        tags: ['ATP', 'WTA', 'Tennis'],
        trending: false,
        status: 'active' as const,
      },
      {
        handle: '@octagonsharp',
        name: 'Octagon Sharp',
        avatarColor: '#e0245e',
        avatarMono: 'OS',
        verified: true,
        niche: 'UFC & MMA',
        sports: ['UFC', 'MMA'],
        bio: 'MMA analyst with edge in method-of-victory and round props. Backed by fight-metric data and camp intel.',
        subscriberCount: 2210,
        startingPrice: 27,
        winRate: 57.4,
        record: '142-106',
        last10: 'WLWWWWLWWW',
        units: '+22.8u',
        streak: 'W3',
        tags: ['UFC', 'MMA', 'Props'],
        trending: true,
        status: 'active' as const,
      },
    ];

    const creatorIds = [];
    for (const creator of creators) {
      const id = await ctx.db.insert('creators', {
        ...creator,
        createdAt: Date.now(),
      });
      creatorIds.push(id);
    }

    // 4. Seed events
    const now = Date.now();
    const events = [
      {
        sport: 'Basketball',
        league: 'NBA',
        home: 'Lakers',
        away: 'Celtics',
        time: '7:30 PM ET',
        startsAt: now + 3600000,
        creatorCount: 28,
        pickCount: 42,
        featured: true,
        status: 'upcoming' as const,
      },
      {
        sport: 'Football',
        league: 'NFL',
        home: 'Chiefs',
        away: 'Bills',
        time: '8:15 PM ET',
        startsAt: now + 7200000,
        creatorCount: 34,
        pickCount: 56,
        featured: true,
        status: 'upcoming' as const,
      },
      {
        sport: 'Hockey',
        league: 'NHL',
        home: 'Bruins',
        away: 'Rangers',
        time: '7:00 PM ET',
        startsAt: now + 1800000,
        creatorCount: 12,
        pickCount: 18,
        featured: false,
        status: 'upcoming' as const,
      },
      {
        sport: 'Baseball',
        league: 'MLB',
        home: 'Yankees',
        away: 'Red Sox',
        time: '7:05 PM ET',
        startsAt: now + 5400000,
        creatorCount: 8,
        pickCount: 14,
        featured: false,
        status: 'upcoming' as const,
      },
      {
        sport: 'Soccer',
        league: 'EPL',
        home: 'Arsenal',
        away: 'Liverpool',
        time: '3:00 PM GMT',
        startsAt: now + 43200000,
        creatorCount: 18,
        pickCount: 26,
        featured: true,
        status: 'upcoming' as const,
      },
      {
        sport: 'Tennis',
        league: 'ATP',
        home: 'Sinner',
        away: 'Alcaraz',
        time: '2:00 PM CET',
        startsAt: now + 36000000,
        creatorCount: 6,
        pickCount: 10,
        featured: false,
        status: 'upcoming' as const,
      },
      {
        sport: 'MMA',
        league: 'UFC',
        home: 'Makhachev',
        away: 'Oliveira',
        time: '10:00 PM ET',
        startsAt: now + 86400000,
        creatorCount: 14,
        pickCount: 22,
        featured: false,
        status: 'upcoming' as const,
      },
    ];

    const eventIds = [];
    for (const event of events) {
      const id = await ctx.db.insert('events', event);
      eventIds.push(id);
    }

    // 5. Seed picks (linked to creators + events)
    const picks = [
      {
        creatorId: creatorIds[0],
        access: 'free' as const,
        sport: 'Football',
        league: 'NFL',
        eventId: eventIds[1],
        eventName: 'Bills @ Chiefs',
        eventTime: '8:15 PM ET',
        title: 'Chiefs -2.5',
        market: 'Spread',
        selection: 'Kansas City Chiefs -2.5',
        odds: '-110',
        units: '2u',
        confidence: 'High' as const,
        body: 'Chiefs at home in a primetime spot. Mahomes is 14-2 ATS in home playoff-caliber games.',
        teaser: 'CLV edge on the home spread...',
        status: 'published' as const,
        grade: 'pending' as const,
        publishedAt: now - 3600000,
      },
      {
        creatorId: creatorIds[2],
        access: 'premium' as const,
        sport: 'Basketball',
        league: 'NBA',
        eventId: eventIds[0],
        eventName: 'Celtics @ Lakers',
        eventTime: '7:30 PM ET',
        title: 'Over 224.5',
        market: 'Total',
        selection: 'Over 224.5',
        odds: '-108',
        units: '1.5u',
        confidence: 'Medium' as const,
        body: 'Both teams in top-10 pace this month. Model projects 228.',
        teaser: 'Pace-driven over in a marquee matchup...',
        status: 'published' as const,
        grade: 'pending' as const,
        publishedAt: now - 1800000,
      },
      {
        creatorId: creatorIds[1],
        access: 'premium' as const,
        sport: 'Soccer',
        league: 'EPL',
        eventId: eventIds[4],
        eventName: 'Arsenal v Liverpool',
        eventTime: '3:00 PM GMT',
        title: 'Arsenal -0.5 AH',
        market: 'Asian Handicap',
        selection: 'Arsenal -0.5',
        odds: '+102',
        units: '2u',
        confidence: 'High' as const,
        body: 'Arsenal unbeaten at home in 14 matches. xG differential strongly favors the hosts.',
        teaser: 'Home fortress advantage with value on the handicap...',
        status: 'published' as const,
        grade: 'pending' as const,
        publishedAt: now - 7200000,
      },
    ];

    for (const pick of picks) {
      await ctx.db.insert('picks', {
        ...pick,
        createdAt: now,
      });
    }

    return {
      status: 'seeded',
      creators: creatorIds.length,
      events: eventIds.length,
      picks: picks.length,
    };
  },
});
