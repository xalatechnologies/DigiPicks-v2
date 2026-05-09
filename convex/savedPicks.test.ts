/// <reference types="vite/client" />
import { convexTest } from './__tests__/setup';
import { describe, expect, test } from 'vitest';
import { api, internal } from './_generated/api';
import schema from './schema';
import type { Id } from './_generated/dataModel';

const modules = import.meta.glob('./**/*.ts');

// Shared test fixture: an authenticated user, a creator, and a published pick.
async function fixture(t: ReturnType<typeof convexTest>) {
  const creatorId = await t.mutation(internal.creators.create, {
    handle: '@picksaver',
    name: 'Pick Saver',
    avatarColor: '#1c9cf0',
    avatarMono: 'PS',
    niche: 'NFL',
    sports: ['NFL'],
    bio: 'For testing saves.',
    startingPrice: 19,
    tags: ['NFL'],
  });

  const subscriberId = await t.run(async (ctx) => {
    return await ctx.db.insert('users', { role: 'user', isActive: true });
  });

  const ownerUserId = await t.run(async (ctx) => {
    return await ctx.db.insert('users', {
      role: 'user',
      isActive: true,
      creatorId,
    });
  });

  const pickId: Id<'picks'> = await t
    .withIdentity({ subject: ownerUserId })
    .mutation(api.picks.create, {
      creatorId,
      access: 'free',
      sport: 'Football',
      league: 'NFL',
      eventName: 'Game',
      eventTime: '8 PM ET',
      title: 'Test pick',
      market: 'Spread',
      selection: 'Home -3',
      odds: '-110',
      units: '1u',
      confidence: 'High',
      status: 'published',
    });

  return { creatorId, subscriberId, ownerUserId, pickId };
}

describe('savedPicks', () => {
  test('save is idempotent — repeated saves return the same row', async () => {
    const t = convexTest(schema, modules);
    const { subscriberId, pickId } = await fixture(t);
    const asUser = t.withIdentity({ subject: subscriberId });

    const first = await asUser.mutation(api.savedPicks.save, { pickId });
    const second = await asUser.mutation(api.savedPicks.save, { pickId });
    expect(second).toBe(first);

    const list = await asUser.query(api.savedPicks.list, {});
    expect(list.length).toBe(1);
  });

  test('unsave is a no-op when the pick was never saved', async () => {
    const t = convexTest(schema, modules);
    const { subscriberId, pickId } = await fixture(t);
    const asUser = t.withIdentity({ subject: subscriberId });

    const result = await asUser.mutation(api.savedPicks.unsave, { pickId });
    expect(result).toEqual({ ok: true });

    const list = await asUser.query(api.savedPicks.list, {});
    expect(list.length).toBe(0);
  });

  test('isSaved + savedIdsBatch reflect save / unsave round-trip', async () => {
    const t = convexTest(schema, modules);
    const { subscriberId, pickId } = await fixture(t);
    const asUser = t.withIdentity({ subject: subscriberId });

    expect(await asUser.query(api.savedPicks.isSaved, { pickId })).toBe(false);
    await asUser.mutation(api.savedPicks.save, { pickId });
    expect(await asUser.query(api.savedPicks.isSaved, { pickId })).toBe(true);

    const batch = await asUser.query(api.savedPicks.savedIdsBatch, {
      pickIds: [pickId],
    });
    expect(batch[pickId]).toBe(true);

    await asUser.mutation(api.savedPicks.unsave, { pickId });
    expect(await asUser.query(api.savedPicks.isSaved, { pickId })).toBe(false);
  });

  test('savedIdsBatch returns false for picks not saved by the user', async () => {
    const t = convexTest(schema, modules);
    const { subscriberId, pickId } = await fixture(t);
    const asUser = t.withIdentity({ subject: subscriberId });

    const batch = await asUser.query(api.savedPicks.savedIdsBatch, {
      pickIds: [pickId],
    });
    expect(batch[pickId]).toBe(false);
  });

  test('list joins pick + creator and is scoped to the caller', async () => {
    const t = convexTest(schema, modules);
    const { subscriberId, pickId } = await fixture(t);
    const asUser = t.withIdentity({ subject: subscriberId });
    await asUser.mutation(api.savedPicks.save, { pickId });

    const otherUserId = await t.run(async (ctx) => {
      return await ctx.db.insert('users', { role: 'user', isActive: true });
    });

    const otherList = await t
      .withIdentity({ subject: otherUserId })
      .query(api.savedPicks.list, {});
    expect(otherList.length).toBe(0);

    const myList = await asUser.query(api.savedPicks.list, {});
    expect(myList.length).toBe(1);
    expect(myList[0].pick._id).toBe(pickId);
    expect(myList[0].creator?.handle).toBe('@picksaver');
  });

  test('save / unsave / isSaved reject unauthenticated callers', async () => {
    const t = convexTest(schema, modules);
    const { pickId } = await fixture(t);

    await expect(t.mutation(api.savedPicks.save, { pickId })).rejects.toThrow();
    await expect(
      t.mutation(api.savedPicks.unsave, { pickId }),
    ).rejects.toThrow();
    await expect(
      t.query(api.savedPicks.isSaved, { pickId }),
    ).rejects.toThrow();
  });
});
