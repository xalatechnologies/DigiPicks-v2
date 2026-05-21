import { v } from 'convex/values';
import { internal } from './_generated/api';
import { mutation, query, type QueryCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { isAccessActive } from './subscriptions';
import { ADMIN_ROLES, getCurrentUser, requireAdmin } from './shared/permissions';
import { getPlatformFeeRate } from './shared/platformFees';
import { creatorStatus } from './shared/validators';

const ADMIN_ROLE_SET = new Set(['super_admin', 'tenant_admin', 'admin', 'moderator']);

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
    const user = await getCurrentUser(ctx);
    if (!user?.role || !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
      return null;
    }

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

async function userSubscriptionCounts(ctx: QueryCtx, userId: Id<'users'>) {
  const subs = await ctx.db
    .query('subscriptions')
    .withIndex('by_subscriber_and_creator', (q) => q.eq('subscriberId', userId))
    .collect();
  const active = subs.filter((s) => isAccessActive(s));
  const pastDue = subs.filter((s) => s.status === 'past_due').length;
  return {
    subscriptionCount: subs.length,
    activeSubscriptionCount: active.length,
    pastDueCount: pastDue,
  } as const;
}

export const usersSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query('users').take(2000);
    const total = users.length;
    const active = users.filter((u) => u.isActive !== false).length;
    const creators = users.filter((u) => u.creatorId).length;
    const admins = users.filter((u) => u.role && ADMIN_ROLE_SET.has(u.role)).length;
    const subscribers = users.filter((u) => !u.creatorId && (!u.role || u.role === 'user')).length;

    const subs = await ctx.db.query('subscriptions').take(5000);
    const billingIssues = subs.filter((s) => s.status === 'past_due').length;

    return { total, active, creators, admins, subscribers, billingIssues };
  },
});

export const usersList = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 200, 500);
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
    return await Promise.all(
      filtered.map(async (u) => {
        const counts = await userSubscriptionCounts(ctx, u._id);
        let creatorHandle: string | undefined;
        if (u.creatorId) {
          const creator = await ctx.db.get(u.creatorId);
          creatorHandle = creator?.handle;
        }
        return {
          _id: u._id,
          email: u.email,
          name: u.name,
          role: u.role,
          creatorId: u.creatorId,
          creatorHandle,
          isActive: u.isActive !== false,
          lastLoginAt: u.lastLoginAt,
          joinedAt: u._creationTime,
          ...counts,
        };
      }),
    );
  },
});

export const userGet = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriber_and_creator', (q) => q.eq('subscriberId', args.userId))
      .collect();

    const subscriptions = await Promise.all(
      subs.map(async (sub) => {
        const creator = await ctx.db.get(sub.creatorId);
        return {
          _id: sub._id,
          status: sub.status,
          plan: sub.plan,
          renewsAt: sub.renewsAt,
          creatorName: creator?.name ?? '—',
          creatorHandle: creator?.handle ?? '—',
          accessActive: isAccessActive(sub),
        };
      }),
    );

    const counts = await userSubscriptionCounts(ctx, args.userId);
    let creatorHandle: string | undefined;
    if (user.creatorId) {
      const creator = await ctx.db.get(user.creatorId);
      creatorHandle = creator?.handle;
    }

    const overrides = await ctx.db
      .query('entitlements')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .take(20);

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        creatorId: user.creatorId,
        creatorHandle,
        isActive: user.isActive !== false,
        lastLoginAt: user.lastLoginAt,
        stripeCustomerId: user.stripeCustomerId,
      },
      ...counts,
      overrideCount: overrides.filter((e) => e.status === 'active').length,
      subscriptions,
    };
  },
});

async function countActiveSubscriptions(ctx: QueryCtx, creatorId: Id<'creators'>) {
  const subs = await ctx.db
    .query('subscriptions')
    .withIndex('by_creator', (q) => q.eq('creatorId', creatorId))
    .collect();
  return subs.filter((s) => s.status === 'active').length;
}

export const creatorsSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const creators = await ctx.db.query('creators').take(2000);
    const total = creators.length;
    const active = creators.filter((c) => c.status === 'active').length;
    const suspended = creators.filter((c) => c.status === 'suspended').length;
    const pending = creators.filter((c) => c.status === 'pending').length;
    const performers = creators.filter(
      (c) => c.status === 'active' && (c.trustScore ?? 0) >= 75,
    ).length;
    const atRisk = creators.filter(
      (c) => c.status === 'active' && (c.trustScore ?? 100) < 50,
    ).length;
    return { total, active, suspended, pending, performers, atRisk };
  },
});

