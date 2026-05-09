import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { Doc } from './_generated/dataModel';
import {
  eventStatus,
  eventVisibility,
  eventParticipantType,
} from './shared/validators';
import {
  requireAdmin,
  requireCreator,
  isAdmin,
} from './shared/permissions';
import { internal } from './_generated/api';

// Public-read gate: only `public` + reviewed events surface on public
// queries. Creator-submitted events stay hidden from the public feed until
// an admin moves them to `admin_verified`. Rows missing the federated
// fields (during the backfill window) are treated as public to avoid
// disappearing real events from view. Premium/private gating wires up in
// Phase 3 alongside subscriptions.
function isPublicEvent(event: Doc<'events'>): boolean {
  const visibilityOk =
    event.visibility === undefined || event.visibility === 'public';
  const verificationOk =
    event.verificationStatus === undefined ||
    event.verificationStatus === 'source_verified' ||
    event.verificationStatus === 'admin_verified';
  return visibilityOk && verificationOk;
}

// =============================================================================
// Event Queries & Mutations
// =============================================================================

// Public.
export const today = query({
  args: { sport: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const rows = args.sport
      ? await ctx.db
          .query('events')
          .withIndex('by_sport_and_startsAt', (q) => q.eq('sport', args.sport!))
          .take(60)
      : await ctx.db.query('events').order('asc').take(60);
    return rows.filter(isPublicEvent).slice(0, 50);
  },
});

// Public.
export const featured = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('events')
      .withIndex('by_featured_and_startsAt', (q) => q.eq('featured', true))
      .take(15);
    return rows.filter(isPublicEvent).slice(0, 10);
  },
});

// Admin-only.
/** Create a new event. Admin-only. */
export const create = mutation({
  args: {
    sport: v.string(),
    league: v.string(),
    home: v.string(),
    away: v.string(),
    time: v.string(),
    startsAt: v.number(),
    featured: v.optional(v.boolean()),
    status: v.optional(eventStatus),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    return await ctx.db.insert('events', {
      sport: args.sport,
      league: args.league,
      home: args.home,
      away: args.away,
      time: args.time,
      startsAt: args.startsAt,
      creatorCount: 0,
      pickCount: 0,
      featured: args.featured ?? false,
      status: args.status ?? 'upcoming',
      title: `${args.home} vs ${args.away}`,
      sourceType: 'platform',
      visibility: 'public',
      verificationStatus: 'admin_verified',
      resultSource: 'manual_admin',
      participants: [
        { name: args.home, type: 'team' },
        { name: args.away, type: 'team' },
      ],
    });
  },
});

// Public.
/** Events currently in progress (status === 'live'). */
export const live = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('events')
      .withIndex('by_status_and_startsAt', (q) => q.eq('status', 'live'))
      .take(25);
    return rows.filter(isPublicEvent).slice(0, 20);
  },
});

/** Recently completed events. */
export const recent = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('events')
      .withIndex('by_status_and_startsAt', (q) => q.eq('status', 'completed'))
      .order('desc')
      .take(15);
    return rows.filter(isPublicEvent).slice(0, 10);
  },
});

/** Upcoming events (not yet started). */
export const upcoming = query({
  args: { sport: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const rows = args.sport
      ? await ctx.db
          .query('events')
          .withIndex('by_sport_and_startsAt', (q) => q.eq('sport', args.sport!))
          .take(25)
      : await ctx.db
          .query('events')
          .withIndex('by_status_and_startsAt', (q) => q.eq('status', 'upcoming'))
          .order('asc')
          .take(25);
    return rows.filter(isPublicEvent).slice(0, 20);
  },
});

/**
 * Backfill a team's logo URL onto all matching events for a given sport.
 *
 * Called by teamLogos.resolveOne after TheSportsDB returns a badge.
 * Scans the by_sport_and_startsAt index (capped at 200 rows) so we
 * don't load the whole table on every team resolution.
 */
export const applyLogo = internalMutation({
  args: {
    sport: v.string(),
    name: v.string(),
    badgeUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query('events')
      .withIndex('by_sport_and_startsAt', (q) => q.eq('sport', args.sport))
      .take(200);

    let patched = 0;
    for (const event of events) {
      const patch: { homeLogo?: string; awayLogo?: string } = {};
      if (event.home === args.name && event.homeLogo !== args.badgeUrl) {
        patch.homeLogo = args.badgeUrl;
      }
      if (event.away === args.name && event.awayLogo !== args.badgeUrl) {
        patch.awayLogo = args.badgeUrl;
      }
      if (patch.homeLogo || patch.awayLogo) {
        await ctx.db.patch(event._id, patch);
        patched++;
      }
    }
    return patched;
  },
});

