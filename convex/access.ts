import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { pickAccess } from './shared/validators';
import { requireCreatorOwnership } from './shared/permissions';

const integrationAccess = v.union(v.literal('public'), v.literal('subscriber'), v.literal('vip'));

/** Creator access settings + tier feature matrix for the studio UI. */
export const getByCreator = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) return null;

    const tiers = await ctx.db
      .query('pricingTiers')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .order('asc')
      .take(50);

    return {
      defaultPickAccess: creator.defaultPickAccess ?? 'premium',
      integrations: {
        telegram: {
          enabled: creator.integrationsTelegramEnabled ?? false,
          minAccess: creator.integrationsTelegramMinAccess ?? 'subscriber',
        },
        discord: {
          enabled: creator.integrationsDiscordEnabled ?? false,
          minAccess: creator.integrationsDiscordMinAccess ?? 'vip',
        },
      },
      tiers: tiers
        .filter((t) => !t.archived)
        .map((t) => ({
          id: t._id,
          name: t.name,
          legacyPlan: t.legacyPlan,
          perks: t.perks,
        })),
    };
  },
});

export const update = mutation({
  args: {
    creatorId: v.id('creators'),
    defaultPickAccess: v.optional(pickAccess),
    integrationsTelegramEnabled: v.optional(v.boolean()),
    integrationsDiscordEnabled: v.optional(v.boolean()),
    integrationsTelegramMinAccess: v.optional(integrationAccess),
    integrationsDiscordMinAccess: v.optional(integrationAccess),
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);
    const { creatorId, ...patch } = args;
    await ctx.db.patch(creatorId, patch);
    return creatorId;
  },
});