export const creatorsList = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 200, 500);
    const creators = await ctx.db.query('creators').order('desc').take(limit);
    return await Promise.all(
      creators.map(async (c) => {
        const activeSubscriptions = await countActiveSubscriptions(ctx, c._id);
        const estMonthlyRevenue = c.startingPrice * activeSubscriptions;
        return {
          ...c,
          activeSubscriptions,
          estMonthlyRevenue,
        };
      }),
    );
  },
});

export const creatorGet = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) return null;
    const activeSubscriptions = await countActiveSubscriptions(ctx, creator._id);
    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_creator', (q) => q.eq('creatorId', creator._id))
      .collect();
    return {
      ...creator,
      activeSubscriptions,
      totalSubscriptions: subs.length,
      estMonthlyRevenue: creator.startingPrice * activeSubscriptions,
    };
  },
});

export const setCreatorStatus = mutation({
  args: {
    creatorId: v.id('creators'),
    status: creatorStatus,
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new Error('Creator not found');
    await ctx.db.patch(args.creatorId, { status: args.status });
    await ctx.scheduler.runAfter(0, internal.audit.log, {
      actorUserId: admin._id,
      entityType: 'creator',
      entityId: args.creatorId,
      action: `creator.status.${args.status}`,
      metadata: { handle: creator.handle, previous: creator.status },
    });
    return args.creatorId;
  },
});

export const setCreatorVerified = mutation({
  args: {
    creatorId: v.id('creators'),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new Error('Creator not found');
    await ctx.db.patch(args.creatorId, { verified: args.verified });
    await ctx.scheduler.runAfter(0, internal.audit.log, {
      actorUserId: admin._id,
      entityType: 'creator',
      entityId: args.creatorId,
      action: args.verified ? 'creator.verified' : 'creator.unverified',
      metadata: { handle: creator.handle },
    });
    return args.creatorId;
  },
});

async function monthlyCentsForSubscription(
  ctx: QueryCtx,
  sub: { creatorId: Id<'creators'>; plan: string; status: string },
  tierCache: Map<string, number>,
): Promise<number> {
  if (sub.plan === 'free' || sub.status !== 'active') return 0;
  const cacheKey = `${sub.creatorId}:${sub.plan}`;
  if (tierCache.has(cacheKey)) return tierCache.get(cacheKey)!;

  const tiers = await ctx.db
    .query('pricingTiers')
    .withIndex('by_creator', (q) => q.eq('creatorId', sub.creatorId))
    .collect();
  const tier = tiers.find((t) => !t.archived && t.legacyPlan === sub.plan);
  let cents = 0;
  if (tier) {
    if (tier.interval === 'year') cents = Math.round(tier.priceCents / 12);
    else if (tier.interval === 'month') cents = tier.priceCents;
  } else {
    const creator = await ctx.db.get(sub.creatorId);
    if (creator?.startingPrice) cents = Math.round(creator.startingPrice * 100);
  }
  tierCache.set(cacheKey, cents);
  return cents;
}

function subscriptionHealth(sub: { status: string; gracePeriodEndsAt?: number }): {
  label: string;
  tone: 'green' | 'amber' | 'red' | 'mute';
} {
  const access = isAccessActive(sub);
  if (sub.status === 'active' && access) {
    return { label: 'Healthy', tone: 'green' };
  }
  if (sub.status === 'past_due') {
    return access ? { label: 'Grace period', tone: 'amber' } : { label: 'Failed', tone: 'red' };
  }
  if (sub.status === 'cancelled') {
    return { label: 'Inactive', tone: 'mute' };
  }
  if (sub.status === 'refunded') {
    return { label: 'Refunded', tone: 'mute' };
  }
  return { label: sub.status, tone: 'mute' };
}

