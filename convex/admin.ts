import { v } from 'convex/values';
import { query } from './_generated/server';
import { requireAdmin } from './shared/permissions';

// =============================================================================
// Admin (PRD M16, Phase 7) — moderation queue counts + activity overview.
// =============================================================================

/**
 * High-level admin dashboard summary: queue counts and recent activity.
 * All sub-queries enforce admin role.
 */
export const summary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const pendingEvents = await ctx.db
      .query('events')
      .withIndex('by_verificationStatus', (q) => q.eq('verificationStatus', 'creator_submitted'))
      .take(500);

    const submittedApplications = await ctx.db
      .query('applications')
      .withIndex('by_status', (q) => q.eq('status', 'submitted'))
      .take(500);

    const reviewApplications = await ctx.db
      .query('applications')
      .withIndex('by_status', (q) => q.eq('status', 'review'))
      .take(500);

    const flaggedApplications = await ctx.db
      .query('applications')
      .withIndex('by_status', (q) => q.eq('status', 'flagged'))
      .take(500);

    const recentAudit = await ctx.db.query('auditLogs').order('desc').take(20);

    return {
      pendingEventReview: pendingEvents.length,
      pendingApplications: submittedApplications.length + reviewApplications.length,
      flaggedApplications: flaggedApplications.length,
      recentAudit,
    };
  },
});

/**
 * Auto-grader observability (M02 / Phase 18). Scans the most recent audit
 * log entries for `pick.graded.*` actions emitted by the cron auto-grader
 * (`metadata.autoGraded === true`) and rolls them up into per-grade counts
 * + a small sample list of the latest auto-graded picks. The intent is to
 * give admins an at-a-glance view of cron health and to spot misgrades
 * fast — every entry deep-links to the underlying pick via `pickId`.
 */
export const autoGraderStats = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const window = Math.max(50, Math.min(args.limit ?? 500, 2000));
    const recent = await ctx.db.query('auditLogs').order('desc').take(window);

    const autoGraded = recent.filter(
      (a) =>
        a.action.startsWith('pick.graded.') &&
        a.metadata &&
        typeof a.metadata === 'object' &&
        (a.metadata as { autoGraded?: boolean }).autoGraded === true,
    );

    const counts: Record<string, number> = {
      win: 0,
      loss: 0,
      push: 0,
      void: 0,
    };
    for (const log of autoGraded) {
      const grade = log.action.slice('pick.graded.'.length);
      counts[grade] = (counts[grade] ?? 0) + 1;
    }

    const sample = autoGraded.slice(0, 25).map((a) => ({
      id: a._id,
      pickId: a.entityId ?? null,
      grade: a.action.slice('pick.graded.'.length),
      netUnits: (a.metadata as { netUnits?: number } | null)?.netUnits ?? null,
      createdAt: a.createdAt,
    }));

    return {
      windowSize: window,
      total: autoGraded.length,
      counts,
      sample,
    };
  },
});
