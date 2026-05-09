import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { pickAccess, pickConfidence, pickStatus, pickGrade } from './shared/validators';
import { requireCreatorOwnership } from './shared/permissions';
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
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);

    const now = Date.now();
    const status = args.status ?? 'draft';
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
      createdAt: now,
    });

    // AI analysis + downstream notification fanout are best-effort: schedule async.
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