async function enrichSubscriptionRow(
  ctx: QueryCtx,
  sub: Doc<'subscriptions'>,
  tierCache: Map<string, number>,
) {
  const subscriber = await ctx.db.get(sub.subscriberId);
  const creator = await ctx.db.get(sub.creatorId);
  const priceCents = await monthlyCentsForSubscription(ctx, sub, tierCache);
  const health = subscriptionHealth(sub);
  const accessActive = isAccessActive(sub);
  const name = subscriber?.name ?? subscriber?.email ?? 'Subscriber';
  const email = subscriber?.email ?? '—';
  const monogram = (name.trim()[0] ?? email[0] ?? '?').toUpperCase();

  return {
    sub,
    subscriber,
    creator,
    priceCents,
    priceLabel:
      priceCents > 0
        ? `$${(priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'Free',
    accessActive,
    healthLabel: health.label,
    healthTone: health.tone,
    renewsLabel: sub.renewsAt
      ? new Date(sub.renewsAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '—',
    subscriberName: name,
    subscriberEmail: email,
    monogram,
    creatorName: creator?.name ?? '—',
    creatorHandle: creator?.handle ? `@${creator.handle}` : '—',
  };
}

export const subscriptionsList = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 200, 500);
    const subs = await ctx.db.query('subscriptions').order('desc').take(limit);
    const tierCache = new Map<string, number>();
    return await Promise.all(subs.map((sub) => enrichSubscriptionRow(ctx, sub, tierCache)));
  },
});

export const subscriptionGet = query({
  args: { subscriptionId: v.id('subscriptions') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub) return null;

    const tierCache = new Map<string, number>();
    const row = await enrichSubscriptionRow(ctx, sub, tierCache);

    const billingCases = await ctx.db
      .query('billingCases')
      .withIndex('by_subscriber', (q) => q.eq('subscriberId', sub.subscriberId))
      .order('desc')
      .take(20);

    const incidents = billingCases
      .filter((c) => c.creatorId === sub.creatorId)
      .map((c) => ({
        id: c._id,
        caseNumber: c.caseNumber,
        issueType: c.issueType,
        status: c.status,
        amountLabel: `$${(c.amountCents / 100).toFixed(2)}`,
        priority: c.priority ?? 'normal',
        createdAt: c.createdAt,
        createdLabel: new Date(c.createdAt).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
      }));

    return {
      ...row,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      stripeCustomerId: sub.stripeCustomerId,
      gracePeriodEndsAt: sub.gracePeriodEndsAt,
      startedAt: sub.startedAt,
      startedLabel: new Date(sub.startedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      incidents,
    };
  },
});

export const billingSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const subs = await ctx.db.query('subscriptions').take(5000);
    const active = subs.filter((s) => s.status === 'active');
    const pastDue = subs.filter((s) => s.status === 'past_due');
    const cancelled = subs.filter((s) => s.status === 'cancelled');

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const cancelledLast30 = cancelled.filter((s) => {
      const at = s.cancelledAt ?? s._creationTime;
      return at >= Date.now() - 30 * 24 * 60 * 60 * 1000;
    });

    const tierCache = new Map<string, number>();
    let mrrCents = 0;
    for (const sub of active) {
      mrrCents += await monthlyCentsForSubscription(ctx, sub, tierCache);
    }

    const openBilling = await ctx.db
      .query('billingCases')
      .withIndex('by_status', (q) => q.eq('status', 'open'))
      .take(500);
    const underReviewBilling = await ctx.db
      .query('billingCases')
      .withIndex('by_status', (q) => q.eq('status', 'under_review'))
      .take(500);
    const refundedCases = await ctx.db
      .query('billingCases')
      .withIndex('by_status', (q) => q.eq('status', 'refunded'))
      .take(500);
    const refundsMonthCents = refundedCases
      .filter((c) => c.updatedAt >= monthStart.getTime())
      .reduce((s, c) => s + c.amountCents, 0);

    return {
      activeCount: active.length,
      pastDueCount: pastDue.length,
      cancelledLast30Days: cancelledLast30.length,
      cancelledCount: cancelled.length,
      totalCount: subs.length,
      mrrCents,
      refundsMonthCents,
      openBillingCases: openBilling.length + underReviewBilling.length,
    };
  },
});

type ConnectStatus = 'not_started' | 'pending' | 'restricted' | 'active';

async function payoutTotalsForCreator(ctx: QueryCtx, creatorId: Id<'creators'>) {
  const rows = await ctx.db
    .query('payouts')
    .withIndex('by_creator', (q) => q.eq('creatorId', creatorId))
    .take(500);

  let paidTotal = 0;
  let pendingTotal = 0;
  let failedCount = 0;
  let lastPaidAt: number | undefined;
  let nextPendingAt: number | undefined;

  for (const row of rows) {
    if (row.status === 'paid') {
      paidTotal += row.amount;
      const at = row.paidAt ?? row.periodEnd;
      if (lastPaidAt === undefined || at > lastPaidAt) lastPaidAt = at;
    }
    if (row.status === 'pending') {
      pendingTotal += row.amount;
      if (nextPendingAt === undefined || row.periodEnd < nextPendingAt) {
        nextPendingAt = row.periodEnd;
      }
    }
    if (row.status === 'failed') failedCount += 1;
  }

  return {
    paidTotal,
    pendingTotal,
    failedCount,
    payoutCount: rows.length,
    lastPaidAt,
    nextPendingAt,
  };
}

function normalizeConnectStatus(raw: string | undefined): ConnectStatus {
  if (raw === 'active' || raw === 'pending' || raw === 'restricted') return raw;
  return 'not_started';
}

export const payoutsSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const creators = await ctx.db.query('creators').take(2000);
    const payoutRows = await ctx.db.query('payouts').take(5000);

    let totalPaid = 0;
    let pendingCount = 0;
    let failedCount = 0;
    for (const row of payoutRows) {
      if (row.status === 'paid') totalPaid += row.amount;
      if (row.status === 'pending') pendingCount += 1;
      if (row.status === 'failed') failedCount += 1;
    }

    const feeRate = getPlatformFeeRate();
    const platformRevenue = totalPaid * feeRate;
    const creatorEarnings = totalPaid - platformRevenue;

    let connectActive = 0;
    let connectPending = 0;
    let connectNotStarted = 0;
    let connectRestricted = 0;
    for (const c of creators) {
      const status = normalizeConnectStatus(c.connectStatus);
      if (status === 'active') connectActive += 1;
      else if (status === 'pending') connectPending += 1;
      else if (status === 'restricted') connectRestricted += 1;
      else connectNotStarted += 1;
    }

    return {
      totalPaid,
      pendingCount,
      failedCount,
      platformRevenue,
      creatorEarnings,
      connectActive,
      connectPending,
      connectNotStarted,
      connectRestricted,
      creatorCount: creators.length,
      feeRate,
    };
  },
});

export const payoutsCreatorsList = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 200, 500);
    const creators = await ctx.db.query('creators').order('desc').take(limit);

    return await Promise.all(
      creators.map(async (creator) => {
        const totals = await payoutTotalsForCreator(ctx, creator._id);
        const connect = normalizeConnectStatus(creator.connectStatus);
        const activeSubscriptions = await countActiveSubscriptions(ctx, creator._id);
        return {
          creatorId: creator._id,
          name: creator.name,
          handle: creator.handle,
          monogram: creator.avatarMono,
          nicheLine: creator.niche,
          connectStatus: connect,
          stripeConnectAccountId: creator.stripeConnectAccountId,
          activeSubscriptions,
          estMonthlyRevenue: creator.startingPrice * activeSubscriptions,
          ...totals,
        };
      }),
    );
  },
});

export const payoutCreatorGet = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) return null;

    const totals = await payoutTotalsForCreator(ctx, creator._id);
    const payouts = await ctx.db
      .query('payouts')
      .withIndex('by_creator', (q) => q.eq('creatorId', creator._id))
      .order('desc')
      .take(20);

    const history = payouts.map((p) => ({
      id: p._id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      periodLabel: `${new Date(p.periodStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(p.periodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
      paidLabel: p.paidAt
        ? new Date(p.paidAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '—',
    }));

    return {
      creatorId: creator._id,
      name: creator.name,
      handle: creator.handle,
      monogram: creator.avatarMono,
      nicheLine: creator.niche,
      connectStatus: normalizeConnectStatus(creator.connectStatus),
      stripeConnectAccountId: creator.stripeConnectAccountId,
      ...totals,
      history,
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
    const stripeEvents = await ctx.db.query('stripeEvents').order('desc').take(100);
    const disputes = await ctx.db.query('disputes').take(500);
    const billingCases = await ctx.db.query('billingCases').take(500);
    const applications = await ctx.db.query('applications').take(500);

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newUsersWeek = users.filter((u) => u._creationTime >= weekAgo).length;
    const newCreatorsWeek = creators.filter((c) => c._creationTime >= weekAgo).length;
    const failedPayments = subs.filter((s) => s.status === 'past_due').length;
    const openDisputes = disputes.filter(
      (d) => d.status === 'open' || d.status === 'under_review',
    ).length;
    const openBilling = billingCases.filter(
      (c) => c.status === 'open' || c.status === 'under_review',
    ).length;
    const pendingApplications = applications.filter(
      (a) => a.status === 'submitted' || a.status === 'review' || a.status === 'flagged',
    ).length;
    const stripeFailures = stripeEvents.filter((e) =>
      (e.outcome ?? '').toLowerCase().includes('fail'),
    ).length;

    return {
      totalUsers: users.length,
      totalCreators: creators.length,
      activeSubscriptions: subs.filter((s) => s.status === 'active').length,
      lastStripeEventAt: stripeEvents[0]?.processedAt ?? null,
      newUsersWeek,
      newCreatorsWeek,
      failedPayments,
      openDisputes,
      openBilling,
      pendingApplications,
      stripeFailures,
    };
  },
});

export const auditHubSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query('auditLogs').order('desc').take(500);
    const byEntity: Record<string, number> = {};
    for (const row of rows) {
      byEntity[row.entityType] = (byEntity[row.entityType] ?? 0) + 1;
    }
    return {
      totalRecent: rows.length,
      byEntity,
      latestAt: rows[0]?.createdAt ?? null,
    };
  },
});

