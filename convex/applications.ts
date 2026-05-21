import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { applicationStatus } from './shared/validators';
import { requireUser, requireAdmin } from './shared/permissions';
import { internal } from './_generated/api';
import { rateLimiter } from './shared/rateLimit';
import { gateOnMfaIfEnrolled } from './mfa';

// =============================================================================
// Applications Module — Creator application lifecycle
// =============================================================================

// Auth-only.
/** Latest creator application for the signed-in user (by account email). */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const email = user.email?.trim().toLowerCase();
    if (!email) return null;
    return await ctx.db
      .query('applications')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first();
  },
});

// Auth-only.
/** Submit a creator application. Auth-gated. */
export const submit = mutation({
  args: {
    name: v.string(),
    handle: v.string(),
    email: v.string(),
    sport: v.string(),
    niche: v.string(),
    existingFollowing: v.optional(v.string()),
    priceHint: v.optional(v.string()),
    proofCount: v.number(),
    winClaim: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await rateLimiter.limit(ctx, 'applicationsSubmit', {
      key: user._id,
      throws: true,
    });
    const accountEmail = user.email?.trim().toLowerCase();
    const submittedEmail = args.email.trim().toLowerCase();
    const email = accountEmail ?? submittedEmail;
    if (!email) {
      throw new Error('Add an email to your DigiPicks account before applying.');
    }
    if (accountEmail && accountEmail !== submittedEmail) {
      throw new Error('Application email must match your signed-in account.');
    }

    // Check for duplicate email
    const existing = await ctx.db
      .query('applications')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first();

    if (existing && existing.status !== 'rejected') {
      throw new Error('Application already submitted with this email');
    }

    const applicationId = await ctx.db.insert('applications', {
      name: args.name,
      handle: args.handle,
      email,
      sport: args.sport,
      niche: args.niche,
      existingFollowing: args.existingFollowing,
      priceHint: args.priceHint,
      proofCount: args.proofCount,
      winClaim: args.winClaim,
      status: 'submitted',
      submittedAt: Date.now(),
    });

    // Audit trail
    await ctx.scheduler.runAfter(0, internal.audit.log, {
      entityType: 'application',
      entityId: applicationId,
      action: 'application.submitted',
      metadata: { email: args.email, handle: args.handle },
    });

    // BPMN-006 §AI authenticity — advisory score on the applicant's
    // narrative. Fire-and-forget; submit always completes, even when
    // Anthropic is down. Output is advisory only, never auto-rejecting.
    await ctx.scheduler.runAfter(0, internal.ai.scoreApplicationAuthenticity, { applicationId });

    return applicationId;
  },
});

// Admin-only.
/** Fetch a single application by id. Admin-only. */
export const get = query({
  args: { id: v.id('applications') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

// Admin-only.
/** Queue counts for admin header, nav badge, and overview KPIs. Admin-only. */
export const queueCounts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const countStatus = async (
      status: 'submitted' | 'review' | 'more_info' | 'flagged' | 'approved' | 'rejected',
    ) => {
      const rows = await ctx.db
        .query('applications')
        .withIndex('by_status', (q) => q.eq('status', status))
        .take(500);
      return rows.length;
    };

    const submitted = await countStatus('submitted');
    const review = await countStatus('review');
    const flagged = await countStatus('flagged');
    const moreInfo = await countStatus('more_info');
    const approved = await countStatus('approved');
    const rejected = await countStatus('rejected');

    return {
      submitted,
      review,
      flagged,
      moreInfo,
      approved,
      rejected,
      /** Submitted + in-review — “new requests” in Stitch header. */
      newRequests: submitted + review,
      /** Pending tab workload (submitted + flagged). */
      pending: submitted + flagged,
    };
  },
});

