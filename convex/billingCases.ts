import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAdmin } from './shared/permissions';
import { internal } from './_generated/api';

export const adminSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const open = await ctx.db
      .query('billingCases')
      .withIndex('by_status', (q) => q.eq('status', 'open'))
      .take(500);
    const underReview = await ctx.db
      .query('billingCases')
      .withIndex('by_status', (q) => q.eq('status', 'under_review'))
      .take(500);
    const refunded = await ctx.db
      .query('billingCases')
      .withIndex('by_status', (q) => q.eq('status', 'refunded'))
      .take(500);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const refundMonthCents = refunded
      .filter((c) => c.updatedAt >= monthStart.getTime())
      .reduce((s, c) => s + c.amountCents, 0);
    return {
      openDisputes: open.length + underReview.length,
      refundsThisMonthCents: refundMonthCents,
      activeChargebacks: open.filter((c) => c.issueType === 'chargeback').length,
      resolvedCases: refunded.length,
    };
  },
});

const caseStatus = v.union(
  v.literal('open'),
  v.literal('under_review'),
  v.literal('pending_finance'),
  v.literal('escalated'),
  v.literal('refunded'),
  v.literal('denied'),
  v.literal('closed'),
);

export const adminQueue = query({
  args: {
    status: v.optional(caseStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 50, 100);
    const statusFilter = args.status;
    const rows = statusFilter
      ? await ctx.db
          .query('billingCases')
          .withIndex('by_status', (q) => q.eq('status', statusFilter))
          .order('desc')
          .take(limit)
      : await ctx.db.query('billingCases').order('desc').take(limit);

    return await Promise.all(
      rows.map(async (c) => {
        const subscriber = await ctx.db.get(c.subscriberId);
        const creator = await ctx.db.get(c.creatorId);
        return { case: c, subscriber, creator };
      }),
    );
  },
});

export const addNote = mutation({
  args: {
    caseId: v.id('billingCases'),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.get(args.caseId);
    if (!row) throw new Error('Case not found');
    const note = {
      authorUserId: admin._id,
      body: args.body.trim(),
      createdAt: Date.now(),
    };
    await ctx.db.patch(args.caseId, {
      internalNotes: [...row.internalNotes, note],
      updatedAt: Date.now(),
    });
    return args.caseId;
  },
});

export const transition = mutation({
  args: {
    caseId: v.id('billingCases'),
    status: v.union(
      v.literal('under_review'),
      v.literal('pending_finance'),
      v.literal('escalated'),
      v.literal('refunded'),
      v.literal('denied'),
      v.literal('closed'),
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.get(args.caseId);
    if (!row) throw new Error('Case not found');
    await ctx.db.patch(args.caseId, {
      status: args.status,
      resolvedByAdminId: admin._id,
      updatedAt: Date.now(),
    });
    await ctx.runMutation(internal.audit.log, {
      actorUserId: admin._id,
      entityType: 'billingCase',
      entityId: args.caseId,
      action: `billingCase.${args.status}`,
      metadata: { caseNumber: row.caseNumber },
    });
    return args.caseId;
  },
});