const campaignChannel = v.union(v.literal('email'), v.literal('push'), v.literal('in_app'));

const campaignStatus = v.union(v.literal('draft'), v.literal('scheduled'), v.literal('sent'));

function formatCampaignWhen(ms: number | undefined): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const campaignsSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const campaigns = await ctx.db.query('campaigns').take(500);
    const draftCount = campaigns.filter((c) => c.status === 'draft').length;
    const scheduledCount = campaigns.filter((c) => c.status === 'scheduled').length;
    const sentCount = campaigns.filter((c) => c.status === 'sent').length;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const notifications = await ctx.db.query('notifications').order('desc').take(2000);
    const inAppThisMonth = notifications.filter((n) => n.createdAt >= monthStart.getTime()).length;

    return {
      draftCount,
      scheduledCount,
      sentCount,
      totalCount: campaigns.length,
      inAppThisMonth,
    };
  },
});

export const campaignsList = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 100, 200);
    const rows = await ctx.db.query('campaigns').order('desc').take(limit);

    return await Promise.all(
      rows.map(async (row) => {
        const admin = await ctx.db.get(row.createdByAdminId);
        return {
          _id: row._id,
          title: row.title,
          body: row.body,
          channel: row.channel,
          status: row.status,
          scheduledAt: row.scheduledAt,
          sentAt: row.sentAt,
          createdAt: row.createdAt,
          createdByLabel: admin?.name ?? admin?.email ?? 'Admin',
          scheduledLabel: formatCampaignWhen(row.scheduledAt),
          sentLabel: formatCampaignWhen(row.sentAt),
          createdLabel: formatCampaignWhen(row.createdAt),
        };
      }),
    );
  },
});

