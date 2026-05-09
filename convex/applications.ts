import { query, mutation } from './_generated/server';
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
    // Check for duplicate email
    const existing = await ctx.db
      .query('applications')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    if (existing && existing.status !== 'rejected') {
      throw new Error('Application already submitted with this email');
    }

    const applicationId = await ctx.db.insert('applications', {
      name: args.name,
      handle: args.handle,
      email: args.email,
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

    return applicationId;
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
        .take(args.limit ?? 50);
    }
    return await ctx.db
      .query('applications')
      .order('desc')
      .take(args.limit ?? 50);
  },
});

// Admin-only.
/**
 * Review (approve/reject) an application. Admin-only.
 *
 * On approval we synchronously:
 *   1. Create the creator profile (returns the new creatorId).
 *   2. Patch the applicant's `users` row (by email) with creatorId +
 *      role='creator', so they pass requireCreator on next mutation.
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

    await ctx.db.patch(args.id, {
      status: args.status,
      reviewedBy: user._id,
      reviewNotes: args.reviewNotes,
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
          role: 'user',
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
