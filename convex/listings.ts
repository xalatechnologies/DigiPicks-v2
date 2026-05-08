import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { listingType, paymentMode } from './shared/validators';
import { requireUser, isAdmin } from './shared/permissions';
import { internal } from './_generated/api';

// =============================================================================
// Listings Module
// =============================================================================

// Public.
/** List published listings, optionally filtered by type. Bounded to 50. */
export const listPublished = query({
  args: {
    type: v.optional(listingType),
    categoryId: v.optional(v.id('categories')),
    municipality: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query('listings')
        .withIndex('by_type_and_status', (q) =>
          q.eq('type', args.type!).eq('status', 'published'),
        )
        .order('desc')
        .take(50);
    }
    return await ctx.db
      .query('listings')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(50);
  },
});

// Public.
/** Get a single listing by ID with its media. */
export const getById = query({
  args: { id: v.id('listings') },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing || listing.status !== 'published') return null;

    const media = await ctx.db
      .query('listingMedia')
      .withIndex('by_listing', (q) => q.eq('listingId', listing._id))
      .take(20);

    return { ...listing, media };
  },
});

// Auth-only.
/** Create a draft listing. Auth-gated. ownerUserId derived from session. */
export const createDraft = mutation({
  args: {
    type: listingType,
    categoryId: v.id('categories'),
    title: v.string(),
    description: v.string(),
    paymentMode,
    priceAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    locationName: v.optional(v.string()),
    municipality: v.optional(v.string()),
    county: v.optional(v.string()),
    country: v.optional(v.string()),
    attributes: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const slug = args.title
      .toLowerCase()
      .trim()
      .replaceAll(' ', '-')
      .replace(/[^a-z0-9\-æøå]/gi, '');

    const listingId = await ctx.db.insert('listings', {
      ownerUserId: user._id,
      type: args.type,
      categoryId: args.categoryId,
      title: args.title,
      slug: `${slug}-${now}`,
      description: args.description,
      status: 'draft',
      paymentMode: args.paymentMode,
      priceAmount: args.priceAmount,
      currency: args.currency ?? 'NOK',
      locationName: args.locationName,
      municipality: args.municipality,
      county: args.county,
      country: args.country ?? 'Norway',
      attributes: args.attributes,
      isFeatured: false,
      viewCount: 0,
      favoriteCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // W9 fix: defer audit to scheduled function — don't extend txn read/write set
    await ctx.scheduler.runAfter(0, internal.audit.log, {
      actorUserId: user._id,
      entityType: 'listing',
      entityId: listingId,
      action: 'listing.created',
    });

    return listingId;
  },
});

// Owner-or-admin.
/** Publish a listing. Ownership-gated. */
export const publish = mutation({
  args: { id: v.id('listings') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const listing = await ctx.db.get(args.id);
    if (!listing) throw new Error('Listing not found');
    if (listing.ownerUserId !== user._id && !isAdmin(user)) {
      throw new Error('Forbidden');
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: 'published',
      publishedAt: now,
      updatedAt: now,
    });

    // W9 fix: defer audit to scheduled function
    await ctx.scheduler.runAfter(0, internal.audit.log, {
      actorUserId: user._id,
      entityType: 'listing',
      entityId: args.id,
      action: 'listing.published',
    });

    return args.id;
  },
});
