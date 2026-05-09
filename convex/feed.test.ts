/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { api, internal } from './_generated/api';
import schema from './schema';
import type { Id } from './_generated/dataModel';

const modules = import.meta.glob('./**/*.ts');

async function makeCreator(
  t: ReturnType<typeof convexTest>,
  handle: string,
  sport: string,
): Promise<{ creatorId: Id<'creators'>; ownerId: Id<'users'> }> {
  const creatorId = await t.mutation(internal.creators.create, {
    handle,
    name: handle,
    avatarColor: '#1c9cf0',
    avatarMono: handle.slice(1, 3).toUpperCase(),
    niche: sport,
    sports: [sport],
    bio: 'fixture',
    startingPrice: 10,
    tags: [sport],
  });
  const ownerId = await t.run(async (ctx) =>
    ctx.db.insert('users', { role: 'user', isActive: true, creatorId }),
  );
  return { creatorId, ownerId };
}

async function publishPick(
  t: ReturnType<typeof convexTest>,
  ownerId: Id<'users'>,
  creatorId: Id<'creators'>,
  title: string,
  sport: string,
) {
  return await t.withIdentity({ subject: ownerId }).mutation(api.picks.create, {
    creatorId,
    access: 'free',
    sport,
    league: sport,
    eventName: `${sport} game`,
    eventTime: '8 PM ET',
    title,
    market: 'Spread',
    selection: 'Home -3',
    odds: '-110',
    units: '1u',
    confidence: 'High',
    status: 'published',
  });
}

describe('feed.personalized', () => {
  test('falls back to network-wide picks when the user has no subscriptions', async () => {
    const t = convexTest(schema, modules);
    const { creatorId: cA, ownerId: oA } = await makeCreator(t, '@a', 'NFL');
    const { creatorId: cB, ownerId: oB } = await makeCreator(t, '@b', 'NBA');
    await publishPick(t, oA, cA, 'NFL pick', 'NFL');
    await publishPick(t, oB, cB, 'NBA pick', 'NBA');

    const subscriberId = await t.run(async (ctx) =>
      ctx.db.insert('users', { role: 'user', isActive: true }),
    );

    const result = await t
      .withIdentity({ subject: subscriberId })
      .query(api.feed.personalized, {});
    expect(result.personalized).toBe(false);
    expect(result.subscribedCreatorCount).toBe(0);
    expect(result.items.length).toBe(2);
  });

  test('returns only subscribed-creator picks when subscriptions exist', async () => {
    const t = convexTest(schema, modules);
    const { creatorId: cA, ownerId: oA } = await makeCreator(t, '@a', 'NFL');
    const { creatorId: cB, ownerId: oB } = await makeCreator(t, '@b', 'NBA');
    await publishPick(t, oA, cA, 'NFL pick', 'NFL');
    await publishPick(t, oB, cB, 'NBA pick', 'NBA');

    const subscriberId = await t.run(async (ctx) =>
      ctx.db.insert('users', { role: 'user', isActive: true }),
    );
    const asUser = t.withIdentity({ subject: subscriberId });

    await asUser.mutation(api.subscriptions.subscribe, {
      creatorId: cA,
      plan: 'free',
    });

    const result = await asUser.query(api.feed.personalized, {});
    expect(result.personalized).toBe(true);
    expect(result.subscribedCreatorCount).toBe(1);
    expect(result.items.map((i) => i.pick.title)).toEqual(['NFL pick']);
  });

  test('cancelled subscriptions do not personalize the feed', async () => {
    const t = convexTest(schema, modules);
    const { creatorId: cA, ownerId: oA } = await makeCreator(t, '@a', 'NFL');
    await publishPick(t, oA, cA, 'NFL pick', 'NFL');

    const subscriberId = await t.run(async (ctx) =>
      ctx.db.insert('users', { role: 'user', isActive: true }),
    );
    const asUser = t.withIdentity({ subject: subscriberId });

    await asUser.mutation(api.subscriptions.subscribe, {
      creatorId: cA,
      plan: 'free',
    });
    await asUser.mutation(api.subscriptions.cancel, { creatorId: cA });

    const result = await asUser.query(api.feed.personalized, {});
    expect(result.personalized).toBe(false);
    expect(result.subscribedCreatorCount).toBe(0);
  });

  test('sport filter narrows fallback results', async () => {
    const t = convexTest(schema, modules);
    const { creatorId: cA, ownerId: oA } = await makeCreator(t, '@a', 'NFL');
    const { creatorId: cB, ownerId: oB } = await makeCreator(t, '@b', 'NBA');
    await publishPick(t, oA, cA, 'NFL pick', 'NFL');
    await publishPick(t, oB, cB, 'NBA pick', 'NBA');

    const subscriberId = await t.run(async (ctx) =>
      ctx.db.insert('users', { role: 'user', isActive: true }),
    );

    const result = await t
      .withIdentity({ subject: subscriberId })
      .query(api.feed.personalized, { sport: 'NFL' });
    expect(result.items.map((i) => i.pick.title)).toEqual(['NFL pick']);
  });

  test('rejects unauthenticated callers', async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.feed.personalized, {})).rejects.toThrow();
  });
});
