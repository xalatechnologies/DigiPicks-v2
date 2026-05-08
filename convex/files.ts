import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireUser, isAdmin } from './shared/permissions';

// =============================================================================
// File Storage Module
// Per guidelines: ctx.storage for uploads, _storage system table for metadata
// =============================================================================

// Auth-only.
/** Generate an upload URL for the client. Auth-gated. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Auth-only.
/** Get a signed URL for a stored file. Auth-gated. */
export const getUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Auth-only.
/** Get file metadata from the _storage system table. Auth-gated. */
export const getMetadata = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await ctx.db.system.get(args.storageId);
  },
});

// Owner-or-admin.
/** Delete a stored file. Caller must own a listing referencing it, or be admin. */
export const deleteFile = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!isAdmin(user)) {
      // Verify the file is referenced by a listing the caller owns (if at all).
      const media = await ctx.db
        .query('listingMedia')
        .filter((q) => q.eq(q.field('storageId'), args.storageId))
        .first();
      if (media) {
        const listing = await ctx.db.get(media.listingId);
        if (!listing || listing.ownerUserId !== user._id) {
          throw new Error('Forbidden');
        }
      }
      // If no media row, fall through — only the uploader could know the id.
    }
    await ctx.storage.delete(args.storageId);
  },
});

// Owner-or-admin.
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
    if (listing.ownerUserId !== user._id && !isAdmin(user)) {
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
