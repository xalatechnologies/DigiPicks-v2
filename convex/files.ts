import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireUser } from './shared/permissions';

// =============================================================================
// File Storage Module
// Per guidelines: ctx.storage for uploads, _storage system table for metadata
// =============================================================================

/** Generate an upload URL for the client. Auth-gated. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Get a signed URL for a stored file. */
export const getUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/** Get file metadata from the _storage system table. */
export const getMetadata = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    return await ctx.db.system.get(args.storageId);
  },
});

/** Delete a stored file. Auth-gated. */
export const deleteFile = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.storage.delete(args.storageId);
  },
});

/**
 * Attach a stored file to a listing as media.
 * Called after successful upload.
 */
export const attachToListing = mutation({
  args: {
    listingId: v.id('listings'),
    storageId: v.id('_storage'),
    altText: v.optional(v.string()),
    isPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error('Listing not found');
    if (listing.ownerUserId !== user._id && user.role !== 'super_admin') {
      throw new Error('Forbidden');
    }

    // Count existing media to set sort order
    const existingMedia = await ctx.db
      .query('listingMedia')
      .withIndex('by_listing', (q) => q.eq('listingId', args.listingId))
      .take(20);

    return await ctx.db.insert('listingMedia', {
      listingId: args.listingId,
      storageId: args.storageId,
      altText: args.altText,
      sortOrder: existingMedia.length,
      isPrimary: args.isPrimary ?? existingMedia.length === 0,
      createdAt: Date.now(),
    });
  },
});
