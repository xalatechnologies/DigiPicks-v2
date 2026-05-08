import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { listingType } from './shared/validators';

// =============================================================================
// Categories Module
// =============================================================================

/** List categories by type. Bounded to 100. */
export const list = query({
  args: { type: v.optional(listingType) },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query('categories')
        .withIndex('by_type', (q) => q.eq('type', args.type!))
        .take(100);
    }
    return await ctx.db.query('categories').take(100);
  },
});

/** Idempotent seed of default categories. */
export const seedDefaultCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const categories = [
      { type: 'torget' as const, name: 'Møbler', slug: 'mobler', sortOrder: 10 },
      { type: 'torget' as const, name: 'Elektronikk', slug: 'elektronikk', sortOrder: 20 },
      { type: 'vehicle' as const, name: 'Bil', slug: 'bil', sortOrder: 10 },
      { type: 'vehicle' as const, name: 'Motorsykkel', slug: 'motorsykkel', sortOrder: 20 },
      { type: 'property' as const, name: 'Bolig til salgs', slug: 'bolig-til-salgs', sortOrder: 10 },
      { type: 'property' as const, name: 'Bolig til leie', slug: 'bolig-til-leie', sortOrder: 20 },
      { type: 'job' as const, name: 'Fulltid', slug: 'fulltid', sortOrder: 10 },
      { type: 'job' as const, name: 'Deltid', slug: 'deltid', sortOrder: 20 },
      { type: 'travel' as const, name: 'Billetter', slug: 'billetter', sortOrder: 10 },
      { type: 'travel' as const, name: 'Pakkereiser', slug: 'pakkereiser', sortOrder: 20 },
    ];

    for (const category of categories) {
      const existing = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', category.slug))
        .unique();

      if (!existing) {
        await ctx.db.insert('categories', {
          ...category,
          parentId: undefined,
          isActive: true,
        });
      }
    }
    return true;
  },
});
