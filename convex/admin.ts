import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAdmin } from './shared/permissions';
import { creatorStatus } from './shared/validators';

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
const SCAN_CAP = 10_000;

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function humanizeAuditAction(action: string, entityType: string): { title: string; sub: string } {
  const map: Record<string, { title: string; sub: string }> = {
    'application.submitted': {
      title: 'New creator application submitted',
      sub: 'Awaiting admin review in the applications queue.',
    },
    'application.approved': {
      title: 'Creator application approved',
      sub: 'Applicant studio access was provisioned.',
    },
    'application.rejected': {
      title: 'Creator application rejected',
      sub: 'Applicant was notified of the decision.',
    },
    'dispute.opened': {
      title: 'New dispute opened',
      sub: 'Requires review in the support queue.',
    },
    'pick.graded.win': { title: 'Pick graded — win', sub: 'Auto-grader or manual grade recorded.' },
    'pick.graded.loss': {
      title: 'Pick graded — loss',
      sub: 'Auto-grader or manual grade recorded.',
    },
  };
  if (map[action]) return map[action];
  return {
    title: action.replace(/\./g, ' · '),
    sub: `${entityType} activity`,
  };
}

/**
 * Platform-wide admin dashboard: KPI counts, recent audit activity, and
 * derived operational alerts. Bounded scans — caps surfaced in `capped`.
 */
export const overview = query({
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

    const openDisputes = await ctx.db
      .query('disputes')
      .withIndex('by_status', (q) => q.eq('status', 'open'))
      .take(500);

    const underReviewDisputes = await ctx.db
      .query('disputes')
      .withIndex('by_status', (q) => q.eq('status', 'under_review'))
      .take(500);

    const users = await ctx.db.query('users').take(SCAN_CAP);
    const subscriptions = await ctx.db.query('subscriptions').take(SCAN_CAP);
    const creators = await ctx.db.query('creators').take(SCAN_CAP);

    const activeSubscribers = subscriptions.filter((s) => s.status === 'active').length;
    const activeCreators = creators.filter((c) => c.status === 'active').length;

    const recentAudit = await ctx.db.query('auditLogs').order('desc').take(15);

    const lastStripeEvent = await ctx.db.query('stripeEvents').order('desc').take(1);
    const stripeLagMinutes =
      lastStripeEvent.length > 0
        ? Math.floor((Date.now() - lastStripeEvent[0]!.processedAt) / 60_000)
        : null;

    const pendingApplications = submittedApplications.length + reviewApplications.length;
    const openTickets = openDisputes.length + underReviewDisputes.length;

    const alerts: Array<{
      id: string;
      tone: 'amber' | 'danger' | 'primary';
      title: string;
      sub: string;
    }> = [];

    if (pendingApplications > 0) {
      alerts.push({
        id: 'applications',
        tone: pendingApplications >= 10 ? 'danger' : 'amber',
        title: `${pendingApplications} creator application${pendingApplications === 1 ? '' : 's'} awaiting review`,
        sub: 'Review onboarding requests before they age in the queue.',
      });
    }

    if (flaggedApplications.length > 0) {
      alerts.push({
        id: 'flagged-apps',
        tone: 'danger',
        title: `${flaggedApplications.length} flagged application${flaggedApplications.length === 1 ? '' : 's'}`,
        sub: 'Applications marked for elevated scrutiny.',
      });
    }

    if (pendingEvents.length > 0) {
      alerts.push({
        id: 'events',
        tone: 'amber',
        title: `${pendingEvents.length} event${pendingEvents.length === 1 ? '' : 's'} pending verification`,
        sub: 'Creator-submitted events need approval before they surface publicly.',
      });
    }

    if (openTickets > 0) {
      alerts.push({
        id: 'disputes',
        tone: openDisputes.length > 0 ? 'danger' : 'amber',
        title: `${openTickets} open support ticket${openTickets === 1 ? '' : 's'}`,
        sub: 'Disputes and cases awaiting admin resolution.',
      });
    }

    if (stripeLagMinutes !== null && stripeLagMinutes > 30) {
      alerts.push({
        id: 'stripe',
        tone: 'amber',
        title: 'Stripe webhook processing delay',
        sub: `Last processed event was ${stripeLagMinutes} minutes ago. Subscription state may lag.`,
      });
    }

    const recentActivity = recentAudit.map((row) => {
      const copy = humanizeAuditAction(row.action, row.entityType);
      return {
        id: row._id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId ?? null,
        createdAt: row.createdAt,
        timeLabel: formatRelativeTime(row.createdAt),
        title: copy.title,
        sub: copy.sub,
      };
    });

    return {
      kpis: {
        totalUsers: users.length,
        activeSubscribers,
        activeCreators,
        pendingApplications,
        flaggedApplications: flaggedApplications.length,
        pendingEventReview: pendingEvents.length,
        openTickets,
        mrr: null as number | null,
        churnRate: null as number | null,
      },
      capped: {
        users: users.length >= SCAN_CAP,
        subscriptions: subscriptions.length >= SCAN_CAP,
        creators: creators.length >= SCAN_CAP,
      },
      recentActivity,
      alerts,
    };
  },
});

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