// Admin-only.
/** List applications by status. Admin-only. */
export const listByStatus = query({
  args: {
    status: v.optional(applicationStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.status) {
      return await ctx.db
        .query('applications')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .order('desc')
        .take(args.limit ?? 200);
    }
    return await ctx.db
      .query('applications')
      .order('desc')
      .take(args.limit ?? 200);
  },
});

// Admin-only.
/** Append an internal admin note without changing application status. Admin-only. */
export const appendAdminNote = mutation({
  args: {
    id: v.id('applications'),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    await gateOnMfaIfEnrolled(ctx, user._id);

    const app = await ctx.db.get(args.id);
    if (!app) throw new Error('Application not found');

    const trimmed = args.body.trim();
    if (!trimmed) throw new Error('Note cannot be empty');

    const stamped = `[${new Date().toISOString()}] ${trimmed}`;
    const reviewNotes = app.reviewNotes ? `${app.reviewNotes}\n\n${stamped}` : stamped;

    await ctx.db.patch(args.id, {
      reviewNotes,
      reviewedBy: user._id,
    });

    await ctx.scheduler.runAfter(0, internal.audit.log, {
      actorUserId: user._id,
      entityType: 'application',
      entityId: args.id,
      action: 'application.note',
      metadata: { handle: app.handle, email: app.email },
    });

    return args.id;
  },
});

// Admin-only.
/**
 * Review (approve/reject) an application. Admin-only.
 *
 * On approval we synchronously:
 *   1. Create the creator profile (returns the new creatorId).
 *   2. Patch the applicant's `users` row (by email) with creatorId +
 *      creatorId set so they pass requireCreator on next mutation.
 *   3. Audit-log the transition.
 *
 * Doing this inline (rather than through the scheduler) keeps the user-side
 * flip atomic with the application status flip — no half-state where the
 * application says "approved" but the user can't access creator endpoints.
 */
export const review = mutation({
  args: {
    id: v.id('applications'),
    status: applicationStatus,
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    await gateOnMfaIfEnrolled(ctx, user._id);

    const app = await ctx.db.get(args.id);
    if (!app) throw new Error('Application not found');

    const nextNotes =
      args.reviewNotes?.trim() && args.reviewNotes.trim() !== (app.reviewNotes ?? '').trim()
        ? args.reviewNotes.trim()
        : app.reviewNotes;

    await ctx.db.patch(args.id, {
      status: args.status,
      reviewedBy: user._id,
      reviewNotes: nextNotes,
      reviewedAt: Date.now(),
    });

    if (args.status === 'approved') {
      const creatorId = await ctx.runMutation(internal.creators.create, {
        handle: app.handle,
        name: app.name,
        avatarColor: '#1c9cf0',
        avatarMono: app.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        niche: app.niche,
        sports: [app.sport],
        bio: `${app.niche} creator`,
        startingPrice: 29,
        tags: [app.sport, app.niche],
        status: 'active',
      });

      // Link the applicant's user account to their fresh creator profile.
      const applicant = await ctx.db
        .query('users')
        .withIndex('email', (q) => q.eq('email', app.email))
        .first();
      if (applicant) {
        await ctx.db.patch(applicant._id, {
          creatorId,
        });
      }
    }

    // Audit trail — append-only.
    await ctx.scheduler.runAfter(0, internal.audit.log, {
      actorUserId: user._id,
      entityType: 'application',
      entityId: args.id,
      action: `application.${args.status}`,
      metadata: { handle: app.handle, email: app.email },
    });

    return args.id;
  },
});

/**
 * BPMN-006 §AI authenticity — persist the advisory score from
 * internal.ai.scoreApplicationAuthenticity. Idempotent: a re-run just
 * overwrites the previous score + reasoning.
 */
export const _setAuthenticityScore = internalMutation({
  args: {
    applicationId: v.id('applications'),
    score: v.number(),
    reasoning: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.applicationId, {
      aiAuthenticityScore: args.score,
      aiAuthenticityReasoning: args.reasoning,
      aiAuthenticityScoredAt: Date.now(),
    });
    return null;
  },
});