export const campaignGet = query({
  args: { campaignId: v.id('campaigns') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(args.campaignId);
    if (!row) return null;
    const admin = await ctx.db.get(row.createdByAdminId);
    return {
      _id: row._id,
      title: row.title,
      body: row.body,
      channel: row.channel,
      status: row.status,
      scheduledAt: row.scheduledAt,
      sentAt: row.sentAt,
      createdAt: row.createdAt,
      createdByLabel: admin?.name ?? admin?.email ?? 'Admin',
      scheduledLabel: formatCampaignWhen(row.scheduledAt),
      sentLabel: formatCampaignWhen(row.sentAt),
      createdLabel: formatCampaignWhen(row.createdAt),
    };
  },
});

export const campaignCreateDraft = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    channel: campaignChannel,
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const title = args.title.trim();
    const body = args.body.trim();
    if (!title) throw new Error('Campaign title is required.');
    if (!body) throw new Error('Message content is required.');

    const status = args.scheduledAt ? ('scheduled' as const) : ('draft' as const);
    const id = await ctx.db.insert('campaigns', {
      title,
      body,
      channel: args.channel,
      status,
      scheduledAt: args.scheduledAt,
      createdByAdminId: admin._id,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.audit.log, {
      actorUserId: admin._id,
      entityType: 'campaign',
      entityId: id,
      action: `campaign.${status}`,
      metadata: { title, channel: args.channel },
    });

    return id;
  },
});

