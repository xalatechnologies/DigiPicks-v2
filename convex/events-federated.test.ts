/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { api, internal } from './_generated/api';
import schema from './schema';
import type { Id } from './_generated/dataModel';

const modules = import.meta.glob('./**/*.ts');

async function setup(t: ReturnType<typeof convexTest>) {
  const creatorId = await t.mutation(internal.creators.create, {
    handle: '@evcreator',
    name: 'Event Creator',
    avatarColor: '#1c9cf0',
    avatarMono: 'EC',
    niche: 'Cricket',
    sports: ['Cricket'],
    bio: 'fixture',
    startingPrice: 12,
    tags: ['Cricket'],
  });
  const ownerUserId = await t.run(async (ctx) =>
    ctx.db.insert('users', { role: 'user', isActive: true, creatorId }),
  );
  const adminId = await t.run(async (ctx) =>
    ctx.db.insert('users', { role: 'admin', isActive: true }),
  );
  return { creatorId, ownerUserId, adminId };
}

describe('events.createByCreator', () => {
  test('inserts a creator-submitted event with federated defaults', async () => {
    const t = convexTest(schema, modules);
    const { creatorId, ownerUserId } = await setup(t);

    const eventId: Id<'events'> = await t
      .withIdentity({ subject: ownerUserId })
      .mutation(api.events.createByCreator, {
        sport: 'Cricket',
        league: 'Norway Cricket League',
        home: 'Oslo',
        away: 'Bergen',
        time: '6 PM CET',
        startsAt: Date.now() + 86_400_000,
      });

    const event = await t.run(async (ctx) => ctx.db.get(eventId));
    expect(event?.sourceType).toBe('creator');
    expect(event?.verificationStatus).toBe('creator_submitted');
    expect(event?.resultSource).toBe('manual_creator');
    expect(event?.visibility).toBe('public');
    expect(event?.createdByUserId).toBe(ownerUserId);
    expect(event?.title).toBe('Oslo vs Bergen');
    expect(event?.participants).toEqual([
      { name: 'Oslo', type: 'team' },
      { name: 'Bergen', type: 'team' },
    ]);

    // Pending creator events are hidden from the public today() feed.
    const today = await t.query(api.events.today, {});
    expect(today.length).toBe(0);
  });

  test('rejects users with no creator profile', async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) =>
      ctx.db.insert('users', { role: 'user', isActive: true }),
    );

    await expect(
      t.withIdentity({ subject: userId }).mutation(api.events.createByCreator, {
        sport: 'Cricket',
        league: 'Norway',
        home: 'A',
        away: 'B',
        time: '6 PM',
        startsAt: Date.now() + 86_400_000,
      }),
    ).rejects.toThrow();
  });
});

describe('events.reviewEvent', () => {
  async function submitted(t: ReturnType<typeof convexTest>) {
    const { creatorId, ownerUserId, adminId } = await setup(t);
    const eventId: Id<'events'> = await t
      .withIdentity({ subject: ownerUserId })
      .mutation(api.events.createByCreator, {
        sport: 'Cricket',
        league: 'Norway',
        home: 'Oslo',
        away: 'Bergen',
        time: '6 PM CET',
        startsAt: Date.now() + 86_400_000,
      });
    return { creatorId, ownerUserId, adminId, eventId };
  }

  test('approve flips verificationStatus to admin_verified and surfaces publicly', async () => {
    const t = convexTest(schema, modules);
    const { adminId, eventId } = await submitted(t);

    await t
      .withIdentity({ subject: adminId })
      .mutation(api.events.reviewEvent, {
        eventId,
        decision: 'approve',
      });

    const event = await t.run(async (ctx) => ctx.db.get(eventId));
    expect(event?.verificationStatus).toBe('admin_verified');
    expect(event?.reviewedByAdminId).toBe(adminId);
    expect(event?.status).not.toBe('cancelled');

    const today = await t.query(api.events.today, {});
    expect(today.length).toBe(1);
  });

  test('reject sets verificationStatus to unverified and status cancelled', async () => {
    const t = convexTest(schema, modules);
    const { adminId, eventId } = await submitted(t);

    await t
      .withIdentity({ subject: adminId })
      .mutation(api.events.reviewEvent, {
        eventId,
        decision: 'reject',
        notes: 'duplicate of upstream',
      });

    const event = await t.run(async (ctx) => ctx.db.get(eventId));
    expect(event?.verificationStatus).toBe('unverified');
    expect(event?.status).toBe('cancelled');
    expect(event?.metadata?.reviewNotes).toBe('duplicate of upstream');

    const today = await t.query(api.events.today, {});
    expect(today.length).toBe(0);
  });

  test('non-admins cannot review', async () => {
    const t = convexTest(schema, modules);
    const { ownerUserId, eventId } = await submitted(t);

    await expect(
      t.withIdentity({ subject: ownerUserId }).mutation(api.events.reviewEvent, {
        eventId,
        decision: 'approve',
      }),
    ).rejects.toThrow();
  });
});

