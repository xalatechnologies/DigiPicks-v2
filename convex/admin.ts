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
      .withIndex('by_verificationStatus', (q) =>
        q.eq('verificationStatus', 'creator_submitted'),
      )
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

    const recentAudit = await ctx.db
      .query('auditLogs')
      .order('desc')
      .take(20);

    return {
      pendingEventReview: pendingEvents.length,
      pendingApplications:
        submittedApplications.length + reviewApplications.length,
      flaggedApplications: flaggedApplications.length,
      recentAudit,
    };
  },
});
