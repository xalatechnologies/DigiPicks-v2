import { v } from 'convex/values';
import {
  internalMutation,
  mutation,
  query,
} from './_generated/server';
import { requireCreatorOwnership } from './shared/permissions';

// =============================================================================
// Pricing Tiers (PRD M5, Phase 10).
//
// Replaces the hardcoded 'free'|'premium'|'vip' enum with first-class tier
// rows that creators can edit. Subscriptions still carry their legacy
// `plan` for back-compat; new subs reference `tierId` via metadata.
// =============================================================================

const tierInterval = v.union(
  v.literal('month'),
  v.literal('year'),
  v.literal('once'),
);

/** Public list of active tiers for a creator, in sort order. */
export const byCreator = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('pricingTiers')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .order('asc')
      .take(50);
    return rows.filter((t) => !t.archived);
  },
});

/** Single tier lookup — used by checkout to resolve a tierId. */
export const get = query({
  args: { id: v.id('pricingTiers') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Creator-only: create a new tier. Sort order auto-increments. */
export const create = mutation({
  args: {
    creatorId: v.id('creators'),
    name: v.string(),
    priceCents: v.number(),
    interval: tierInterval,
    perks: v.array(v.string()),
    stripePriceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);

    const existing = await ctx.db
      .query('pricingTiers')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .take(50);
    const sortOrder = existing.length;

    return await ctx.db.insert('pricingTiers', {
      creatorId: args.creatorId,
      name: args.name,
      priceCents: args.priceCents,
      interval: args.interval,
      perks: args.perks,
      stripePriceId: args.stripePriceId,
      archived: false,
      sortOrder,
      createdAt: Date.now(),
    });
  },
});

/** Creator-only: edit tier name / perks / Stripe link. */
export const update = mutation({
  args: {
    tierId: v.id('pricingTiers'),
    name: v.optional(v.string()),
    priceCents: v.optional(v.number()),
    interval: v.optional(tierInterval),
    perks: v.optional(v.array(v.string())),
    stripePriceId: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tier = await ctx.db.get(args.tierId);
    if (!tier) throw new Error('Tier not found');
    await requireCreatorOwnership(ctx, tier.creatorId);

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.priceCents !== undefined) patch.priceCents = args.priceCents;
    if (args.interval !== undefined) patch.interval = args.interval;
    if (args.perks !== undefined) patch.perks = args.perks;
    if (args.stripePriceId !== undefined) patch.stripePriceId = args.stripePriceId;
    if (args.sortOrder !== undefined) patch.sortOrder = args.sortOrder;

    if (Object.keys(patch).length > 0) await ctx.db.patch(args.tierId, patch);
    return args.tierId;
  },
});

/** Creator-only: archive (soft-delete) a tier. */
export const archive = mutation({
  args: { tierId: v.id('pricingTiers') },
  handler: async (ctx, args) => {
    const tier = await ctx.db.get(args.tierId);
    if (!tier) throw new Error('Tier not found');
    await requireCreatorOwnership(ctx, tier.creatorId);
    await ctx.db.patch(args.tierId, { archived: true });
    return args.tierId;
  },
});

// =============================================================================
// Default tier seeding — idempotent. Called from creators.get / list on the
// fly so existing creators get a Free + Premium + VIP tier the first time
// anyone reads them post-deploy. Maps legacy stripePriceId fields.
// =============================================================================

interface TierDefault {
  legacyPlan: 'free' | 'premium' | 'vip';
  name: string;
  priceCents: number;
  perks: string[];
}

const DEFAULT_TIERS: TierDefault[] = [
  {
    legacyPlan: 'free',
    name: 'Free',
    priceCents: 0,
    perks: ['Public picks', 'Public community channels'],
  },
  {
    legacyPlan: 'premium',
    name: 'Premium',
    priceCents: 0, // patched from creator.startingPrice when seeding
    perks: ['Premium picks', 'Subscriber-only chat', 'New-pick alerts'],
  },
  {
    legacyPlan: 'vip',
    name: 'VIP',
    priceCents: 0,
    perks: ['Everything in Premium', 'VIP channels', 'Direct DMs with the creator'],
  },
];

export const _ensureDefaultsForCreator = internalMutation({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('pricingTiers')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .take(10);
    if (existing.length > 0) return { seeded: false as const, count: existing.length };

    const creator = await ctx.db.get(args.creatorId);
    if (!creator) return { seeded: false as const, count: 0 };

    const premiumPriceCents = Math.round((creator.startingPrice ?? 29) * 100);
    const vipPriceCents = premiumPriceCents * 2;

    let sort = 0;
    for (const t of DEFAULT_TIERS) {
      const priceCents =
        t.legacyPlan === 'free'
          ? 0
          : t.legacyPlan === 'premium'
            ? premiumPriceCents
            : vipPriceCents;
      const stripePriceId =
        t.legacyPlan === 'premium'
          ? creator.stripePriceIdPremium
          : t.legacyPlan === 'vip'
            ? creator.stripePriceIdVip
            : undefined;

      await ctx.db.insert('pricingTiers', {
        creatorId: args.creatorId,
        name: t.name,
        priceCents,
        interval: 'month',
        perks: t.perks,
        stripePriceId,
        archived: false,
        sortOrder: sort++,
        legacyPlan: t.legacyPlan,
        createdAt: Date.now(),
      });
    }
    return { seeded: true as const, count: sort };
  },
});

