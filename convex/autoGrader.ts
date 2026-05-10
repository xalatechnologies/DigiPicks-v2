import {
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { v } from 'convex/values';

// =============================================================================
// Auto-grader (Phase 16a, M09).
//
// 15-min cron iterates `events` with `status='completed'` + scores set.
// For each event, finds all `pending` picks via the new
// by_event_and_status index, parses the market + selection vs the score,
// and grades the pick atomically. NFR-006 grading immutability stands —
// `picks.grade` rejects re-grades by design.
//
// Aggressive mode (per the user's explicit decision): grade any pick
// where the market is one we recognize and the parser produces an
// unambiguous result. Unrecognized markets land in the manual queue
// (notification to admins) but stay in `pending` so admin can grade.
//
// Markets recognized:
//   - h2h / moneyline   → winning team
//   - spread            → side ± line vs score diff
//   - total / over/under → over/under line vs combined score
//
// American odds parsed for net-units calc.
// =============================================================================

interface GradeResult {
  grade: 'win' | 'loss' | 'push';
  netUnits: string;
}

/** "+150" / "-110" → decimal odds (1.5 / 1.909). Returns null when unparseable. */
function americanToDecimal(odds: string): number | null {
  const m = odds.trim().match(/^([+-]?)(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const sign = m[1];
  const n = Number(m[2]);
  if (!Number.isFinite(n) || n === 0) return null;
  if (sign === '-') return 1 + 100 / n;
  // '+' or no sign → positive American
  return 1 + n / 100;
}

/** "2u" / "1.5u" → 2 / 1.5. Defaults to 1 when unparseable. */
function parseUnits(units: string | undefined): number {
  if (!units) return 1;
  const m = units.match(/(\d+(?:\.\d+)?)/);
  if (!m) return 1;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : 1;
}

/** Format `+0.91u` / `-1u` / `0u`. */
function formatNet(n: number): string {
  if (n === 0) return '0u';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2).replace(/\.00$/, '').replace(/0$/, '')}u`;
}

function netUnitsForOutcome(
  grade: 'win' | 'loss' | 'push',
  units: number,
  oddsStr: string,
): string {
  if (grade === 'push') return formatNet(0);
  if (grade === 'loss') return formatNet(-units);
  // win
  const decimal = americanToDecimal(oddsStr);
  if (decimal === null) return formatNet(units); // fallback: even money
  const profit = units * (decimal - 1);
  return formatNet(profit);
}

/** Parse the line component from a selection like "Chiefs -2.5" / "Over 224.5". */
function parseLine(selection: string): number | null {
  const m = selection.match(/([+-]?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/**
 * Detect whether a selection refers to the home or away side. Matches
 * the team's last word ("Chiefs" out of "Kansas City Chiefs") first
 * because creators usually post the mascot only; falls back to full
 * substring match.
 */
function detectSide(
  selection: string,
  home: string,
  away: string,
): 'home' | 'away' | null {
  const s = selection.toLowerCase();
  const homeWords = home.toLowerCase().split(/\s+/);
  const awayWords = away.toLowerCase().split(/\s+/);
  const homeMascot = homeWords[homeWords.length - 1];
  const awayMascot = awayWords[awayWords.length - 1];

  // If both mascots match (e.g. "Tigers" hits both home and away), bail
  // out so we don't pick the wrong side.
  const homeHit = Boolean(homeMascot && s.includes(homeMascot));
  const awayHit = Boolean(awayMascot && s.includes(awayMascot));
  if (homeHit && awayHit) return null;
  if (homeHit) return 'home';
  if (awayHit) return 'away';

  // Fallback: full team-name substring match.
  if (s.includes(home.toLowerCase())) return 'home';
  if (s.includes(away.toLowerCase())) return 'away';
  return null;
}

function detectOverUnder(selection: string): 'over' | 'under' | null {
  const s = selection.toLowerCase();
  if (/\bover\b/.test(s) || s.startsWith('o ')) return 'over';
  if (/\bunder\b/.test(s) || s.startsWith('u ')) return 'under';
  return null;
}

function classifyMarket(market: string): 'h2h' | 'spread' | 'total' | 'unknown' {
  const m = market.toLowerCase();
  if (m.includes('moneyline') || m.includes('h2h') || m === 'ml') return 'h2h';
  if (m.includes('spread') || m.includes('runline') || m.includes('puckline')) {
    return 'spread';
  }
  if (m.includes('total') || m.includes('over') || m.includes('under') || m.includes('o/u')) {
    return 'total';
  }
  return 'unknown';
}

/** Compute the grade for a pick given the event's final scores. Returns null when unparseable. */
function gradePick(
  pick: Doc<'picks'>,
  homeScore: number,
  awayScore: number,
  homeName: string,
  awayName: string,
): GradeResult | null {
  const kind = classifyMarket(pick.market);
  const units = parseUnits(pick.units);
  const sel = pick.selection;

  if (kind === 'h2h') {
    const side = detectSide(sel, homeName, awayName);
    if (!side) return null;
    if (homeScore === awayScore) {
      return { grade: 'push', netUnits: netUnitsForOutcome('push', units, pick.odds) };
    }
    const homeWon = homeScore > awayScore;
    const won = (side === 'home' && homeWon) || (side === 'away' && !homeWon);
    const grade = won ? 'win' : 'loss';
    return { grade, netUnits: netUnitsForOutcome(grade, units, pick.odds) };
  }

  if (kind === 'spread') {
    const side = detectSide(sel, homeName, awayName);
    const line = parseLine(sel);
    if (!side || line === null) return null;
    // Spread convention: "Chiefs -3" means Chiefs need to win by more than 3.
    // Adjusted score = ourSide + line (line is signed against the side).
    const ours = side === 'home' ? homeScore : awayScore;
    const theirs = side === 'home' ? awayScore : homeScore;
    const diff = ours - theirs + line;
    if (diff === 0) {
      return { grade: 'push', netUnits: netUnitsForOutcome('push', units, pick.odds) };
    }
    const grade: 'win' | 'loss' = diff > 0 ? 'win' : 'loss';
    return { grade, netUnits: netUnitsForOutcome(grade, units, pick.odds) };
  }

  if (kind === 'total') {
    const direction = detectOverUnder(sel);
    const line = parseLine(sel);
    if (!direction || line === null) return null;
    const total = homeScore + awayScore;
    if (total === line) {
      return { grade: 'push', netUnits: netUnitsForOutcome('push', units, pick.odds) };
    }
    const isOver = total > line;
    const won = (direction === 'over' && isOver) || (direction === 'under' && !isOver);
    const grade = won ? 'win' : 'loss';
    return { grade, netUnits: netUnitsForOutcome(grade, units, pick.odds) };
  }

  return null;
}

// ─── Internal helpers ───────────────────────────────────────────────────────

export const _completedEventsAwaitingGrades = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Bounded scan: completed events with both scores set. The cron
    // window keeps this small in practice.
    const rows = await ctx.db
      .query('events')
      .withIndex('by_status_and_startsAt', (q) => q.eq('status', 'completed'))
      .order('desc')
      .take(200);
    return rows.filter(
      (e) =>
        typeof e.homeScore === 'number' &&
        typeof e.awayScore === 'number',
    );
  },
});

export const _pendingPicksForEvent = internalQuery({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('picks')
      .withIndex('by_event_and_status', (q) =>
        q.eq('eventId', args.eventId).eq('status', 'published'),
      )
      .take(500);
  },
});

export const _gradeOnePick = internalMutation({
  args: {
    pickId: v.id('picks'),
    eventId: v.id('events'),
  },
  handler: async (
    ctx,
    args,
  ): Promise<'graded' | 'already_graded' | 'unparseable' | 'no_event'> => {
    const pick = await ctx.db.get(args.pickId);
    if (!pick) return 'no_event';
    if (pick.grade && pick.grade !== 'pending') return 'already_graded';

    const event = await ctx.db.get(args.eventId);
    if (!event) return 'no_event';
    if (typeof event.homeScore !== 'number' || typeof event.awayScore !== 'number') {
      return 'no_event';
    }

    const result = gradePick(
      pick,
      event.homeScore,
      event.awayScore,
      event.home,
      event.away,
    );
    if (!result) return 'unparseable';

    await ctx.db.patch(args.pickId, {
      grade: result.grade,
      netUnits: result.netUnits,
      gradedAt: Date.now(),
    });

    await ctx.runMutation(internal.audit.log, {
      entityType: 'pick',
      entityId: args.pickId,
      action: `pick.graded.${result.grade}`,
      metadata: { netUnits: result.netUnits, autoGraded: true },
    });

    // Fan-out to subscribers + savers (M13).
    await ctx.scheduler.runAfter(0, internal.notify.onPickGraded, {
      pickId: args.pickId,
    });

    return 'graded';
  },
});

// ─── Cron entrypoint ────────────────────────────────────────────────────────

/**
 * Hourly cron handler. Iterates completed events, grades their pending
 * picks. Aggressive parsing per the policy decision — h2h / spread /
 * total markets all auto-grade. Unparseable picks stay `pending` until
 * an admin grades manually.
 */
export const gradeCompletedPicks = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ events: number; graded: number; unparseable: number; alreadyGraded: number }> => {
    const events = await ctx.runQuery(
      internal.autoGrader._completedEventsAwaitingGrades,
      {},
    );
    let graded = 0;
    let unparseable = 0;
    let alreadyGraded = 0;
    for (const ev of events) {
      const picks: Doc<'picks'>[] = await ctx.runQuery(
        internal.autoGrader._pendingPicksForEvent,
        { eventId: ev._id },
      );
      for (const p of picks) {
        const outcome: 'graded' | 'already_graded' | 'unparseable' | 'no_event' =
          await ctx.runMutation(internal.autoGrader._gradeOnePick, {
            pickId: p._id,
            eventId: ev._id,
          });
        if (outcome === 'graded') graded++;
        else if (outcome === 'unparseable') unparseable++;
        else if (outcome === 'already_graded') alreadyGraded++;
      }
    }
    return { events: events.length, graded, unparseable, alreadyGraded };
  },
});

// Exported for tests — pure functions with no Convex dependency.
export const _testHooks = {
  americanToDecimal,
  parseUnits,
  parseLine,
  detectSide,
  detectOverUnder,
  classifyMarket,
  gradePick,
};

// Quiet "unused" lint when only types are imported.
export type _IdUnused = Id<'picks'>;
