import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { pickAccess, pickConfidence, pickStatus, pickGrade } from './shared/validators';
import { getCurrentUser, requireCreatorOwnership } from './shared/permissions';

const ADMIN_ROLES = new Set(['super_admin', 'tenant_admin', 'admin', 'moderator']);

function canManageCreatorPicks(
  user: { creatorId?: string; role?: string } | null,
  creatorId: string,
): boolean {
  if (!user) return false;
  if (user.creatorId === creatorId) return true;
  return Boolean(user.role && ADMIN_ROLES.has(user.role));
}
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
/**
 * Cursor-paginated feed (Phase 14a). Convex paginate() — caller passes
 * the token from the previous page in `paginationOpts.cursor`. The DS
 * `LoadMore` button binds to `loadMore()` from `usePaginatedQuery`.
 */
export const feedPaginated = query({
  args: {
    sport: v.optional(v.string()),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    if (args.sport) {
      return await ctx.db
        .query('picks')
        .withIndex('by_sport', (q) => q.eq('sport', args.sport!))
        .order('desc')
        .paginate(args.paginationOpts);
    }
    return await ctx.db
      .query('picks')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .order('desc')
      .paginate(args.paginationOpts);
  },
});

/**
 * Append-only audit history for a pick — used by the "grading explanation"
 * surface (Phase 14f). Returns the audit log entries scoped to the pick,
 * ordered ascending so the surface reads as a timeline.
 */
export const gradingHistory = query({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('auditLogs')
      .withIndex('by_entity', (q) => q.eq('entityType', 'pick').eq('entityId', args.pickId))
      .order('asc')
      .take(50);
    return rows;
  },
});

// Public catalog — non-owners only see published picks.
export const byCreator = query({
  args: { creatorId: v.id('creators'), limit: v.optional(v.number()) },
  handler: async (ctx, { creatorId, limit }) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query('picks')
      .withIndex('by_creator', (q) => q.eq('creatorId', creatorId))
      .order('desc')
      .take(limit ?? 20);
    if (canManageCreatorPicks(user, creatorId)) return rows;
    return rows.filter((p) => p.status === 'published');
  },
});