/**
 * One-shot manual seed: schedules pollUpcoming + pollActive immediately.
 * Admin-gated. Useful for populating the events table on demand from the
 * Convex dashboard or via the /seed-events HTTP route.
 */
export const seedFromOddsApi = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    await ctx.scheduler.runAfter(0, internal.oddsApi.pollUpcoming, {});
    await ctx.scheduler.runAfter(0, internal.liveScores.pollActive, {});
    return { ok: true };
  },
});

// =============================================================================
// Federated Event Engine — creator + admin authoring (PRD §7.1, SRSD §5)
// =============================================================================

const participantsValidator = v.array(
  v.object({
    name: v.string(),
    type: eventParticipantType,
  }),
);

/**
 * Creator submits a custom event for review. Lands with
 * `verificationStatus: 'creator_submitted'` so it stays out of the public
 * feed until an admin approves it via {@link reviewEvent}. Admins can
 * author on behalf of any creator with `onBehalfOfCreatorId`.
 */
export const createByCreator = mutation({
  args: {
    sport: v.string(),
    league: v.string(),
    home: v.string(),
    away: v.string(),
    time: v.string(),
    startsAt: v.number(),
    endTime: v.optional(v.number()),
    title: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    visibility: v.optional(eventVisibility),
    participants: v.optional(participantsValidator),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireCreator(ctx);

    return await ctx.db.insert('events', {
      sport: args.sport,
      league: args.league,
      home: args.home,
      away: args.away,
      time: args.time,
      startsAt: args.startsAt,
      endTime: args.endTime,
      creatorCount: 0,
      pickCount: 0,
      featured: false,
      status: 'upcoming',
      title: args.title ?? `${args.home} vs ${args.away}`,
      sourceType: 'creator',
      sourceUrl: args.sourceUrl,
      createdByUserId: user._id,
      visibility: args.visibility ?? 'public',
      verificationStatus: 'creator_submitted',
      resultSource: 'manual_creator',
      participants: args.participants ?? [
        { name: args.home, type: 'team' },
        { name: args.away, type: 'team' },
      ],
      metadata: args.metadata,
    });
  },
});

/**
 * Admin reviews a creator-submitted event. On approval, sets
 * `verificationStatus: 'admin_verified'` (which makes it visible on the
 * public feed). On rejection, sets `verificationStatus: 'unverified'` and
 * `status: 'cancelled'` so it stays hidden and is marked terminal.
 */
export const reviewEvent = mutation({
  args: {
    eventId: v.id('events'),
    decision: v.union(v.literal('approve'), v.literal('reject')),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error('Event not found');

    if (args.decision === 'approve') {
      await ctx.db.patch(args.eventId, {
        verificationStatus: 'admin_verified',
        reviewedByAdminId: admin._id,
        ...(args.notes ? { metadata: { ...(event.metadata ?? {}), reviewNotes: args.notes } } : {}),
      });
    } else {
      await ctx.db.patch(args.eventId, {
        verificationStatus: 'unverified',
        status: 'cancelled',
        reviewedByAdminId: admin._id,
        ...(args.notes ? { metadata: { ...(event.metadata ?? {}), reviewNotes: args.notes } } : {}),
      });
    }

    return { ok: true };
  },
});

/**
 * Events authored by the current creator (any verification state).
 * Powers the "My Events" dashboard page. Admins see all creator-authored
 * events across the platform.
 */
export const byCreator = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireCreator(ctx);
    const limit = Math.min(args.limit ?? 50, 200);

    if (isAdmin(user)) {
      return await ctx.db
        .query('events')
        .withIndex('by_sourceType_and_startsAt', (q) =>
          q.eq('sourceType', 'creator'),
        )
        .order('desc')
        .take(limit);
    }

    return await ctx.db
      .query('events')
      .withIndex('by_createdByUserId', (q) =>
        q.eq('createdByUserId', user._id),
      )
      .order('desc')
      .take(limit);
  },
});

/**
 * Admin queue: creator-submitted events awaiting review.
 */
export const pendingReview = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 50, 200);

    return await ctx.db
      .query('events')
      .withIndex('by_verificationStatus', (q) =>
        q.eq('verificationStatus', 'creator_submitted'),
      )
      .order('desc')
      .take(limit);
  },
});
