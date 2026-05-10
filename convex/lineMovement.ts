import { v } from 'convex/values';
import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';

// =============================================================================
// Line-movement alerts (PRD M8 + M14, Phase 14b).
//
// Hourly cron compares the latest oddsSnapshot per (eventId, market, book,
// side) against the previous snapshot. If implied-probability shift ≥
// LINE_MOVE_THRESHOLD_PCT, dispatch notify with kind='line_moved' to:
//   1. every active subscriber of any creator who has a published pick
//      on this event (their downstream cares),
//   2. every saved-picks user whose saved pick is on this event,
//   3. every watchlist owner whose lineMoveAbovePercent <= |shift|.
//
// Bounded scan via the existing by_event_market_book index. Per-event
// dedup via entityKey so successive small ticks don't spam the inbox.
// =============================================================================

const DEFAULT_THRESHOLD_PCT = 5;
const SCAN_WINDOW_MS = 6 * 60 * 60 * 1000; // 6h — covers 1h cron + slack

type Snapshot = Doc<'oddsSnapshots'>;

interface MovementCandidate {
  eventId: Id<'events'>;
  market: string;
  book: string;
  side: string;
  fromPrice: number;
  toPrice: number;
  fromImpliedPct: number;
  toImpliedPct: number;
  /** Signed percentage point shift, e.g. +6 means probability rose 6pts. */
  shiftPct: number;
}

/** Decimal-odds → implied probability percentage. */
function impliedPct(decimal: number): number {
  if (decimal <= 1) return 0;
  return (1 / decimal) * 100;
}

export const _recentSnapshots = internalQuery({
  args: {},
  handler: async (ctx): Promise<Snapshot[]> => {
    const cutoff = Date.now() - SCAN_WINDOW_MS;
    const rows = await ctx.db.query('oddsSnapshots').order('desc').take(5000);
    return rows.filter((r) => r.capturedAt >= cutoff);
  },
});

export const _eventContext = internalQuery({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const picks = await ctx.db
      .query('picks')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(500);
    const eventPicks = picks.filter((p) => p.eventId === args.eventId);
    const creatorIds = new Set(eventPicks.map((p) => p.creatorId));

    const subs: Id<'users'>[] = [];
    for (const cid of creatorIds) {
      const creatorSubs = await ctx.db
        .query('subscriptions')
        .withIndex('by_creator', (q) => q.eq('creatorId', cid))
        .take(2000);
      for (const s of creatorSubs) {
        if (s.status === 'active') subs.push(s.subscriberId);
      }
    }

    const savers: Id<'users'>[] = [];
    for (const p of eventPicks) {
      const rows = await ctx.db
        .query('savedPicks')
        .withIndex('by_pick', (q) => q.eq('pickId', p._id))
        .take(2000);
      for (const r of rows) savers.push(r.userId);
    }

    return {
      pickIds: eventPicks.map((p) => p._id),
      creatorIds: Array.from(creatorIds),
      subscriberUserIds: Array.from(new Set(subs)),
      saverUserIds: Array.from(new Set(savers)),
    };
  },
});

export const _recordEntityKey = internalMutation({
  args: { eventId: v.id('events'), shiftPct: v.number() },
  handler: async (_ctx, args) => {
    // No-op for now — dedup lives on the in-app row via notify.dispatch's
    // entityKey 5-min window. Reserved for future per-event cooldown.
    void args;
  },
});

/** Detect movement candidates from the recent snapshot window. */
function detect(snapshots: Snapshot[], threshold: number): MovementCandidate[] {
  // Group snapshots per (event, market, book, side) — keyed string.
  const groups = new Map<string, Snapshot[]>();
  for (const s of snapshots) {
    const key = `${s.eventId}|${s.market}|${s.book}|${s.side}|${s.point ?? ''}`;
    const arr = groups.get(key) ?? [];
    arr.push(s);
    groups.set(key, arr);
  }
  const out: MovementCandidate[] = [];
  for (const arr of groups.values()) {
    if (arr.length < 2) continue;
    arr.sort((a, b) => a.capturedAt - b.capturedAt);
    const first = arr[0];
    const last = arr[arr.length - 1];
    const fromPct = impliedPct(first.price);
    const toPct = impliedPct(last.price);
    const shift = toPct - fromPct;
    if (Math.abs(shift) < threshold) continue;
    out.push({
      eventId: first.eventId,
      market: first.market,
      book: first.book,
      side: first.side,
      fromPrice: first.price,
      toPrice: last.price,
      fromImpliedPct: Math.round(fromPct * 100) / 100,
      toImpliedPct: Math.round(toPct * 100) / 100,
      shiftPct: Math.round(shift * 100) / 100,
    });
  }
  return out;
}

