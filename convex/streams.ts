import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { requireCreatorOwnership } from './shared/permissions';

// =============================================================================
// Streams (PRD M13, Phase 7) — creator-set stream metadata. Live-status
// detection via platform APIs is deferred; the UI shows the embed whenever
// a creator has set their handle.
// =============================================================================

export const setStream = mutation({
  args: {
    creatorId: v.id('creators'),
    platform: v.optional(
      v.union(v.literal('twitch'), v.literal('youtube'), v.literal('kick')),
    ),
    handle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);

    await ctx.db.patch(args.creatorId, {
      streamPlatform: args.platform,
      streamHandle: args.handle,
    });
    return args.creatorId;
  },
});
