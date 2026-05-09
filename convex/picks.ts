import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { pickAccess, pickConfidence, pickStatus, pickGrade } from './shared/validators';
import { requireCreatorOwnership } from './shared/permissions';
import { gateOnMfaIfEnrolled } from './mfa';
import { internal } from './_generated/api';

// =============================================================================
// Pick Queries & Mutations
// =============================================================================

// Public.
export const feed = query({
  args: {
    sport: v.optional(v.string()),
    access: v.optional(pickAccess),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    if (args.sport) {
      return await ctx.db
        .query('picks')
        .withIndex('by_sport', (q) => q.eq('sport', args.sport!))
        .order('desc')
        .take(limit);
    } else if (args.access) {
      return await ctx.db
        .query('picks')
        .withIndex('by_access', (q) => q.eq('access', args.access!))
        .order('desc')
        .take(limit);
    }
    return await ctx.db
      .query('picks')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(limit);
  },
});

// Public.
export const byCreator = query({
  args: { creatorId: v.id('creators'), limit: v.optional(v.number()) },
  handler: async (ctx, { creatorId, limit }) => {
    return await ctx.db
      .query('picks')
      .withIndex('by_creator', (q) => q.eq('creatorId', creatorId))
      .order('desc')
      .take(limit ?? 20);
  },
});

// Creator-only.
/** Create a new pick. Caller must own the creator profile (or be admin). */
export const create = mutation({
  args: {
    creatorId: v.id('creators'),
    access: pickAccess,
    sport: v.string(),
    league: v.string(),
    eventId: v.optional(v.id('events')),
    eventName: v.string(),
    eventTime: v.string(),
    title: v.string(),
    market: v.string(),
    selection: v.string(),
    odds: v.string(),
    units: v.string(),
    confidence: pickConfidence,
    body: v.optional(v.string()),
    teaser: v.optional(v.string()),
    status: v.optional(pickStatus),
    /** Required when status='scheduled' — must be in the future. */
    publishAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireCreatorOwnership(ctx, args.creatorId);
    // Sensitive mutation gate — soft variant lets non-enrolled creators
    // keep publishing; enrolled creators must have a fresh MFA code.
    await gateOnMfaIfEnrolled(ctx, user._id);

    const now = Date.now();
    const status = args.status ?? 'draft';

    if (status === 'scheduled') {
      if (!args.publishAt) {
        throw new Error('publishAt is required when status=scheduled');
      }
      if (args.publishAt <= now) {
        throw new Error('publishAt must be in the future for scheduled picks');
      }
    }

    const pickId = await ctx.db.insert('picks', {
      creatorId: args.creatorId,
      access: args.access,
      sport: args.sport,
      league: args.league,
      eventId: args.eventId,
      eventName: args.eventName,
      eventTime: args.eventTime,
      title: args.title,
      market: args.market,
      selection: args.selection,
      odds: args.odds,
      units: args.units,
      confidence: args.confidence,
      body: args.body,
      teaser: args.teaser,
      status,
      grade: 'pending',
      publishedAt: status === 'published' ? now : undefined,
      publishAt: status === 'scheduled' ? args.publishAt : undefined,
      createdAt: now,
    });

    // AI analysis + downstream notification fanout are best-effort: schedule async.
    // Scheduled picks defer all of this to the publishDueScheduled cron run.
    if (status === 'published') {
      await ctx.scheduler.runAfter(0, internal.ai.analyzePick, { pickId });
      // Per-creator Discord channel embed — one delivery per creator.
      await ctx.scheduler.runAfter(0, internal.discord.deliverPickNotification, {
        pickId,
        creatorId: args.creatorId,
      });
      // Per-subscriber fanout (in-app + push + telegram per user prefs).
      await ctx.scheduler.runAfter(0, internal.notify.onPickPublished, { pickId });
    }

    return pickId;
  },
});

// Internal-only.
/**
 * Cron handler — flip scheduled picks whose publishAt has passed into
 * 'published' state and fire the notification fan-out. Bounded scan via
 * the by_status_and_publishAt index, batch of 100 per run.
 */
export const _publishDueScheduled = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.db
      .query('picks')
      .withIndex('by_status_and_publishAt', (q) =>
        q.eq('status', 'scheduled').lte('publishAt', now),
      )
      .take(100);

    let flipped = 0;
    for (const pick of due) {
      await ctx.db.patch(pick._id, {
        status: 'published',
        publishedAt: now,
        publishAt: undefined,
      });
      // Schedule downstream fan-out — same chain picks.create uses.
      await ctx.scheduler.runAfter(0, internal.ai.analyzePick, {
        pickId: pick._id,
      });
      await ctx.scheduler.runAfter(0, internal.discord.deliverPickNotification, {
        pickId: pick._id,
        creatorId: pick.creatorId,
      });
      await ctx.scheduler.runAfter(0, internal.notify.onPickPublished, {
        pickId: pick._id,
      });
      flipped++;
    }
    return { flipped };
  },
});

// Internal-only.
/**
 * Grade a pick. Internal only — called by platform/cron, not clients.
 *
 * NFR-006 (data integrity): grading is immutable once finalized. A pick that
 * already carries a terminal grade (win/loss/push) cannot be re-graded — the
 * patch is rejected so historical performance numbers cannot be rewritten.
 */
export const grade = internalMutation({
  args: {
    id: v.id('picks'),
    grade: pickGrade,
    netUnits: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pick = await ctx.db.get(args.id);
    if (!pick) throw new Error('Pick not found');

    if (pick.grade && pick.grade !== 'pending') {
      throw new Error(
        `Pick ${args.id} is already graded as "${pick.grade}"; grade is immutable once finalized.`,
      );
    }

    await ctx.db.patch(args.id, {
      grade: args.grade,
      netUnits: args.netUnits,
      gradedAt: Date.now(),
    });

    // Fan out the grading result to subscribers + savers (FM-010 trigger).
    if (args.grade !== 'pending') {
      await ctx.scheduler.runAfter(0, internal.notify.onPickGraded, {
        pickId: args.id,
      });
    }

    return args.id;
  },
});

// Internal-only.
/** Persist AI analysis on a pick. Called by ai.analyzePick. */
export const _setAiAnalysis = internalMutation({
  args: {
    pickId: v.id('picks'),
    summary: v.string(),
    confidence: v.number(),
    reasoning: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.pickId, {
      aiSummary: args.summary,
      aiConfidence: args.confidence,
      aiReasoning: args.reasoning,
      aiModel: args.model,
      aiAnalyzedAt: Date.now(),
    });
    return args.pickId;
  },
});
