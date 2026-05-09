import { v } from 'convex/values';
import { query, internalMutation } from './_generated/server';
import { Doc, Id } from './_generated/dataModel';

// =============================================================================
// Odds Intelligence (PRD M8, Phase 6) — line movement + book comparison.
// Snapshot writes are gated by ODDS_SNAPSHOTS_ENABLED on the ingestion side.
// =============================================================================

/**
 * Latest snapshot per (book, market, side) for a given event — the data
 * shape an OddsGrid renders. Trims to the most recent N rows per group.
 */
export const byEvent = query({
  args: {
    eventId: v.id('events'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 200, 1000);
    const rows = await ctx.db
      .query('oddsSnapshots')
      .withIndex('by_event_and_capturedAt', (q) => q.eq('eventId', args.eventId))
      .order('desc')
      .take(limit);

    // Reduce to latest per (market, book, side) — first occurrence wins
    // because we ordered desc above.
    const seen = new Set<string>();
    const latest: Doc<'oddsSnapshots'>[] = [];
    for (const row of rows) {
      const key = `${row.market}|${row.book}|${row.side}|${row.point ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      latest.push(row);
    }
    return latest;
  },
});

/**
 * Time-series of one outcome across snapshots — used by LineChart to show
 * how a line moved between when the creator posted and now.
 */
export const lineMovement = query({
  args: {
    eventId: v.id('events'),
    market: v.string(),
    book: v.string(),
    side: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 200, 1000);
    const rows = await ctx.db
      .query('oddsSnapshots')
      .withIndex('by_event_market_book', (q) =>
        q.eq('eventId', args.eventId).eq('market', args.market).eq('book', args.book),
      )
      .order('asc')
      .take(limit);
    return rows.filter((r) => r.side === args.side);
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// Internal — bulk ingestion called by oddsApi.pollUpcoming
// ═══════════════════════════════════════════════════════════════════════════

export const _writeSnapshots = internalMutation({
  args: {
    eventId: v.id('events'),
    externalEventId: v.optional(v.string()),
    snapshots: v.array(
      v.object({
        market: v.string(),
        book: v.string(),
        bookTitle: v.string(),
        side: v.string(),
        price: v.number(),
        point: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let count = 0;
    for (const snap of args.snapshots) {
      await ctx.db.insert('oddsSnapshots', {
        eventId: args.eventId,
        externalEventId: args.externalEventId,
        market: snap.market,
        book: snap.book,
        bookTitle: snap.bookTitle,
        side: snap.side,
        price: snap.price,
        point: snap.point,
        capturedAt: now,
      });
      count++;
    }
    return count;
  },
});

export const _findEventByExternalId = internalMutation({
  args: { externalId: v.string() },
  handler: async (ctx, args): Promise<Id<'events'> | null> => {
    const event = await ctx.db
      .query('events')
      .withIndex('by_external_id', (q) => q.eq('externalId', args.externalId))
      .first();
    return event?._id ?? null;
  },
});
