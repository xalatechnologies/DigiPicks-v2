import {
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

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

interface TSDBTeam {
  idTeam?: string;
  strTeam?: string;
  strSport?: string;
  strBadge?: string;
}

interface TSDBSearchResponse {
  teams: TSDBTeam[] | null;
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
        console.warn(
          `TheSportsDB search failed for "${args.name}": ${res.status}`,
        );
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

      // Prefer a team whose strSport matches our sport. Fall back to first.
      const match =
        teams.find((t) => sportMatchesTSDB(args.sport, t.strSport ?? '')) ??
        teams[0];

      badgeUrl = match?.strBadge && match.strBadge.length > 0
        ? match.strBadge
        : undefined;

      await ctx.runMutation(internal.teamLogos.upsert, {
        sport: args.sport,
        normalizedName,
        displayName: args.name,
        badgeUrl,
        source: 'thesportsdb',
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

    // Backfill events table — only when we actually got a URL.
    if (badgeUrl) {
      try {
        await ctx.runMutation(internal.events.applyLogo, {
          sport: args.sport,
          name: args.name,
          badgeUrl,
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
      source: args.source,
      notFound: args.notFound,
      resolvedAt: now,
    });
  },
});