const SLA_AT_RISK_MS = 48 * 60 * 60 * 1000;

const disputeStatusFilter = v.union(
  v.literal('open'),
  v.literal('under_review'),
  v.literal('resolved'),
  v.literal('dismissed'),
);

const supportQueueFilter = v.union(
  v.literal('all'),
  v.literal('pick'),
  v.literal('billing'),
  v.literal('chargeback'),
);

function formatSupportWhen(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isOpenDisputeStatus(status: string): boolean {
  return status === 'open' || status === 'under_review';
}

function isOpenBillingStatus(status: string): boolean {
  return status === 'open' || status === 'under_review' || status === 'pending_finance';
}

export const disputesSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query('disputes').take(500);
    return {
      openCount: rows.filter((d) => d.status === 'open').length,
      reviewingCount: rows.filter((d) => d.status === 'under_review').length,
      resolvedCount: rows.filter((d) => d.status === 'resolved').length,
      dismissedCount: rows.filter((d) => d.status === 'dismissed').length,
      totalCount: rows.length,
    };
  },
});

export const supportHubSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const disputes = await ctx.db.query('disputes').take(500);
    const billingCases = await ctx.db.query('billingCases').take(500);
    const now = Date.now();

    const openDisputes = disputes.filter((d) => isOpenDisputeStatus(d.status));
    const openBilling = billingCases.filter((c) => isOpenBillingStatus(c.status));

    const highPriority = billingCases.filter(
      (c) => c.priority === 'urgent' && isOpenBillingStatus(c.status),
    ).length;

    const billingDisputes = openBilling.filter((c) => c.issueType !== 'content').length;

    const contentDisputes =
      openDisputes.length + openBilling.filter((c) => c.issueType === 'content').length;

    const slaAtRisk =
      openDisputes.filter((d) => now - d.createdAt >= SLA_AT_RISK_MS).length +
      openBilling.filter((c) => now - c.createdAt >= SLA_AT_RISK_MS).length;

    return {
      openTickets: openDisputes.length + openBilling.length,
      highPriority,
      billingDisputes,
      contentDisputes,
      slaAtRisk,
    };
  },
});