export const usersList = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 50, 200);
    const rows = await ctx.db.query('users').order('desc').take(limit);
    const q = args.search?.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (u) =>
            u.email?.toLowerCase().includes(q) ||
            u.name?.toLowerCase().includes(q) ||
            u._id.includes(q),
        )
      : rows;
    return filtered.map((u) => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      creatorId: u.creatorId,
    }));
  },
});

export const creatorsList = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 100, 200);
    return await ctx.db.query('creators').order('desc').take(limit);
  },
});

export const setCreatorStatus = mutation({
  args: {
    creatorId: v.id('creators'),
    status: creatorStatus,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.creatorId, { status: args.status });
    return args.creatorId;
  },
});

export const subscriptionsList = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 100, 500);
    const subs = await ctx.db.query('subscriptions').order('desc').take(limit);
    return await Promise.all(
      subs.map(async (sub) => {
        const subscriber = await ctx.db.get(sub.subscriberId);
        const creator = await ctx.db.get(sub.creatorId);
        return { sub, subscriber, creator };
      }),
    );
  },
});

export const billingSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const subs = await ctx.db.query('subscriptions').take(5000);
    const active = subs.filter((s) => s.status === 'active');
    const pastDue = subs.filter((s) => s.status === 'past_due');
    const mrrCents = active.reduce((sum, s) => {
      return sum;
    }, 0);
    return {
      activeCount: active.length,
      pastDueCount: pastDue.length,
      totalCount: subs.length,
      mrrCents,
    };
  },
});

export const analyticsSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query('users').take(5000);
    const creators = await ctx.db.query('creators').take(2000);
    const subs = await ctx.db.query('subscriptions').take(5000);
    const stripeEvents = await ctx.db.query('stripeEvents').order('desc').take(1);
    return {
      totalUsers: users.length,
      totalCreators: creators.length,
      activeSubscriptions: subs.filter((s) => s.status === 'active').length,
      lastStripeEventAt: stripeEvents[0]?.processedAt ?? null,
    };
  },
});

export const campaignsList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query('campaigns').order('desc').take(50);
  },
});

export const platformSettingsList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query('platformSettings').take(50);
  },
});

export const moderationSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const pendingEvents = await ctx.db
      .query('events')
      .withIndex('by_verificationStatus', (q) => q.eq('verificationStatus', 'creator_submitted'))
      .take(500);
    const openDisputes = await ctx.db
      .query('disputes')
      .withIndex('by_status', (q) => q.eq('status', 'open'))
      .take(500);
    const apps = await ctx.db
      .query('applications')
      .withIndex('by_status', (q) => q.eq('status', 'submitted'))
      .take(500);
    return {
      pendingEvents: pendingEvents.length,
      openDisputes: openDisputes.length,
      pendingApplications: apps.length,
    };
  },
});

export const auditList = query({
  args: {
    entityType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 50, 200);
    const rows = await ctx.db.query('auditLogs').order('desc').take(limit);
    if (!args.entityType) return rows;
    return rows.filter((r) => r.entityType === args.entityType);
  },
});