/** Single pick for studio edit — creator owner or platform admin only. */
export const getForStudio = query({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => {
    const pick = await ctx.db.get(args.pickId);
    if (!pick) return null;
    const user = await getCurrentUser(ctx);
    if (!canManageCreatorPicks(user, pick.creatorId)) {
      throw new Error('Unauthorized');
    }
    return pick;
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

    // Phase 16b — premium / VIP picks must attach to an admin-verified
    // event. Closes M23: a creator can't monetize a self-submitted event
    // without admin sign-off. Free picks are unaffected so creators can
    // still seed their event before getting it verified.
    if ((args.access === 'premium' || args.access === 'vip') && args.eventId) {
      const event = await ctx.db.get(args.eventId);
      if (event && event.verificationStatus !== 'admin_verified') {
        throw new Error(
          'Premium / VIP picks require an admin-verified event. ' +
            'Submit the event for review or publish a free pick.',
        );
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
      await ctx.scheduler.runAfter(0, internal.discord.delivery.deliverPickNotification, {
        pickId,
        creatorId: args.creatorId,
      });
      // M20 — also schedule the generic outbound fanout so creators with
      // multi-channel integrations get the new_pick alert across every
      // configured outbound sync. The legacy webhook still flows through
      // deliverPickNotification above, so we don't double-post for them.
      await ctx.scheduler.runAfter(0, internal.discord.delivery.fanoutOutbound, {
        creatorId: args.creatorId,
        eventType: 'new_pick',
        payload: {
          title: args.title,
          description: args.teaser ?? args.body?.slice(0, 200) ?? '',
          relatedEntityType: 'pick',
          relatedEntityId: pickId,
          confidence:
            args.confidence === 'Low' || args.confidence === 'Medium' || args.confidence === 'High'
              ? args.confidence
              : undefined,
        },
      });
      // Per-subscriber fanout (in-app + push + telegram per user prefs).
      await ctx.scheduler.runAfter(0, internal.notify.onPickPublished, { pickId });
    }

    return pickId;
  },
});

/** Update an existing pick. Caller must own the creator profile (or be admin). */
export const update = mutation({
  args: {
    pickId: v.id('picks'),
    access: v.optional(pickAccess),
    sport: v.optional(v.string()),
    league: v.optional(v.string()),
    eventId: v.optional(v.id('events')),
    eventName: v.optional(v.string()),
    eventTime: v.optional(v.string()),
    title: v.optional(v.string()),
    market: v.optional(v.string()),
    selection: v.optional(v.string()),
    odds: v.optional(v.string()),
    units: v.optional(v.string()),
    confidence: v.optional(pickConfidence),
    body: v.optional(v.string()),
    teaser: v.optional(v.string()),
    status: v.optional(pickStatus),
    publishAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pick = await ctx.db.get(args.pickId);
    if (!pick) throw new Error('Pick not found');

    const user = await requireCreatorOwnership(ctx, pick.creatorId);
    await gateOnMfaIfEnrolled(ctx, user._id);

    const now = Date.now();
    const nextStatus = args.status ?? pick.status;

    if (nextStatus === 'scheduled') {
      const publishAt = args.publishAt ?? pick.publishAt;
      if (!publishAt) throw new Error('publishAt is required when status=scheduled');
      if (publishAt <= now) {
        throw new Error('publishAt must be in the future for scheduled picks');
      }
    }

    const nextAccess = args.access ?? pick.access;
    const nextEventId = args.eventId !== undefined ? args.eventId : pick.eventId;
    if ((nextAccess === 'premium' || nextAccess === 'vip') && nextEventId) {
      const event = await ctx.db.get(nextEventId);
      if (event && event.verificationStatus !== 'admin_verified') {
        throw new Error(
          'Premium / VIP picks require an admin-verified event. ' +
            'Submit the event for review or publish a free pick.',
        );
      }
    }

    const patch: Record<string, unknown> = {};
    if (args.access !== undefined) patch.access = args.access;
    if (args.sport !== undefined) patch.sport = args.sport;
    if (args.league !== undefined) patch.league = args.league;
    if (args.eventId !== undefined) patch.eventId = args.eventId;
    if (args.eventName !== undefined) patch.eventName = args.eventName;
    if (args.eventTime !== undefined) patch.eventTime = args.eventTime;
    if (args.title !== undefined) patch.title = args.title;
    if (args.market !== undefined) patch.market = args.market;
    if (args.selection !== undefined) patch.selection = args.selection;
    if (args.odds !== undefined) patch.odds = args.odds;
    if (args.units !== undefined) patch.units = args.units;
    if (args.confidence !== undefined) patch.confidence = args.confidence;
    if (args.body !== undefined) patch.body = args.body;
    if (args.teaser !== undefined) patch.teaser = args.teaser;
    if (args.status !== undefined) {
      patch.status = args.status;
      if (args.status === 'published' && !pick.publishedAt) {
        patch.publishedAt = now;
        patch.publishAt = undefined;
      }
      if (args.status === 'scheduled') {
        patch.publishAt = args.publishAt;
        patch.publishedAt = undefined;
      }
    } else if (args.publishAt !== undefined && pick.status === 'scheduled') {
      patch.publishAt = args.publishAt;
    }

    if (Object.keys(patch).length > 0) await ctx.db.patch(args.pickId, patch);
    return args.pickId;
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
      await ctx.scheduler.runAfter(0, internal.discord.delivery.deliverPickNotification, {
        pickId: pick._id,
        creatorId: pick.creatorId,
      });
      await ctx.scheduler.runAfter(0, internal.discord.delivery.fanoutOutbound, {
        creatorId: pick.creatorId,
        eventType: 'new_pick',
        payload: {
          title: pick.title,
          description: pick.teaser ?? pick.body?.slice(0, 200) ?? '',
          relatedEntityType: 'pick',
          relatedEntityId: pick._id,
          confidence:
            pick.confidence === 'Low' || pick.confidence === 'Medium' || pick.confidence === 'High'
              ? pick.confidence
              : undefined,
        },
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

    // Phase 14f — grading explanation surface. Append-only audit row
    // scoped to the pick so subscribers can read the result timeline.
    await ctx.runMutation(internal.audit.log, {
      entityType: 'pick',
      entityId: args.id,
      action: `pick.graded.${args.grade}`,
      metadata: { netUnits: args.netUnits ?? null },
    });

    // Fan out the grading result to subscribers + savers (FM-010 trigger).
    if (args.grade !== 'pending') {
      await ctx.scheduler.runAfter(0, internal.notify.onPickGraded, {
        pickId: args.id,
      });
      // M20 — Discord pick_graded fanout. Fire-and-forget; the action
      // logs every per-channel result and never throws.
      await ctx.scheduler.runAfter(0, internal.discord.delivery.fanoutOutbound, {
        creatorId: pick.creatorId,
        eventType: 'pick_graded',
        payload: {
          title: `Pick graded · ${args.grade}`,
          description: pick.title,
          fields: args.netUnits
            ? [{ name: 'Net units', value: args.netUnits, inline: true }]
            : undefined,
          relatedEntityType: 'pick',
          relatedEntityId: args.id,
        },
      });
      // BPMN-013 — AI grading explanation. One-sentence neutral summary
      // ("Took -3.5; final 27-21, covered by 2.5") stored on the pick
      // for the customer-facing timeline. Quietly skips when
      // ANTHROPIC_API_KEY is unset.
      await ctx.scheduler.runAfter(0, internal.ai.gradingExplanation, {
        pickId: args.id,
      });
    }

    return args.id;
  },
});

// Internal-only.
/** Persist AI analysis on a pick. Called by ai.analyzePick. */
/**
 * BPMN-013 — persist the grading-explanation sentence produced by
 * internal.ai.gradingExplanation. Idempotent: a re-run just overwrites.
 */
export const _setGradeExplanation = internalMutation({
  args: {
    pickId: v.id('picks'),
    explanation: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.pickId, {
      gradeExplanation: args.explanation,
      gradeExplanationAt: Date.now(),
    });
    return null;
  },
});

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
