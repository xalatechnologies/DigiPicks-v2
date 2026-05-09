import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import {
  requireUser,
  requireAdmin,
  isAdmin,
} from './shared/permissions';

// =============================================================================
// Disputes (PRD M16 / FM-011) — subscriber or creator opens a dispute on a
// graded pick; admin reviews and resolves with an outcome.
//
// Dispute lifecycle:
//   open  →  under_review  →  resolved | dismissed
// Status transitions are admin-only; the opener can add notes any time.
// =============================================================================

const disputeStatus = v.union(
  v.literal('open'),
  v.literal('under_review'),
  v.literal('resolved'),
  v.literal('dismissed'),
);

/** Open a dispute on a pick. Caller must be the pick's creator owner OR
 *  an active subscriber on that creator (or admin). */
export const open = mutation({
  args: {
    pickId: v.id('picks'),
    reason: v.string(),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const pick = await ctx.db.get(args.pickId);
    if (!pick) throw new Error('Pick not found');
    if (!pick.grade || pick.grade === 'pending') {
      throw new Error('Disputes can only be opened on graded picks');
    }

    const creatorOwner = user.creatorId === pick.creatorId;
    if (!creatorOwner && !isAdmin(user)) {
      // Non-owner non-admin must be an active subscriber.
      const sub = await ctx.db
        .query('subscriptions')
        .withIndex('by_subscriber_and_creator', (q) =>
          q.eq('subscriberId', user._id).eq('creatorId', pick.creatorId),
        )
        .first();
      if (!sub || sub.status !== 'active') {
        throw new Error('Only active subscribers (or the creator) can open a dispute');
      }
    }

    // Block duplicate open disputes from the same opener on the same pick.
    const existing = await ctx.db
      .query('disputes')
      .withIndex('by_pick', (q) => q.eq('pickId', args.pickId))
      .collect();
    const dup = existing.find(
      (d) => d.openedByUserId === user._id && d.status !== 'resolved' && d.status !== 'dismissed',
    );
    if (dup) return dup._id;

    const trimmedReason = args.reason.trim();
    if (trimmedReason.length === 0) throw new Error('Reason is required');
    if (trimmedReason.length > 500) {
      throw new Error('Reason must be under 500 characters');
    }

    const now = Date.now();
    const id = await ctx.db.insert('disputes', {
      pickId: args.pickId,
      creatorId: pick.creatorId,
      openedByUserId: user._id,
      reason: trimmedReason,
      detail: args.detail?.trim() || undefined,
      status: 'open',
      notes: [],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.audit.log, {
      actorUserId: user._id,
      entityType: 'dispute',
      entityId: id,
      action: 'dispute.opened',
      metadata: { pickId: args.pickId, reason: trimmedReason },
    });

    return id;
  },
});

/** Add a comment to a dispute. Opener, creator-owner, and admin can comment. */
export const addNote = mutation({
  args: {
    disputeId: v.id('disputes'),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error('Dispute not found');

    const isOpener = dispute.openedByUserId === user._id;
    const isCreatorOwner = user.creatorId === dispute.creatorId;
    if (!isOpener && !isCreatorOwner && !isAdmin(user)) {
      throw new Error('Forbidden');
    }

    const trimmed = args.body.trim();
    if (trimmed.length === 0) throw new Error('Note body required');
    if (trimmed.length > 2000) {
      throw new Error('Notes must be under 2000 characters');
    }

    const note = {
      authorUserId: user._id,
      body: trimmed,
      createdAt: Date.now(),
    };
    await ctx.db.patch(args.disputeId, {
      notes: [...dispute.notes, note],
      updatedAt: Date.now(),
    });
    return args.disputeId;
  },
});

/** Admin-only: move dispute through the lifecycle. */
export const transition = mutation({
  args: {
    disputeId: v.id('disputes'),
    status: disputeStatus,
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error('Dispute not found');

    const terminal = dispute.status === 'resolved' || dispute.status === 'dismissed';
    if (terminal) throw new Error('Dispute is already finalized');

    const patch: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.status === 'resolved' || args.status === 'dismissed') {
      patch.resolvedByAdminId = admin._id;
      if (args.resolution) patch.resolution = args.resolution.trim();
    }
    await ctx.db.patch(args.disputeId, patch);

    await ctx.scheduler.runAfter(0, internal.audit.log, {
      actorUserId: admin._id,
      entityType: 'dispute',
      entityId: args.disputeId,
      action: `dispute.${args.status}`,
      metadata: args.resolution ? { resolution: args.resolution } : undefined,
    });

    return args.disputeId;
  },
});

/** Public — list disputes opened by the current user. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query('disputes')
      .withIndex('by_opener', (q) => q.eq('openedByUserId', user._id))
      .order('desc')
      .take(50);
  },
});

/** Admin-only — moderation queue, optionally filtered by status. */
export const queue = query({
  args: {
    status: v.optional(disputeStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 100, 500);

    const rows = args.status
      ? await ctx.db
          .query('disputes')
          .withIndex('by_status', (q) => q.eq('status', args.status!))
          .order('desc')
          .take(limit)
      : await ctx.db.query('disputes').order('desc').take(limit);

    const enriched = await Promise.all(
      rows.map(async (d) => {
        const pick = await ctx.db.get(d.pickId);
        const creator = await ctx.db.get(d.creatorId);
        const opener = await ctx.db.get(d.openedByUserId);
        return { dispute: d, pick, creator, opener };
      }),
    );
    return enriched;
  },
});

/** Read a single dispute with full participant join. Admin or participant only. */
export const get = query({
  args: { disputeId: v.id('disputes') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) return null;

    const isOpener = dispute.openedByUserId === user._id;
    const isCreatorOwner = user.creatorId === dispute.creatorId;
    if (!isOpener && !isCreatorOwner && !isAdmin(user)) {
      throw new Error('Forbidden');
    }

    const pick = await ctx.db.get(dispute.pickId);
    const creator = await ctx.db.get(dispute.creatorId);
    const opener = await ctx.db.get(dispute.openedByUserId);
    return { dispute, pick, creator, opener };
  },
});
