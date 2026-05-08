import { query } from './_generated/server';
import { v } from 'convex/values';
import { listingType } from './shared/validators';

// =============================================================================
// Search Module — Full-text search via Convex search indexes
// =============================================================================

export const searchListings = query({
  args: {
    query: v.string(),
    type: v.optional(listingType),
    municipality: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('listings')
      .withSearchIndex('search_listings', (search) => {
        let builder = search
          .search('title', args.query)
          .eq('status', 'published');
        if (args.type) {
          builder = builder.eq('type', args.type);
        }
        if (args.municipality) {
          builder = builder.eq('municipality', args.municipality);
        }
        return builder;
      })
      .take(50);
  },
});
