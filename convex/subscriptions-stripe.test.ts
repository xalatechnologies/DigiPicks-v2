/// <reference types="vite/client" />
import { convexTest } from './__tests__/setup.test';
import { describe, expect, test } from 'vitest';
import { api, internal } from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

async function setup(t: ReturnType<typeof convexTest>) {
  const creatorId = await t.mutation(internal.creators.create, {
    handle: '@stripecreator',
    name: 'Stripe Creator',
    avatarColor: '#1c9cf0',
    avatarMono: 'SC',
    niche: 'NFL',
    sports: ['NFL'],
    bio: 'fixture',
    startingPrice: 19,
    tags: ['NFL'],
  });
  const subscriberId = await t.run(async (ctx) =>
    ctx.db.insert('users', { role: 'user', isActive: true }),
  );
  return { creatorId, subscriberId };
}

describe('subscriptions Stripe webhook callbacks', () => {
  test('_recordSubscriptionFromStripe inserts a new active subscription', async () => {
    const t = convexTest(schema, modules);
    const { creatorId, subscriberId } = await setup(t);

    await t.mutation(internal.subscriptions._recordSubscriptionFromStripe, {
      subscriberId,
      creatorId,
      plan: 'premium',
      stripeSubscriptionId: 'sub_test_001',
      stripeCustomerId: 'cus_test_001',
      status: 'active',
      renewsAt: Date.now() + 30 * 86_400_000,
    });

    const subs = await t.run(async (ctx) =>
      ctx.db
        .query('subscriptions')
        .withIndex('by_creator', (q) => q.eq('creatorId', creatorId))
        .take(10),
    );
    expect(subs.length).toBe(1);
    expect(subs[0].status).toBe('active');
    expect(subs[0].plan).toBe('premium');
    expect(subs[0].stripeSubscriptionId).toBe('sub_test_001');
  });

  test('_recordSubscriptionFromStripe is idempotent on retries', async () => {
    const t = convexTest(schema, modules);
    const { creatorId, subscriberId } = await setup(t);

    await t.mutation(internal.subscriptions._recordSubscriptionFromStripe, {
      subscriberId,
      creatorId,
      plan: 'premium',
      stripeSubscriptionId: 'sub_dup',
      stripeCustomerId: 'cus_dup',
      status: 'active',
    });
    await t.mutation(internal.subscriptions._recordSubscriptionFromStripe, {
      subscriberId,
      creatorId,
      plan: 'vip',
      stripeSubscriptionId: 'sub_dup',
      stripeCustomerId: 'cus_dup',
      status: 'active',
    });

    const subs = await t.run(async (ctx) =>
      ctx.db
        .query('subscriptions')
        .withIndex('by_creator', (q) => q.eq('creatorId', creatorId))
        .take(10),
    );
    expect(subs.length).toBe(1);
    // Second call updates plan to vip on the existing row.
    expect(subs[0].plan).toBe('vip');
  });

  test('_updateSubscriptionStatusFromStripe transitions status without inserting', async () => {
    const t = convexTest(schema, modules);
    const { creatorId, subscriberId } = await setup(t);

    await t.mutation(internal.subscriptions._recordSubscriptionFromStripe, {
      subscriberId,
      creatorId,
      plan: 'premium',
      stripeSubscriptionId: 'sub_pd',
      stripeCustomerId: 'cus_pd',
      status: 'active',
    });

    await t.mutation(internal.subscriptions._updateSubscriptionStatusFromStripe, {
      stripeSubscriptionId: 'sub_pd',
      status: 'past_due',
    });

    const subs = await t.run(async (ctx) =>
      ctx.db.query('subscriptions').take(10),
    );
    expect(subs.length).toBe(1);
    expect(subs[0].status).toBe('past_due');
  });

  test('_updateSubscriptionStatusFromStripe is a no-op for unknown subs', async () => {
    const t = convexTest(schema, modules);

    const result = await t.mutation(
      internal.subscriptions._updateSubscriptionStatusFromStripe,
      {
        stripeSubscriptionId: 'sub_does_not_exist',
        status: 'past_due',
      },
    );
    expect(result).toBeNull();
  });

  test('_cancelSubscriptionFromStripe sets status cancelled + cancelledAt', async () => {
    const t = convexTest(schema, modules);
    const { creatorId, subscriberId } = await setup(t);

    await t.mutation(internal.subscriptions._recordSubscriptionFromStripe, {
      subscriberId,
      creatorId,
      plan: 'premium',
      stripeSubscriptionId: 'sub_cancel',
      stripeCustomerId: 'cus_cancel',
      status: 'active',
    });

    await t.mutation(internal.subscriptions._cancelSubscriptionFromStripe, {
      stripeSubscriptionId: 'sub_cancel',
    });

    const sub = await t.run(async (ctx) =>
      ctx.db
        .query('subscriptions')
        .withIndex('by_stripeSubscriptionId', (q) =>
          q.eq('stripeSubscriptionId', 'sub_cancel'),
        )
        .first(),
    );
    expect(sub?.status).toBe('cancelled');
    expect(sub?.cancelledAt).toBeGreaterThan(0);
  });
});

