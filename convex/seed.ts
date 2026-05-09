import { mutation } from './_generated/server';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { requireUser } from './shared/permissions';

// =============================================================================
// Seed Module — Populates dev environment with rich sample data
// =============================================================================

// Admin-only.
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Hard gate: refuse outright in production.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Seeding is disabled in production');
    }
    // Otherwise: only super_admin may run the seed.
    const user = await requireUser(ctx);
    if (user.role !== 'super_admin') {
      throw new Error('Forbidden: super_admin role required');
    }

    // 1. Seed categories
    await ctx.runMutation(api.categories.seedDefaultCategories, {});

    // 2. Check if creators already seeded
    const existingCreators = await ctx.db.query('creators').take(1);
    if (existingCreators.length > 0) {
      return { status: 'already_seeded' };
    }

    const now = Date.now();

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Seed Creators (10 diverse creators)
    // ═══════════════════════════════════════════════════════════════════════

    const creators = [
      {
        handle: '@sharpedgebets',
        name: 'SharpEdge Bets',
        avatarColor: '#00ba7c',
        avatarMono: 'SE',
        verified: true,
        niche: 'NFL sides & totals',
        sports: ['NFL', 'NCAAF'],
        bio: 'Former line analyst at offshore. Focused on NFL sides and totals using closing-line value methodology. 312-224 verified record since 2022.',
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
        bio: 'European football specialist. 8+ years covering EPL and Bundesliga with a focus on Asian handicap markets. xG-driven methodology.',
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
        bio: 'NBA props specialist using proprietary projection models. Player props, alt lines, and game totals. Pre-game only — no live bets.',
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
        bio: 'NHL specialist focused on puck lines and period betting. Deep dive into goaltender matchups and line movements. Goalie starts tracker updated daily.',
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
        bio: 'Full-time tennis analyst covering ATP and WTA circuits. Set betting, live markets, and surface-specific analysis. 4+ year track record.',
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
        bio: 'MMA analyst with edge in method-of-victory and round props. Backed by fight-metric data and camp intel. 3-year ROI: +28%.',
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
      {
        handle: '@diamonddata',
        name: 'Diamond Data',
        avatarColor: '#2b7a78',
        avatarMono: 'DD',
        verified: true,
        niche: 'MLB run lines & F5',
        sports: ['MLB'],
        bio: 'Baseball analytics. First-five innings specialist using starting pitcher matchups, bullpen usage, and park factors. Daily model output.',
        subscriberCount: 1560,
        startingPrice: 22,
        winRate: 55.7,
        record: '218-173',
        last10: 'WLWWLWWWLW',
        units: '+19.4u',
        streak: 'W2',
        tags: ['MLB', 'F5', 'Run Lines'],
        trending: false,
        status: 'active' as const,
      },
      {
        handle: '@gridironmodel',
        name: 'Gridiron Model',
        avatarColor: '#3d405b',
        avatarMono: 'GM',
        verified: true,
        niche: 'NCAAF & NFL alt lines',
        sports: ['NCAAF', 'NFL'],
        bio: 'College football quant. Alt-line and teaser specialist using EPA/play and success rate models. Saturday slate focus.',
        subscriberCount: 890,
        startingPrice: 19,
        winRate: 57.8,
        record: '104-76',
        last10: 'WWWLWLWWWW',
        units: '+16.2u',
        streak: 'W4',
        tags: ['NCAAF', 'NFL', 'Alt Lines'],
        trending: false,
        status: 'active' as const,
      },
      {
        handle: '@parlaysniper',
        name: 'Parlay Sniper',
        avatarColor: '#ff6b6b',
        avatarMono: 'PS',
        verified: false,
        niche: 'Multi-sport SGP',
        sports: ['NBA', 'NFL', 'MLB'],
        bio: 'Same-game parlay specialist across NBA, NFL, and MLB. Correlated leg strategy. Newer to the platform — building track record transparently.',
        subscriberCount: 340,
        startingPrice: 15,
        winRate: 52.1,
        record: '62-57',
        last10: 'LWWLWLWWWL',
        units: '+8.4u',
        streak: 'L1',
        tags: ['SGP', 'Parlays', 'Multi-sport'],
        trending: false,
        status: 'active' as const,
      },
      {
        handle: '@linemovement',
        name: 'Line Movement',
        avatarColor: '#6c5ce7',
        avatarMono: 'LM',
        verified: true,
        niche: 'Steam & RLM tracking',
        sports: ['NFL', 'NBA', 'NCAAB'],
        bio: 'Tracks reverse line movement and steam across major US sports. Automated alerts + manual analysis. 6+ year archive of line movement data.',
        subscriberCount: 5210,
        startingPrice: 39,
        winRate: 60.1,
        record: '401-267',
        last10: 'WWWWWLWWLW',
        units: '+68.3u',
        streak: 'W2',
        tags: ['RLM', 'Steam', 'NFL', 'NBA'],
        trending: true,
        status: 'active' as const,
      },
    ];

    const creatorIds: Id<'creators'>[] = [];
    for (const creator of creators) {
      const id = await ctx.db.insert('creators', {
        ...creator,
        createdAt: now,
      });
      creatorIds.push(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Seed Events (12 events across sports)
    // ═══════════════════════════════════════════════════════════════════════

    const events = [
      // Soccer — EPL
      { sport: 'Soccer', league: 'EPL', home: 'Arsenal', away: 'Liverpool', time: '3:00 PM GMT', startsAt: now + 43200000, creatorCount: 28, pickCount: 42, featured: true, status: 'upcoming' as const },
      { sport: 'Soccer', league: 'EPL', home: 'Chelsea', away: 'Man City', time: '5:30 PM GMT', startsAt: now + 52200000, creatorCount: 22, pickCount: 38, featured: true, status: 'upcoming' as const },
      { sport: 'Soccer', league: 'EPL', home: 'Tottenham', away: 'Newcastle', time: '3:00 PM GMT', startsAt: now + 43200000, creatorCount: 14, pickCount: 22, featured: false, status: 'upcoming' as const },
      { sport: 'Soccer', league: 'EPL', home: 'Aston Villa', away: 'Brighton', time: '3:00 PM GMT', startsAt: now + 43200000, creatorCount: 8, pickCount: 12, featured: false, status: 'upcoming' as const },
      // Soccer — La Liga
      { sport: 'Soccer', league: 'La Liga', home: 'Real Madrid', away: 'Barcelona', time: '9:00 PM CET', startsAt: now + 72000000, creatorCount: 34, pickCount: 56, featured: true, status: 'upcoming' as const },
      { sport: 'Soccer', league: 'La Liga', home: 'Atlético Madrid', away: 'Sevilla', time: '4:15 PM CET', startsAt: now + 54000000, creatorCount: 9, pickCount: 14, featured: false, status: 'upcoming' as const },
      // Soccer — Bundesliga
      { sport: 'Soccer', league: 'Bundesliga', home: 'Leverkusen', away: 'Dortmund', time: '5:30 PM CET', startsAt: now + 28800000, creatorCount: 12, pickCount: 18, featured: false, status: 'upcoming' as const },
      // Cricket — IPL
      { sport: 'Cricket', league: 'IPL', home: 'Mumbai Indians', away: 'Chennai Super Kings', time: '7:30 PM IST', startsAt: now + 18000000, creatorCount: 18, pickCount: 26, featured: true, status: 'upcoming' as const },
      { sport: 'Cricket', league: 'IPL', home: 'Royal Challengers', away: 'Kolkata Knight Riders', time: '3:30 PM IST', startsAt: now + 3600000, creatorCount: 12, pickCount: 18, featured: false, status: 'upcoming' as const },
      { sport: 'Cricket', league: 'IPL', home: 'Delhi Capitals', away: 'Rajasthan Royals', time: '7:30 PM IST', startsAt: now + 90000000, creatorCount: 8, pickCount: 11, featured: false, status: 'upcoming' as const },
      // Tennis — Italian Open
      { sport: 'Tennis', league: 'ATP Italian Open', home: 'Sinner', away: 'Alcaraz', time: '2:00 PM CET', startsAt: now + 36000000, creatorCount: 6, pickCount: 10, featured: false, status: 'upcoming' as const },
      { sport: 'Tennis', league: 'WTA Italian Open', home: 'Świątek', away: 'Gauff', time: '12:00 PM CET', startsAt: now + 28800000, creatorCount: 4, pickCount: 7, featured: false, status: 'upcoming' as const },
      { sport: 'Tennis', league: 'ATP Italian Open', home: 'Djokovic', away: 'Medvedev', time: '8:00 PM CET', startsAt: now + 57600000, creatorCount: 5, pickCount: 8, featured: false, status: 'upcoming' as const },
    ];

    const eventIds: Id<'events'>[] = [];
    for (const event of events) {
      const id = await ctx.db.insert('events', event);
      eventIds.push(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Seed Picks (12 picks across creators & events)
    // ═══════════════════════════════════════════════════════════════════════

    const picks = [
      // SharpEdge — NFL
      {
        creatorId: creatorIds[0], access: 'free' as const, sport: 'Football', league: 'NFL',
        eventId: eventIds[3], eventName: 'Bills @ Chiefs', eventTime: '8:15 PM ET',
        title: 'Chiefs -2.5', market: 'Spread', selection: 'Kansas City Chiefs -2.5',
        odds: '-110', units: '2u', confidence: 'High' as const,
        body: 'Chiefs at home in a primetime spot. Mahomes is 14-2 ATS in home playoff-caliber games. CLV edge on the home spread.',
        teaser: 'CLV edge on the home spread...',
        status: 'published' as const, grade: 'pending' as const, publishedAt: now - 3600000,
      },
      {
        creatorId: creatorIds[0], access: 'premium' as const, sport: 'Football', league: 'NFL',
        eventId: eventIds[4], eventName: 'Eagles @ 49ers', eventTime: '4:25 PM ET',
        title: '49ers ML', market: 'Moneyline', selection: 'San Francisco 49ers',
        odds: '-145', units: '3u', confidence: 'High' as const,
        body: 'San Francisco has won 8 of the last 10 home games against NFC opponents. Offensive line matchup strongly favors the home team.',
        teaser: 'Home field edge with an O-line mismatch...',
        status: 'published' as const, grade: 'pending' as const, publishedAt: now - 1200000,
      },
      // CourtVision — NBA
      {
        creatorId: creatorIds[2], access: 'premium' as const, sport: 'Basketball', league: 'NBA',
        eventId: eventIds[0], eventName: 'Celtics @ Lakers', eventTime: '7:30 PM ET',
        title: 'Over 224.5', market: 'Total', selection: 'Over 224.5',
        odds: '-108', units: '1.5u', confidence: 'Medium' as const,
        body: 'Both teams in top-10 pace this month. Model projects 228. Defensive efficiency dips in back-to-back scenarios for Boston.',
        teaser: 'Pace-driven over in a marquee matchup...',
        status: 'published' as const, grade: 'pending' as const, publishedAt: now - 1800000,
      },
      {
        creatorId: creatorIds[2], access: 'free' as const, sport: 'Basketball', league: 'NBA',
        eventId: eventIds[0], eventName: 'Celtics @ Lakers', eventTime: '7:30 PM ET',
        title: 'LeBron O 27.5 Pts', market: 'Player Props', selection: 'LeBron James Over 27.5 Points',
        odds: '-115', units: '2u', confidence: 'High' as const,
        body: 'LeBron has cleared 28+ in 6 of his last 7 home games vs East opponents. Minutes should be elevated in a nationally televised spot.',
        teaser: 'LeBron in a spotlight game against Boston...',
        status: 'published' as const, grade: 'pending' as const, publishedAt: now - 900000,
      },
      // Nordic — Soccer
      {
        creatorId: creatorIds[1], access: 'premium' as const, sport: 'Soccer', league: 'EPL',
        eventId: eventIds[7], eventName: 'Arsenal v Liverpool', eventTime: '3:00 PM GMT',
        title: 'Arsenal -0.5 AH', market: 'Asian Handicap', selection: 'Arsenal -0.5',
        odds: '+102', units: '2u', confidence: 'High' as const,
        body: 'Arsenal unbeaten at home in 14 matches. xG differential strongly favors the hosts. Liverpool missing key midfielders.',
        teaser: 'Home fortress advantage with value on the handicap...',
        status: 'published' as const, grade: 'pending' as const, publishedAt: now - 7200000,
      },
      {
        creatorId: creatorIds[1], access: 'free' as const, sport: 'Soccer', league: 'Bundesliga',
        eventId: eventIds[8], eventName: 'Leverkusen v Dortmund', eventTime: '5:30 PM CET',
        title: 'BTTS Yes', market: 'Both Teams to Score', selection: 'Yes',
        odds: '-125', units: '1.5u', confidence: 'Medium' as const,
        body: 'BTTS has hit in 8 of Leverkusen\'s last 10 home games. Dortmund score on the road consistently — 82% rate this season.',
        teaser: 'Two high-scoring teams in a rivalry match...',
        status: 'published' as const, grade: 'pending' as const, publishedAt: now - 5400000,
      },
      // Puckline King — NHL
      {
        creatorId: creatorIds[3], access: 'free' as const, sport: 'Hockey', league: 'NHL',
        eventId: eventIds[5], eventName: 'Rangers @ Bruins', eventTime: '7:00 PM ET',
        title: 'Under 5.5 Goals', market: 'Total', selection: 'Under 5.5',
        odds: '-120', units: '2u', confidence: 'High' as const,
        body: 'Both goalies are in the top-5 for save percentage this month. Defensive styles clash. Under has hit in 7 of last 10 H2H.',
        teaser: 'Goaltending matchup drives this under...',
        status: 'published' as const, grade: 'pending' as const, publishedAt: now - 2400000,
      },
      // Tennis Edge — ATP
      {
        creatorId: creatorIds[4], access: 'premium' as const, sport: 'Tennis', league: 'ATP',
        eventId: eventIds[9], eventName: 'Sinner v Alcaraz', eventTime: '2:00 PM CET',
        title: 'Over 22.5 Games', market: 'Total Games', selection: 'Over 22.5',
        odds: '-105', units: '1u', confidence: 'Medium' as const,
        body: 'Clay court matchup. Both players excellent on serve but less dominant in return games on this surface. Tight sets expected.',
        teaser: 'Two elite servers on clay = deep sets...',
        status: 'published' as const, grade: 'pending' as const, publishedAt: now - 10800000,
      },
      // Octagon Sharp — UFC
      {
        creatorId: creatorIds[5], access: 'premium' as const, sport: 'MMA', league: 'UFC',
        eventId: eventIds[12], eventName: 'Makhachev v Oliveira', eventTime: '10:00 PM ET',
        title: 'Makhachev by Decision', market: 'Method of Victory', selection: 'Makhachev via Decision',
        odds: '+155', units: '1.5u', confidence: 'Medium' as const,
        body: 'Makhachev\'s wrestling will neutralize Oliveira\'s submission threat. Expect a controlled 5-round fight. Camp intel suggests focus on top control.',
        teaser: 'Wrestling-heavy game plan points to the scorecards...',
        status: 'published' as const, grade: 'pending' as const, publishedAt: now - 86400000,
      },
      // Diamond Data — MLB
      {
        creatorId: creatorIds[6], access: 'free' as const, sport: 'Baseball', league: 'MLB',
        eventId: eventIds[10], eventName: 'Yankees v Red Sox', eventTime: '7:05 PM ET',
        title: 'F5 Over 4.5', market: 'First 5 Innings Total', selection: 'Over 4.5',
        odds: '-110', units: '2u', confidence: 'High' as const,
        body: 'Both starters have ERAs above 4.50 in their last 5 outings. Park factor at Yankee Stadium heavily inflated this month.',
        teaser: 'Two struggling starters in a hitter-friendly park...',
        status: 'published' as const, grade: 'pending' as const, publishedAt: now - 4800000,
      },
      // Line Movement — cross-sport
      {
        creatorId: creatorIds[9], access: 'free' as const, sport: 'Basketball', league: 'NBA',
        eventId: eventIds[1], eventName: 'Knicks @ Nuggets', eventTime: '9:00 PM ET',
        title: 'Nuggets -6.5 (RLM)', market: 'Spread', selection: 'Denver Nuggets -6.5',
        odds: '-110', units: '2u', confidence: 'High' as const,
        body: 'Reverse line movement detected — public on Knicks +6.5, line moved from -5 to -6.5. Sharp money landing on Denver. Steam at 3 major books.',
        teaser: 'RLM + steam on the home favorite...',
        status: 'published' as const, grade: 'pending' as const, publishedAt: now - 600000,
      },
      {
        creatorId: creatorIds[9], access: 'premium' as const, sport: 'Football', league: 'NFL',
        eventId: eventIds[3], eventName: 'Bills @ Chiefs', eventTime: '8:15 PM ET',
        title: 'Over 51.5 (Steam)', market: 'Total', selection: 'Over 51.5',
        odds: '-108', units: '1.5u', confidence: 'Medium' as const,
        body: 'Steam move at Pinnacle pushed total from 49 to 51.5 in 90 minutes. Volume confirms sharp action on the over.',
        teaser: 'Pinnacle steam on the game total...',
        status: 'published' as const, grade: 'pending' as const, publishedAt: now - 300000,
      },
    ];

    for (const pick of picks) {
      await ctx.db.insert('picks', {
        ...pick,
        createdAt: now,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Seed Users (8 subscribers + 2 admins)
    // ═══════════════════════════════════════════════════════════════════════

    const users = [
      { name: 'Alex Rivera', email: 'alex@example.com', role: 'user' as const },
      { name: 'Jordan Mitchell', email: 'jordan@example.com', role: 'user' as const },
      { name: 'Casey Brooks', email: 'casey@example.com', role: 'user' as const },
      { name: 'Taylor Reid', email: 'taylor@example.com', role: 'user' as const },
      { name: 'Morgan Quinn', email: 'morgan@example.com', role: 'user' as const },
      { name: 'Riley Dawson', email: 'riley@example.com', role: 'user' as const },
      { name: 'Cameron Hart', email: 'cameron@example.com', role: 'user' as const },
      { name: 'Drew Sullivan', email: 'drew@example.com', role: 'user' as const },
      { name: 'Admin User', email: 'admin@digipicks.com', role: 'admin' as const },
      { name: 'Super Admin', email: 'super@digipicks.com', role: 'super_admin' as const },
    ];

    const userIds: Id<'users'>[] = [];
    for (const user of users) {
      const id = await ctx.db.insert('users', {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: true,
      });
      userIds.push(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 7. Seed Subscriptions (subscribers → creators)
    // ═══════════════════════════════════════════════════════════════════════

    const subs = [
      // Alex follows SharpEdge + CourtVision
      { sub: 0, creator: 0, plan: 'premium' as const },
      { sub: 0, creator: 2, plan: 'free' as const },
      // Jordan follows Nordic + Octagon
      { sub: 1, creator: 1, plan: 'free' as const },
      { sub: 1, creator: 5, plan: 'premium' as const },
      // Casey follows Line Movement (VIP)
      { sub: 2, creator: 9, plan: 'vip' as const },
      // Taylor follows SharpEdge + Gridiron
      { sub: 3, creator: 0, plan: 'free' as const },
      { sub: 3, creator: 7, plan: 'free' as const },
      // Morgan follows CourtVision + Diamond
      { sub: 4, creator: 2, plan: 'premium' as const },
      { sub: 4, creator: 6, plan: 'free' as const },
      // Riley follows Tennis Edge + Nordic
      { sub: 5, creator: 4, plan: 'free' as const },
      { sub: 5, creator: 1, plan: 'premium' as const },
      // Cameron follows Puckline + Line Movement
      { sub: 6, creator: 3, plan: 'free' as const },
      { sub: 6, creator: 9, plan: 'premium' as const },
      // Drew follows SharpEdge (cancelled)
      { sub: 7, creator: 0, plan: 'free' as const, cancelled: true },
    ];

    for (const s of subs) {
      await ctx.db.insert('subscriptions', {
        subscriberId: userIds[s.sub],
        creatorId: creatorIds[s.creator],
        plan: s.plan,
        status: s.cancelled ? 'cancelled' : 'active',
        startedAt: now - 86400000 * Math.floor(Math.random() * 90 + 7),
        renewsAt: s.cancelled ? undefined : now + 86400000 * 30,
        cancelledAt: s.cancelled ? now - 86400000 * 2 : undefined,
      });
    }

    return {
      status: 'seeded',
      creators: creatorIds.length,
      events: eventIds.length,
      picks: picks.length,
      users: userIds.length,
      subscriptions: subs.length,
    };
  },
});
