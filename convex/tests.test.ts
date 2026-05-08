/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { expect, test, describe } from 'vitest';
import { api, internal } from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

// =============================================================================
// Creator Tests
// =============================================================================

describe('creators', () => {
  test('create and list creators', async () => {
    const t = convexTest(schema, modules);

    // Create a creator
    const creatorId = await t.mutation(internal.creators.create, {
      handle: '@testcreator',
      name: 'Test Creator',
      avatarColor: '#1c9cf0',
      avatarMono: 'TC',
      niche: 'NFL spreads',
      sports: ['NFL', 'NBA'],
      bio: 'A test creator for automated testing.',
      startingPrice: 29,
      tags: ['NFL', 'Testing'],
    });
    expect(creatorId).toBeDefined();

    // List should contain the new creator
    const creators = await t.query(api.creators.list, {});
    expect(creators.length).toBe(1);
    expect(creators[0].handle).toBe('@testcreator');
    expect(creators[0].verified).toBe(false);
    expect(creators[0].status).toBe('pending');
  });

  test('filter creators by sport', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.creators.create, {
      handle: '@nflonly',
      name: 'NFL Only',
      avatarColor: '#00ba7c',
      avatarMono: 'NO',
      niche: 'NFL',
      sports: ['NFL'],
      bio: 'NFL only.',
      startingPrice: 19,
      tags: ['NFL'],
    });
    await t.mutation(internal.creators.create, {
      handle: '@nbaonly',
      name: 'NBA Only',
      avatarColor: '#7a4dd9',
      avatarMono: 'NB',
      niche: 'NBA',
      sports: ['NBA'],
      bio: 'NBA only.',
      startingPrice: 24,
      tags: ['NBA'],
    });

    const nflCreators = await t.query(api.creators.list, { sport: 'NFL' });
    expect(nflCreators.length).toBe(1);
    expect(nflCreators[0].handle).toBe('@nflonly');

    const nbaCreators = await t.query(api.creators.list, { sport: 'NBA' });
    expect(nbaCreators.length).toBe(1);
    expect(nbaCreators[0].handle).toBe('@nbaonly');
  });

  test('get creator by handle', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.creators.create, {
      handle: '@findme',
      name: 'Find Me',
      avatarColor: '#f4212e',
      avatarMono: 'FM',
      niche: 'ATP',
      sports: ['ATP'],
      bio: 'Tennis picks.',
      startingPrice: 22,
      tags: ['Tennis'],
    });

    const found = await t.query(api.creators.getByHandle, { handle: '@findme' });
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Find Me');

    const notFound = await t.query(api.creators.getByHandle, {
      handle: '@nonexistent',
    });
    expect(notFound).toBeNull();
  });
});

// =============================================================================
// Events Tests
// =============================================================================

describe('events', () => {
  test('create and list events', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.events.create, {
      sport: 'Basketball',
      league: 'NBA',
      home: 'Lakers',
      away: 'Celtics',
      time: '7:30 PM ET',
      startsAt: Date.now() + 3600000,
      featured: true,
    });
    await t.mutation(api.events.create, {
      sport: 'Hockey',
      league: 'NHL',
      home: 'Bruins',
      away: 'Rangers',
      time: '7:00 PM ET',
      startsAt: Date.now() + 1800000,
    });

    const all = await t.query(api.events.today, {});
    expect(all.length).toBe(2);

    const featured = await t.query(api.events.featured, {});
    expect(featured.length).toBe(1);
    expect(featured[0].league).toBe('NBA');
  });

  test('filter events by sport', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.events.create, {
      sport: 'Football',
      league: 'NFL',
      home: 'Chiefs',
      away: 'Bills',
      time: '8:15 PM ET',
      startsAt: Date.now(),
    });
    await t.mutation(api.events.create, {
      sport: 'Basketball',
      league: 'NBA',
      home: 'Bucks',
      away: 'Heat',
      time: '7:30 PM ET',
      startsAt: Date.now(),
    });

    const nfl = await t.query(api.events.today, { sport: 'Football' });
    expect(nfl.length).toBe(1);
    expect(nfl[0].league).toBe('NFL');
  });
});

// =============================================================================
// Picks Tests
// =============================================================================