export const supportHubQueue = query({
  args: {
    queue: v.optional(supportQueueFilter),
    status: v.optional(disputeStatusFilter),
    urgentOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 150, 300);
    const queue = args.queue ?? 'all';
    const now = Date.now();

    type HubRow = {
      kind: 'pick' | 'billing';
      id: string;
      ticketLabel: string;
      partyName: string;
      partyRole: string;
      issueLabel: string;
      priorityLabel: string;
      priorityTone: 'urgent' | 'normal';
      status: string;
      statusLabel: string;
      statusTone: 'green' | 'amber' | 'red' | 'mute';
      createdAt: number;
      createdLabel: string;
      slaAtRisk: boolean;
    };

    const rows: HubRow[] = [];

    if (queue === 'all' || queue === 'pick') {
      const disputeRows = args.status
        ? await ctx.db
            .query('disputes')
            .withIndex('by_status', (q) => q.eq('status', args.status!))
            .order('desc')
            .take(limit)
        : await ctx.db.query('disputes').order('desc').take(limit);

      for (const dispute of disputeRows) {
        const opener = await ctx.db.get(dispute.openedByUserId);
        const pick = await ctx.db.get(dispute.pickId);
        const statusLabel =
          dispute.status === 'open'
            ? 'Open'
            : dispute.status === 'under_review'
              ? 'In progress'
              : dispute.status === 'resolved'
                ? 'Resolved'
                : 'Dismissed';
        const statusTone =
          dispute.status === 'resolved'
            ? 'green'
            : dispute.status === 'dismissed'
              ? 'red'
              : dispute.status === 'under_review'
                ? 'amber'
                : 'mute';

        rows.push({
          kind: 'pick',
          id: dispute._id,
          ticketLabel: `#DP-${dispute._id.slice(-6).toUpperCase()}`,
          partyName: opener?.name ?? opener?.email ?? 'User',
          partyRole: 'User',
          issueLabel: pick?.title ? `Pick · ${pick.title}` : dispute.reason,
          priorityLabel: 'Normal',
          priorityTone: 'normal',
          status: dispute.status,
          statusLabel,
          statusTone,
          createdAt: dispute.createdAt,
          createdLabel: formatSupportWhen(dispute.createdAt),
          slaAtRisk:
            isOpenDisputeStatus(dispute.status) && now - dispute.createdAt >= SLA_AT_RISK_MS,
        });
      }
    }

    if (queue === 'all' || queue === 'billing' || queue === 'chargeback') {
      const billingRows = await ctx.db.query('billingCases').order('desc').take(limit);
      for (const billingCase of billingRows) {
        if (queue === 'chargeback' && billingCase.issueType !== 'chargeback') continue;
        if (args.status && billingCase.status !== args.status) continue;
        if (args.urgentOnly && billingCase.priority !== 'urgent') continue;

        const subscriber = await ctx.db.get(billingCase.subscriberId);
        const issueLabel =
          billingCase.issueType === 'chargeback'
            ? 'Chargeback'
            : billingCase.issueType === 'content'
              ? 'Content dispute'
              : billingCase.issueType === 'accidental'
                ? 'Accidental charge'
                : 'Subscription issue';

        const statusTone =
          billingCase.status === 'refunded'
            ? 'green'
            : billingCase.status === 'denied' || billingCase.status === 'closed'
              ? 'mute'
              : billingCase.status === 'escalated'
                ? 'red'
                : 'amber';

        const statusLabel = billingCase.status
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        rows.push({
          kind: 'billing',
          id: billingCase._id,
          ticketLabel: billingCase.caseNumber,
          partyName: subscriber?.name ?? subscriber?.email ?? 'Subscriber',
          partyRole: 'Subscriber',
          issueLabel,
          priorityLabel: billingCase.priority === 'urgent' ? 'High' : 'Normal',
          priorityTone: billingCase.priority === 'urgent' ? 'urgent' : 'normal',
          status: billingCase.status,
          statusLabel,
          statusTone,
          createdAt: billingCase.createdAt,
          createdLabel: formatSupportWhen(billingCase.createdAt),
          slaAtRisk:
            isOpenBillingStatus(billingCase.status) &&
            now - billingCase.createdAt >= SLA_AT_RISK_MS,
        });
      }
    }

    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows.slice(0, limit);
  },
});

export const platformSettingsList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query('platformSettings').take(50);
  },
});

export const platformSettingsUpsert = mutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const key = args.key.trim();
    const value = args.value.trim();
    if (!key) throw new Error('Setting key is required.');

    const existing = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', (q) => q.eq('key', key))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        updatedAt: now,
        updatedByAdminId: admin._id,
      });
      await ctx.scheduler.runAfter(0, internal.audit.log, {
        actorUserId: admin._id,
        entityType: 'platformSetting',
        entityId: existing._id,
        action: 'platformSetting.updated',
        metadata: { key },
      });
      return existing._id;
    }

    const id = await ctx.db.insert('platformSettings', {
      key,
      value,
      updatedAt: now,
      updatedByAdminId: admin._id,
    });
    await ctx.scheduler.runAfter(0, internal.audit.log, {
      actorUserId: admin._id,
      entityType: 'platformSetting',
      entityId: id,
      action: 'platformSetting.created',
      metadata: { key },
    });
    return id;
  },
});

const moderationItemType = v.union(
  v.literal('all'),
  v.literal('event'),
  v.literal('application'),
  v.literal('dispute'),
  v.literal('billing'),
);

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
    const reviewingDisputes = await ctx.db
      .query('disputes')
      .withIndex('by_status', (q) => q.eq('status', 'under_review'))
      .take(500);
    const submittedApps = await ctx.db
      .query('applications')
      .withIndex('by_status', (q) => q.eq('status', 'submitted'))
      .take(500);
    const flaggedApps = await ctx.db
      .query('applications')
      .withIndex('by_status', (q) => q.eq('status', 'flagged'))
      .take(500);
    const reviewApps = await ctx.db
      .query('applications')
      .withIndex('by_status', (q) => q.eq('status', 'review'))
      .take(500);
    const openBilling = await ctx.db
      .query('billingCases')
      .withIndex('by_status', (q) => q.eq('status', 'open'))
      .take(500);

    const pendingApplications = submittedApps.length + flaggedApps.length + reviewApps.length;
    const totalPending =
      pendingEvents.length +
      pendingApplications +
      openDisputes.length +
      reviewingDisputes.length +
      openBilling.length;
    const highPriority = flaggedApps.length + openDisputes.length;

    return {
      pendingEvents: pendingEvents.length,
      openDisputes: openDisputes.length,
      reviewingDisputes: reviewingDisputes.length,
      pendingApplications,
      flaggedApplications: flaggedApps.length,
      openBilling: openBilling.length,
      totalPending,
      highPriority,
    };
  },
});