/** Hourly cron entrypoint. */
export const pollLineMovements = internalAction({
  args: {},
  handler: async (ctx): Promise<{ scanned: number; dispatched: number }> => {
    const threshold = Number(process.env.LINE_MOVE_THRESHOLD_PCT) || DEFAULT_THRESHOLD_PCT;
    const snapshots = await ctx.runQuery(internal.lineMovement._recentSnapshots, {});
    if (snapshots.length === 0) return { scanned: 0, dispatched: 0 };

    const candidates = detect(snapshots, threshold);
    if (candidates.length === 0) return { scanned: snapshots.length, dispatched: 0 };

    const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';
    let dispatched = 0;

    for (const c of candidates) {
      const ctxData = await ctx.runQuery(internal.lineMovement._eventContext, {
        eventId: c.eventId,
      });
      const recipients = new Set<Id<'users'>>([
        ...ctxData.subscriberUserIds,
        ...ctxData.saverUserIds,
      ]);
      // Watchlist matches with a lineMoveAbovePercent threshold.
      const watching = await ctx.runQuery(internal.lineMovement._watchlistRecipients, {
        shiftPct: Math.abs(c.shiftPct),
      });
      for (const uid of watching) recipients.add(uid);

      const direction = c.shiftPct > 0 ? 'firmed' : 'drifted';
      const payload = {
        title: `${c.book} ${c.side} ${direction} ${Math.abs(c.shiftPct).toFixed(1)}%`,
        body: `${c.market} · ${c.fromImpliedPct.toFixed(1)}% → ${c.toImpliedPct.toFixed(1)}%`,
        url: `${baseUrl}/odds?event=${c.eventId}`,
        entityKey: `line-moved:${c.eventId}:${c.market}:${c.book}:${c.side}:${Math.round(c.shiftPct)}`,
        data: {
          eventId: c.eventId,
          market: c.market,
          book: c.book,
          side: c.side,
          shiftPct: c.shiftPct,
        },
      };

      await Promise.all(
        Array.from(recipients).map((userId) =>
          ctx.runAction(internal.notify.dispatch, {
            userId,
            kind: 'line_moved',
            payload,
          }),
        ),
      );
      dispatched += recipients.size;

      // M20 — fan an odds_movement event into each affected creator's
      // Discord channels (every creator with a published pick on this
      // event). Fire-and-forget; per-channel filtering happens inside
      // fanoutOutbound (alertRules.oddsMovement gate).
      for (const cid of ctxData.creatorIds) {
        await ctx.scheduler.runAfter(0, internal.discord.delivery.fanoutOutbound, {
          creatorId: cid,
          eventType: 'odds_movement',
          payload: {
            title: payload.title,
            description: payload.body,
            url: payload.url,
            relatedEntityType: 'event',
            relatedEntityId: c.eventId,
          },
        });
      }
    }

    return { scanned: snapshots.length, dispatched };
  },
});

export const _watchlistRecipients = internalQuery({
  args: { shiftPct: v.number() },
  handler: async (ctx, args): Promise<Id<'users'>[]> => {
    const rows = await ctx.db
      .query('watchlists')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .take(5000);
    const seen = new Set<Id<'users'>>();
    for (const w of rows) {
      const t = w.filter.lineMoveAbovePercent;
      if (typeof t !== 'number') continue;
      if (args.shiftPct >= t) seen.add(w.userId);
    }
    return Array.from(seen);
  },
});