describe('payouts', () => {
  async function makeCreator(t: ReturnType<typeof convexTest>) {
    const creatorId = await t.mutation(internal.creators.create, {
      handle: '@payee',
      name: 'Payee',
      avatarColor: '#1c9cf0',
      avatarMono: 'PY',
      niche: 'NFL',
      sports: ['NFL'],
      bio: 'fixture',
      startingPrice: 19,
      tags: ['NFL'],
    });
    const ownerUserId = await t.run(async (ctx) =>
      ctx.db.insert('users', { role: 'user', isActive: true, creatorId }),
    );
    return { creatorId, ownerUserId };
  }

  test('_recordPayoutFromStripe inserts and is idempotent on stripePayoutId', async () => {
    const t = convexTest(schema, modules);
    const { creatorId } = await makeCreator(t);

    await t.mutation(internal.payouts._recordPayoutFromStripe, {
      creatorId,
      amount: 19.0,
      currency: 'USD',
      status: 'paid',
      stripePayoutId: 'in_test_001',
      periodStart: 1_700_000_000_000,
      periodEnd: 1_702_500_000_000,
      paidAt: 1_702_600_000_000,
    });
    // Repeat (Stripe retries deliver the same event id).
    await t.mutation(internal.payouts._recordPayoutFromStripe, {
      creatorId,
      amount: 19.0,
      currency: 'USD',
      status: 'paid',
      stripePayoutId: 'in_test_001',
      periodStart: 1_700_000_000_000,
      periodEnd: 1_702_500_000_000,
    });

    const rows = await t.run(async (ctx) =>
      ctx.db.query('payouts').take(10),
    );
    expect(rows.length).toBe(1);
  });

  test('byMe + summary aggregate the calling creator’s payouts', async () => {
    const t = convexTest(schema, modules);
    const { creatorId, ownerUserId } = await makeCreator(t);
    const asOwner = t.withIdentity({ subject: ownerUserId });

    await t.mutation(internal.payouts._recordPayoutFromStripe, {
      creatorId,
      amount: 19,
      currency: 'USD',
      status: 'paid',
      stripePayoutId: 'in_001',
      periodStart: 1,
      periodEnd: 2,
      paidAt: 3,
    });
    await t.mutation(internal.payouts._recordPayoutFromStripe, {
      creatorId,
      amount: 23,
      currency: 'USD',
      status: 'pending',
      stripePayoutId: 'in_002',
      periodStart: 4,
      periodEnd: 5,
    });

    const list = await asOwner.query(api.payouts.byMe, {});
    expect(list.length).toBe(2);

    const summary = await asOwner.query(api.payouts.summary, {});
    expect(summary.paidTotal).toBe(19);
    expect(summary.pendingTotal).toBe(23);
    expect(summary.count).toBe(2);
    expect(summary.currency).toBe('USD');
  });

  test('byMe rejects users without a creator profile', async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) =>
      ctx.db.insert('users', { role: 'user', isActive: true }),
    );

    await expect(
      t.withIdentity({ subject: userId }).query(api.payouts.byMe, {}),
    ).rejects.toThrow();
  });
});
