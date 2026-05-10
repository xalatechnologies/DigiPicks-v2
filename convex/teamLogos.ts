import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { requireAdmin } from './shared/permissions';
import type { Id } from './_generated/dataModel';

// =============================================================================
// Team Logos — Resolve and cache team badge URLs from TheSportsDB.
//
// TheSportsDB free key '3' is used for lookups (no env var required).
// Docs: https://www.thesportsdb.com/documentation
//
// Flow per team:
//   1. Normalize the team name (mirrors apps/web/src/lib/teamLogo.ts).
//   2. Check teamLogos cache by (sport, normalizedName).
//      - If badgeUrl set OR notFound = true, exit (idempotent).
//   3. Otherwise call /searchteams.php?t=<name>.
//   4. Pick the best matching team for the sport, write to cache.
//   5. Backfill all events with this (sport, name) via events.applyLogo.
//
// Errors are logged and swallowed; we write notFound on any failure path
// so we don't keep retrying broken lookups.
// =============================================================================

const SPORTS_DB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

/**
 * Normalize a team name for cache key matching.
 * Mirrors the function in apps/web/src/lib/teamLogo.ts so client-side
 * lookups (when those exist) hit the same cache rows.
 */
export function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining marks (accents)
    .toLowerCase()
    .replace(/[.()]/g, '')
    .replace(/\b(fc|afc|cf|sc|ac|club|the)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map our schema sport name to TheSportsDB's strSport values for matching.
 * TheSportsDB uses different conventions, e.g. 'American Football'.
 */
function sportMatchesTSDB(ourSport: string, tsdbSport: string): boolean {
  if (!tsdbSport) return false;
  const ours = ourSport.toLowerCase();
  const theirs = tsdbSport.toLowerCase();
  if (theirs.includes(ours) || ours.includes(theirs)) return true;
  const aliases: Record<string, string[]> = {
    football: ['american football'],
    hockey: ['ice hockey'],
    soccer: ['soccer'],
    mma: ['fighting', 'mixed martial arts'],
    rugby: ['rugby', 'rugby league', 'rugby union'],
  };
  const a = aliases[ours];
  if (a && a.some((alias) => theirs.includes(alias))) return true;
  return false;
}

// =============================================================================
// Wikipedia fallback — covers most pro teams that TheSportsDB misses, with
// CC-BY-SA / public-domain licensing on Wikimedia Commons assets. We try a
// handful of candidate page titles per sport (full name → "F.C." suffix →
// "Football Club" suffix → opensearch) and grab the first hit's thumbnail.
// =============================================================================

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const WIKI_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary';

interface WikipediaSummary {
  type?: string;
  title?: string;
  thumbnail?: { source?: string; width?: number; height?: number };
  originalimage?: { source?: string };
}

/** Generate candidate Wikipedia page titles for (sport, name). Order
 *  matters — earlier candidates are higher-confidence direct hits. */
function wikipediaCandidates(sport: string, name: string): string[] {
  const trimmed = name.trim();
  const sportLower = sport.toLowerCase();
  const out: string[] = [trimmed];
  if (sportLower === 'soccer') {
    out.push(`${trimmed} F.C.`);
    out.push(`${trimmed} FC`);
    out.push(`${trimmed} Football Club`);
    out.push(`${trimmed} (football club)`);
  } else if (sportLower === 'cricket') {
    out.push(`${trimmed} (cricket)`);
  } else if (sportLower === 'football') {
    out.push(`${trimmed} (American football)`);
  } else if (sportLower === 'basketball') {
    out.push(`${trimmed} (basketball)`);
  } else if (sportLower === 'baseball') {
    out.push(`${trimmed} (baseball)`);
  } else if (sportLower === 'hockey' || sportLower === 'ice hockey') {
    out.push(`${trimmed} (ice hockey)`);
  }
  return out;
}

async function fetchFromWikipedia(sport: string, name: string): Promise<string | undefined> {
  // 1. Try direct title candidates. The REST summary endpoint follows
  //    redirects automatically, so "Manchester United F.C." resolves
  //    even when Wikipedia stores the page at a slightly different
  //    title. Returns the page thumbnail when present.
  for (const candidate of wikipediaCandidates(sport, name)) {
    try {
      const res = await fetch(
        `${WIKI_SUMMARY}/${encodeURIComponent(candidate.replace(/ /g, '_'))}`,
        { headers: { 'User-Agent': 'DigiPicks/1.0 (logo-resolver)' } },
      );
      if (!res.ok) continue;
      const data = (await res.json()) as WikipediaSummary;
      const url = data.originalimage?.source ?? data.thumbnail?.source;
      if (url) return url;
    } catch {
      // ignore — try next candidate
    }
  }
  // 2. Fallback to opensearch with sport context. Less reliable but
  //    catches edge cases (mascots-only names, regional clubs).
  try {
    const sportContext = sport.toLowerCase() === 'football' ? 'NFL' : sport;
    const search = `${name} ${sportContext}`;
    const res = await fetch(
      `${WIKI_API}?action=opensearch&search=${encodeURIComponent(search)}&limit=1&format=json&namespace=0`,
      { headers: { 'User-Agent': 'DigiPicks/1.0 (logo-resolver)' } },
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as [string, string[], string[], string[]];
    const title = data[1]?.[0];
    if (!title) return undefined;
    const sumRes = await fetch(`${WIKI_SUMMARY}/${encodeURIComponent(title.replace(/ /g, '_'))}`, {
      headers: { 'User-Agent': 'DigiPicks/1.0 (logo-resolver)' },
    });
    if (!sumRes.ok) return undefined;
    const sumData = (await sumRes.json()) as WikipediaSummary;
    return sumData.originalimage?.source ?? sumData.thumbnail?.source;
  } catch {
    return undefined;
  }
}

interface TSDBTeam {
  idTeam?: string;
  strTeam?: string;
  strTeamAlternate?: string;
  strSport?: string;
  strLeague?: string;
  strCountry?: string;
  strBadge?: string;
}

interface TSDBSearchResponse {
  teams: TSDBTeam[] | null;
}

/**
 * Score a TheSportsDB team result against the (sport, queried name).
 * Returns -1 when the sport doesn't match — those rows are dropped.
 *
 * Scoring rationale:
 *   100  exact normalized name match on strTeam or strTeamAlternate
 *    70  whole-word containment in either direction
 *    40  partial substring containment (last-resort partial match)
 *     0  same sport but no name overlap (almost certainly wrong team)
 *    -1  sport doesn't match — drop the candidate entirely
 *
 * The threshold for "good enough to cache" is 40. Anything below writes
 * notFound so we never cache a wrong-team logo and never poll again.
 */
function scoreTeamMatch(ourSport: string, ourName: string, team: TSDBTeam): number {
  if (!sportMatchesTSDB(ourSport, team.strSport ?? '')) return -1;
  const ours = normalize(ourName);
  const candidates = [team.strTeam, team.strTeamAlternate]
    .filter((s): s is string => Boolean(s))
    .map((s) => normalize(s));
  for (const cand of candidates) {
    if (!cand) continue;
    if (cand === ours) return 100;
  }
  // Whole-word containment — split on spaces and check overlap.
  const oursTokens = ours.split(' ').filter(Boolean);
  for (const cand of candidates) {
    const candTokens = cand.split(' ').filter(Boolean);
    const allOursIn = oursTokens.every((t) => candTokens.includes(t));
    const allCandIn = candTokens.every((t) => oursTokens.includes(t));
    if (allOursIn || allCandIn) return 70;
  }
  for (const cand of candidates) {
    if (cand.includes(ours) || ours.includes(cand)) return 40;
  }
  return 0;
}

/**
 * Resolve a single (sport, team name) → badge URL via TheSportsDB,
 * cache the result, and backfill any events that reference this team.
 *
 * Idempotent: re-running for the same team is a no-op when cached.
 */
export const resolveOne = internalAction({
  args: {
    sport: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedName = normalize(args.name);
    if (!normalizedName) return;

    // Check cache via mutation-side query? We need a query helper, so we
    // call upsert with an "if exists, skip" check by reading first.
    const existing = await ctx.runQuery(internal.teamLogos.findByKey, {
      sport: args.sport,
      normalizedName,
    });
    if (existing && (existing.badgeUrl || existing.notFound)) {
      return; // already resolved or known-missing
    }

    let badgeUrl: string | undefined;
    try {
      const url = `${SPORTS_DB_BASE}/searchteams.php?t=${encodeURIComponent(args.name)}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`TheSportsDB search failed for "${args.name}": ${res.status}`);
        await ctx.runMutation(internal.teamLogos.upsert, {
          sport: args.sport,
          normalizedName,
          displayName: args.name,
          notFound: true,
        });
        return;
      }

      const data = (await res.json()) as TSDBSearchResponse;
      const teams = Array.isArray(data?.teams) ? data.teams : null;

      if (!teams || teams.length === 0) {
        await ctx.runMutation(internal.teamLogos.upsert, {
          sport: args.sport,
          normalizedName,
          displayName: args.name,
          notFound: true,
        });
        return;
      }

      // Score every candidate; require a match score ≥ 40 within the
      // right sport. Falling back to teams[0] caused wrong logos on
      // common-name teams (e.g. "Cardinals" routing across sports, or
      // the wrong Liverpool variant). We'd rather cache `notFound` and
      // render colored initials than render a confidently-wrong badge.
      let bestScore = -1;
      let match: TSDBTeam | undefined;
      for (const t of teams) {
        const score = scoreTeamMatch(args.sport, args.name, t);
        if (score > bestScore) {
          bestScore = score;
          match = t;
        }
      }

      // No good TheSportsDB match → fall through to Wikipedia, which has
      // much broader pro-sports coverage and CC-BY-SA / public-domain
      // licensing on Wikimedia Commons assets.
      if (match && bestScore >= 40 && match.strBadge && match.strBadge.length > 0) {
        badgeUrl = match.strBadge;
      } else {
        const wikiUrl = await fetchFromWikipedia(args.sport, args.name);
        if (wikiUrl) {
          badgeUrl = wikiUrl;
        } else {
          await ctx.runMutation(internal.teamLogos.upsert, {
            sport: args.sport,
            normalizedName,
            displayName: args.name,
            notFound: true,
            source: 'thesportsdb+wikipedia',
          });
          return;
        }
      }

      // Download the badge into Convex storage. The upstream URL is kept
      // for traceability, but the UI reads from our own bucket so links
      // never break when the third party rotates a path.
      let storageId: Id<'_storage'> | undefined;
      let storageUrl: string | undefined;
      let storageMime: string | undefined;
      if (badgeUrl) {
        try {
          const imgRes = await fetch(badgeUrl);
          if (imgRes.ok) {
            storageMime = imgRes.headers.get('content-type') ?? 'image/png';
            const blob = await imgRes.blob();
            // Convex storage accepts a Blob; the returned id is the
            // canonical reference. We resolve a URL immediately so
            // subsequent reads are O(1) and never re-fetch the third
            // party.
            storageId = await ctx.storage.store(blob);
            storageUrl = (await ctx.storage.getUrl(storageId)) ?? undefined;
          } else {
            console.warn(`Logo download failed for "${args.name}": ${imgRes.status}`);
          }
        } catch (err) {
          console.warn(
            `Logo download error for "${args.name}":`,
            err instanceof Error ? err.message : err,
          );
        }
      }

      await ctx.runMutation(internal.teamLogos.upsert, {
        sport: args.sport,
        normalizedName,
        displayName: args.name,
        badgeUrl,
        storageId,
        storageUrl,
        storageMime,
        // Track which source actually returned the URL so an admin can
        // audit cache quality (TheSportsDB direct vs Wikipedia fallback).
        source: match && match.strBadge === badgeUrl ? 'thesportsdb' : 'wikipedia',
        notFound: badgeUrl ? undefined : true,
      });
    } catch (err) {
      console.error(`teamLogos.resolveOne failed for "${args.name}":`, err);
      // Persist notFound on errors so we don't retry every poll.
      await ctx.runMutation(internal.teamLogos.upsert, {
        sport: args.sport,
        normalizedName,
        displayName: args.name,
        notFound: true,
      });
      return;
    }

    // Backfill events table — prefer the storage URL (own bucket) so
    // legacy events get a stable link even if the upstream rotates.
    const finalUrl = badgeUrl;
    if (finalUrl) {
      try {
        const cached = await ctx.runQuery(internal.teamLogos.findByKey, {
          sport: args.sport,
          normalizedName,
        });
        const preferred = cached?.storageUrl ?? finalUrl;
        await ctx.runMutation(internal.events.applyLogo, {
          sport: args.sport,
          name: args.name,
          badgeUrl: preferred,
        });
      } catch (err) {
        console.error(`events.applyLogo failed for "${args.name}":`, err);
      }
    }
  },
});

/**
 * Look up a cached team logo row by (sport, normalizedName).
 * Internal query, used by resolveOne to short-circuit repeat work.
 */
export const findByKey = internalQuery({
  args: {
    sport: v.string(),
    normalizedName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('teamLogos')
      .withIndex('by_sport_and_normalizedName', (q) =>
        q.eq('sport', args.sport).eq('normalizedName', args.normalizedName),
      )
      .first();
  },
});

/**
 * Upsert a team logo cache row. Patches if found, inserts otherwise.
 * Always stamps resolvedAt = now.
 */
export const upsert = internalMutation({
  args: {
    sport: v.string(),
    normalizedName: v.string(),
    displayName: v.string(),
    badgeUrl: v.optional(v.string()),
    storageId: v.optional(v.id('_storage')),
    storageUrl: v.optional(v.string()),
    storageMime: v.optional(v.string()),
    source: v.optional(v.string()),
    notFound: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('teamLogos')
      .withIndex('by_sport_and_normalizedName', (q) =>
        q.eq('sport', args.sport).eq('normalizedName', args.normalizedName),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        badgeUrl: args.badgeUrl ?? existing.badgeUrl,
        storageId: args.storageId ?? existing.storageId,
        storageUrl: args.storageUrl ?? existing.storageUrl,
        storageMime: args.storageMime ?? existing.storageMime,
        source: args.source ?? existing.source,
        notFound: args.notFound,
        resolvedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert('teamLogos', {
      sport: args.sport,
      normalizedName: args.normalizedName,
      displayName: args.displayName,
      badgeUrl: args.badgeUrl,
      storageId: args.storageId,
      storageUrl: args.storageUrl,
      storageMime: args.storageMime,
      source: args.source,
      notFound: args.notFound,
      resolvedAt: now,
    });
  },
});

// ─── Public surface — admin trigger + read APIs ────────────────────────────

/**
 * Pull every (sport, team) pair currently referenced by the events table
 * and schedule a `resolveOne` for each. Idempotent: cached + notFound rows
 * short-circuit inside resolveOne, so re-running only fires lookups for
 * teams that genuinely don't have a row yet. Bounded to TEAMS_PER_BATCH
 * per call; admins can re-run until the count reported is 0.
 */
const TEAMS_PER_BATCH = 200;
const EVENTS_SCAN_LIMIT = 2000;

export const _listEventTeamPairs = internalQuery({
  args: {},
  handler: async (ctx): Promise<Array<{ sport: string; name: string }>> => {
    const events = await ctx.db.query('events').take(EVENTS_SCAN_LIMIT);
    const seen = new Map<string, { sport: string; name: string }>();
    for (const e of events) {
      for (const name of [e.home, e.away]) {
        if (!name) continue;
        const key = `${e.sport}|${normalize(name)}`;
        if (!seen.has(key)) seen.set(key, { sport: e.sport, name });
      }
    }
    return Array.from(seen.values());
  },
});

/** Admin gate for the resolveAll action — actions can't call requireAdmin
 *  directly because it needs db access; this internal mutation does it
 *  inside a mutation ctx and re-throws to the caller. */
export const _adminGate = internalMutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return { ok: true as const };
  },
});

/** Shared body for resolveAll / _resolveAllInternal. Pulls (sport, name)
 *  pairs from events, deduplicates against the existing cache, and
 *  schedules `resolveOne` for each gap with a 200ms stagger.
 *
 *  We walk the FULL pair list so the `alreadyKnown` count is accurate,
 *  but cap the number of NEW resolves we schedule per call so we don't
 *  overload the upstream APIs in one burst. Re-running the action picks
 *  up where the previous batch left off. */
async function runResolveAll(
  ctx: import('./_generated/server').ActionCtx,
): Promise<{ scheduled: number; alreadyKnown: number; total: number }> {
  const pairs = await ctx.runQuery(internal.teamLogos._listEventTeamPairs, {});
  let scheduled = 0;
  let alreadyKnown = 0;
  for (const pair of pairs) {
    const cached = await ctx.runQuery(internal.teamLogos.findByKey, {
      sport: pair.sport,
      normalizedName: normalize(pair.name),
    });
    if (cached && (cached.storageUrl || cached.notFound)) {
      alreadyKnown += 1;
      continue;
    }
    if (scheduled >= TEAMS_PER_BATCH) continue;
    await ctx.scheduler.runAfter(scheduled * 200, internal.teamLogos.resolveOne, {
      sport: pair.sport,
      name: pair.name,
    });
    scheduled += 1;
  }
  return { scheduled, alreadyKnown, total: pairs.length };
}

export const resolveAll = action({
  args: {},
  handler: async (ctx): Promise<{ scheduled: number; alreadyKnown: number; total: number }> => {
    await ctx.runMutation(internal.teamLogos._adminGate, {});
    return runResolveAll(ctx);
  },
});

/** CLI-friendly variant — same body as `resolveAll` but no admin gate.
 *  Internal-only (`npx convex run teamLogos:_resolveAllInternal`). Used
 *  for one-shot ops backfills and not exposed to client apps. */
export const _resolveAllInternal = internalAction({
  args: {},
  handler: async (ctx): Promise<{ scheduled: number; alreadyKnown: number; total: number }> => {
    return runResolveAll(ctx);
  },
});

/**
 * Nuke the entire teamLogos cache + clear events.homeLogo / awayLogo.
 * Used after a resolver bug (e.g. wrong-team-fallback) cached bad rows
 * and we want to start clean. Safe — every row will be re-resolved on
 * the next `_resolveAllInternal` run.
 *
 * Bounded to RESET_BATCH per call; CLI runs the action repeatedly until
 * cleared = 0.
 */
const RESET_BATCH = 500;

export const _resetCache = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ logosDeleted: number; eventsCleared: number }> => {
    const logos = await ctx.db.query('teamLogos').take(RESET_BATCH);
    let logosDeleted = 0;
    for (const row of logos) {
      // If the row carries a Convex Storage asset, drop it too so we
      // don't leak storage bytes when the cache is rebuilt.
      if (row.storageId) {
        try {
          await ctx.storage.delete(row.storageId);
        } catch {
          // ignore — best-effort cleanup
        }
      }
      await ctx.db.delete(row._id);
      logosDeleted += 1;
    }

    const events = await ctx.db.query('events').take(RESET_BATCH);
    let eventsCleared = 0;
    for (const ev of events) {
      if (ev.homeLogo || ev.awayLogo) {
        await ctx.db.patch(ev._id, {
          homeLogo: undefined,
          awayLogo: undefined,
        });
        eventsCleared += 1;
      }
    }
    return { logosDeleted, eventsCleared };
  },
});

/**
 * Public query — returns every cached logo with a usable URL. Frontend
 * builds a (sport, normalizedName) → url map so EventCard renders never
 * round-trip per team.
 */
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 1000, 5000);
    const rows = await ctx.db.query('teamLogos').take(limit);
    return rows
      .filter((r) => r.storageUrl || r.badgeUrl)
      .map((r) => ({
        sport: r.sport,
        normalizedName: r.normalizedName,
        displayName: r.displayName,
        url: r.storageUrl ?? r.badgeUrl,
      }));
  },
});