describe('events.byCreator + pendingReview', () => {
  test('byCreator scopes to the calling creator', async () => {
    const t = convexTest(schema, modules);
    const { ownerUserId } = await setup(t);
    const asOwner = t.withIdentity({ subject: ownerUserId });

    await asOwner.mutation(api.events.createByCreator, {
      sport: 'Cricket',
      league: 'Norway',
      home: 'A',
      away: 'B',
      time: '6 PM',
      startsAt: Date.now() + 1,
    });
    await asOwner.mutation(api.events.createByCreator, {
      sport: 'Cricket',
      league: 'Norway',
      home: 'C',
      away: 'D',
      time: '6 PM',
      startsAt: Date.now() + 2,
    });

    const mine = await asOwner.query(api.events.byCreator, {});
    expect(mine.length).toBe(2);
  });

  test('pendingReview only returns creator_submitted events', async () => {
    const t = convexTest(schema, modules);
    const { ownerUserId, adminId } = await setup(t);
    const asOwner = t.withIdentity({ subject: ownerUserId });
    const asAdmin = t.withIdentity({ subject: adminId });

    const e1: Id<'events'> = await asOwner.mutation(
      api.events.createByCreator,
      {
        sport: 'Cricket',
        league: 'Norway',
        home: 'A',
        away: 'B',
        time: '6 PM',
        startsAt: Date.now() + 1,
      },
    );
    const e2: Id<'events'> = await asOwner.mutation(
      api.events.createByCreator,
      {
        sport: 'Cricket',
        league: 'Norway',
        home: 'C',
        away: 'D',
        time: '6 PM',
        startsAt: Date.now() + 2,
      },
    );

    // Approve one — it should drop out of pendingReview.
    await asAdmin.mutation(api.events.reviewEvent, {
      eventId: e1,
      decision: 'approve',
    });

    const pending = await asAdmin.query(api.events.pendingReview, {});
    expect(pending.map((p) => p._id)).toEqual([e2]);
  });

  test('pendingReview rejects non-admins', async () => {
    const t = convexTest(schema, modules);
    const { ownerUserId } = await setup(t);

    await expect(
      t.withIdentity({ subject: ownerUserId }).query(api.events.pendingReview, {}),
    ).rejects.toThrow();
  });
});

describe('migrations.backfillFederatedEvents', () => {
  test('backfills provider defaults onto rows with externalId; platform defaults otherwise', async () => {
    const t = convexTest(schema, modules);

    // Two pre-migration shaped rows: one with externalId (provider), one
    // without (legacy platform/seed).
    const providerEventId = await t.run(async (ctx) =>
      ctx.db.insert('events', {
        sport: 'Soccer',
        league: 'EPL',
        home: 'A',
        away: 'B',
        time: '5 PM',
        startsAt: Date.now() + 1000,
        creatorCount: 0,
        pickCount: 0,
        featured: false,
        status: 'upcoming',
        externalId: 'odds_api_xyz',
      }),
    );
    const platformEventId = await t.run(async (ctx) =>
      ctx.db.insert('events', {
        sport: 'Cricket',
        league: 'Norway',
        home: 'X',
        away: 'Y',
        time: '6 PM',
        startsAt: Date.now() + 2000,
        creatorCount: 0,
        pickCount: 0,
        featured: false,
        status: 'upcoming',
      }),
    );

    await t.mutation(internal.migrations.backfillFederatedEvents, {});

    const provider = await t.run(async (ctx) => ctx.db.get(providerEventId));
    expect(provider?.sourceType).toBe('provider');
    expect(provider?.providerName).toBe('the-odds-api');
    expect(provider?.verificationStatus).toBe('source_verified');

    const platform = await t.run(async (ctx) => ctx.db.get(platformEventId));
    expect(platform?.sourceType).toBe('platform');
    expect(platform?.verificationStatus).toBe('admin_verified');
    expect(platform?.providerName).toBeUndefined();
  });

  test('is idempotent — re-runs do not overwrite already-federated rows', async () => {
    const t = convexTest(schema, modules);
    const eventId = await t.run(async (ctx) =>
      ctx.db.insert('events', {
        sport: 'Cricket',
        league: 'Norway',
        home: 'A',
        away: 'B',
        time: '6 PM',
        startsAt: Date.now() + 1,
        creatorCount: 0,
        pickCount: 0,
        featured: false,
        status: 'upcoming',
        sourceType: 'creator',
        verificationStatus: 'admin_verified',
        title: 'preserved',
      }),
    );

    await t.mutation(internal.migrations.backfillFederatedEvents, {});

    const event = await t.run(async (ctx) => ctx.db.get(eventId));
    expect(event?.sourceType).toBe('creator');
    expect(event?.verificationStatus).toBe('admin_verified');
    expect(event?.title).toBe('preserved');
  });
});