describe('picks', () => {
  test('create and query picks by creator', async () => {
    const t = convexTest(schema, modules);

    const creatorId = await t.mutation(internal.creators.create, {
      handle: '@pickmaker',
      name: 'Pick Maker',
      avatarColor: '#00ba7c',
      avatarMono: 'PM',
      niche: 'NFL',
      sports: ['NFL'],
      bio: 'Making picks.',
      startingPrice: 29,
      tags: ['NFL'],
    });

    await t.mutation(api.picks.create, {
      creatorId,
      access: 'free',
      sport: 'Football',
      league: 'NFL',
      eventName: 'Bills @ Chiefs',
      eventTime: '8:15 PM ET',
      title: 'Chiefs -2.5',
      market: 'Spread',
      selection: 'Chiefs -2.5',
      odds: '-110',
      units: '2u',
      confidence: 'High',
      status: 'published',
    });

    const picks = await t.query(api.picks.byCreator, { creatorId });
    expect(picks.length).toBe(1);
    expect(picks[0].title).toBe('Chiefs -2.5');
    expect(picks[0].grade).toBe('pending');
  });

  test('grade a pick', async () => {
    const t = convexTest(schema, modules);

    const creatorId = await t.mutation(internal.creators.create, {
      handle: '@grader',
      name: 'Grader',
      avatarColor: '#1c9cf0',
      avatarMono: 'GR',
      niche: 'NBA',
      sports: ['NBA'],
      bio: 'Grading picks.',
      startingPrice: 24,
      tags: ['NBA'],
    });

    const pickId = await t.mutation(api.picks.create, {
      creatorId,
      access: 'premium',
      sport: 'Basketball',
      league: 'NBA',
      eventName: 'Celtics @ Lakers',
      eventTime: '7:30 PM ET',
      title: 'Over 224.5',
      market: 'Total',
      selection: 'Over 224.5',
      odds: '-108',
      units: '1.5u',
      confidence: 'Medium',
      status: 'published',
    });

    // Grade the pick as a win
    await t.mutation(internal.picks.grade, {
      id: pickId,
      grade: 'win',
      netUnits: '+1.39u',
    });

    const picks = await t.query(api.picks.byCreator, { creatorId });
    expect(picks[0].grade).toBe('win');
    expect(picks[0].netUnits).toBe('+1.39u');
    expect(picks[0].gradedAt).toBeDefined();
  });

  test('feed returns published picks', async () => {
    const t = convexTest(schema, modules);

    const creatorId = await t.mutation(internal.creators.create, {
      handle: '@feeder',
      name: 'Feeder',
      avatarColor: '#f7b928',
      avatarMono: 'FE',
      niche: 'NFL',
      sports: ['NFL'],
      bio: 'Feed test.',
      startingPrice: 19,
      tags: ['NFL'],
    });

    // Draft pick — should NOT appear in feed
    await t.mutation(api.picks.create, {
      creatorId,
      access: 'free',
      sport: 'Football',
      league: 'NFL',
      eventName: 'Test Game',
      eventTime: '8:00 PM ET',
      title: 'Draft Pick',
      market: 'Spread',
      selection: 'Test -3',
      odds: '-110',
      units: '1u',
      confidence: 'Low',
      status: 'draft',
    });

    // Published pick — should appear in feed
    await t.mutation(api.picks.create, {
      creatorId,
      access: 'free',
      sport: 'Football',
      league: 'NFL',
      eventName: 'Live Game',
      eventTime: '8:00 PM ET',
      title: 'Published Pick',
      market: 'Total',
      selection: 'Over 45',
      odds: '-105',
      units: '2u',
      confidence: 'High',
      status: 'published',
    });

    const feed = await t.query(api.picks.feed, {});
    expect(feed.length).toBe(1);
    expect(feed[0].title).toBe('Published Pick');
  });
});

// =============================================================================
// Categories Tests
// =============================================================================

describe('categories', () => {
  test('seed default categories', async () => {
    const t = convexTest(schema, modules);

    const result = await t.mutation(api.categories.seedDefaultCategories, {});
    expect(result).toBe(true);

    const all = await t.query(api.categories.list, {});
    expect(all.length).toBe(10);

    const vehicles = await t.query(api.categories.list, { type: 'vehicle' });
    expect(vehicles.length).toBe(2);
  });

  test('seed is idempotent', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.categories.seedDefaultCategories, {});
    await t.mutation(api.categories.seedDefaultCategories, {});

    const all = await t.query(api.categories.list, {});
    expect(all.length).toBe(10); // Still 10, not 20
  });
});

// =============================================================================
// Applications Tests
// =============================================================================

describe('applications', () => {
  test('submit application', async () => {
    const t = convexTest(schema, modules);

    const appId = await t.mutation(api.applications.submit, {
      name: 'Jane Doe',
      handle: '@janedoe',
      email: 'jane@example.com',
      sport: 'NBA',
      niche: 'Player props',
      proofCount: 5,
    });
    expect(appId).toBeDefined();
  });

  test('reject duplicate email', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.applications.submit, {
      name: 'Jane Doe',
      handle: '@janedoe',
      email: 'jane@example.com',
      sport: 'NBA',
      niche: 'Player props',
      proofCount: 5,
    });

    await expect(
      t.mutation(api.applications.submit, {
        name: 'Jane Again',
        handle: '@janedoe2',
        email: 'jane@example.com',
        sport: 'NFL',
        niche: 'Spreads',
        proofCount: 3,
      }),
    ).rejects.toThrow('Application already submitted');
  });
});