export const moderationQueue = query({
  args: {
    type: v.optional(moderationItemType),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 200, 500);
    const typeFilter = args.type ?? 'all';
    const items: Array<{
      key: string;
      itemType: 'event' | 'application' | 'dispute' | 'billing';
      entityId: string;
      subject: string;
      creatorLabel: string;
      reason: string;
      severity: 'critical' | 'high' | 'normal';
      status: string;
      createdAt: number;
      detail?: string;
    }> = [];

    if (typeFilter === 'all' || typeFilter === 'event') {
      const events = await ctx.db
        .query('events')
        .withIndex('by_verificationStatus', (q) => q.eq('verificationStatus', 'creator_submitted'))
        .order('desc')
        .take(limit);
      for (const event of events) {
        items.push({
          key: `event:${event._id}`,
          itemType: 'event',
          entityId: event._id,
          subject: `${event.away} @ ${event.home}`,
          creatorLabel: event.league || event.sport,
          reason: 'Creator-submitted event',
          severity: 'normal',
          status: 'Pending review',
          createdAt: event.startsAt ?? event._creationTime,
          detail: `${event.sport} · ${event.time}`,
        });
      }
    }

    if (typeFilter === 'all' || typeFilter === 'application') {
      const statuses = ['submitted', 'flagged', 'review'] as const;
      for (const status of statuses) {
        const apps = await ctx.db
          .query('applications')
          .withIndex('by_status', (q) => q.eq('status', status))
          .order('desc')
          .take(limit);
        for (const app of apps) {
          items.push({
            key: `application:${app._id}`,
            itemType: 'application',
            entityId: app._id,
            subject: app.name,
            creatorLabel: `@${app.handle}`,
            reason: status === 'flagged' ? 'Flagged application' : 'Creator application',
            severity: status === 'flagged' ? 'high' : 'normal',
            status:
              status === 'submitted' ? 'Submitted' : status === 'flagged' ? 'Flagged' : 'In review',
            createdAt: app.submittedAt,
            detail: `${app.sport} · ${app.niche}`,
          });
        }
      }
    }

    if (typeFilter === 'all' || typeFilter === 'dispute') {
      for (const status of ['open', 'under_review'] as const) {
        const disputes = await ctx.db
          .query('disputes')
          .withIndex('by_status', (q) => q.eq('status', status))
          .order('desc')
          .take(limit);
        for (const dispute of disputes) {
          const pick = await ctx.db.get(dispute.pickId);
          const creator = await ctx.db.get(dispute.creatorId);
          items.push({
            key: `dispute:${dispute._id}`,
            itemType: 'dispute',
            entityId: dispute._id,
            subject: pick?.title ?? 'Pick dispute',
            creatorLabel: creator?.handle ? `@${creator.handle}` : '—',
            reason: dispute.reason,
            severity: status === 'open' ? 'high' : 'normal',
            status: status === 'open' ? 'Open' : 'Under review',
            createdAt: dispute.createdAt,
            detail: dispute.detail,
          });
        }
      }
    }

    if (typeFilter === 'all' || typeFilter === 'billing') {
      const cases = await ctx.db
        .query('billingCases')
        .withIndex('by_status', (q) => q.eq('status', 'open'))
        .order('desc')
        .take(limit);
      for (const billingCase of cases) {
        const creator = await ctx.db.get(billingCase.creatorId);
        items.push({
          key: `billing:${billingCase._id}`,
          itemType: 'billing',
          entityId: billingCase._id,
          subject: billingCase.caseNumber,
          creatorLabel: creator?.handle ? `@${creator.handle}` : '—',
          reason: billingCase.issueType,
          severity: billingCase.priority === 'urgent' ? 'critical' : 'normal',
          status: 'Open',
          createdAt: billingCase.createdAt,
        });
      }
    }

    items.sort((a, b) => b.createdAt - a.createdAt);
    return items.slice(0, limit);
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
