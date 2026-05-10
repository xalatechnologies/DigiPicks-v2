'use node';

import * as cheerio from 'cheerio';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { withRetry } from '../shared/retry';
import { withSentry } from '../shared/sentryNode';

// =============================================================================
// ESPNcricinfo sport-source ingester (PRD §7.1, SRSD FR-EVT-002).
//
// Daily scrape of https://www.espncricinfo.com/live-cricket-match-schedule.
// Events land with `sourceType: 'sport_source'`, `providerName: 'espncricinfo'`,
// `verificationStatus: 'source_verified'`, and `sourceUrl` pointing at the
// match page so admins can spot-check.
//
// Gated behind SPORT_SOURCE_CRICKET_ENABLED — scrapers are fragile and we
// want a kill switch.
//
// Selector strategy: ESPNcricinfo renders fixtures inside `.match-info` blocks
// each containing the team names, start time, league/series, and a link to
// the match page. Layout has changed historically; the parser is defensive
// (any malformed block is skipped, never re-thrown).
// =============================================================================

const SOURCE_URL_BASE = 'https://www.espncricinfo.com';
const FIXTURES_URL = `${SOURCE_URL_BASE}/live-cricket-match-schedule`;

interface ScrapedFixture {
  externalId: string;
  series: string;
  home: string;
  away: string;
  startsAtMs: number;
  sourceUrl: string;
}

export const pollCricketFixtures = internalAction({
  args: {},
  handler: async (ctx) =>
    withSentry('sources.espncricinfo.pollCricketFixtures', async () => {
      if (process.env.SPORT_SOURCE_CRICKET_ENABLED !== 'true') {
        return { skipped: true as const, reason: 'flag-off' };
      }

    let html: string;
    try {
      const res = await withRetry(
        () =>
          fetch(FIXTURES_URL, {
            headers: {
              'User-Agent':
                'DigiPicks/1.0 (+https://digipicks.com) cricket fixture sync',
              Accept: 'text/html',
            },
          }),
        { label: 'espncricinfo fixtures', maxAttempts: 3 },
      );
      if (!res.ok) {
        console.warn(`ESPNcricinfo fetch failed: ${res.status}`);
        return { skipped: true as const, reason: `status-${res.status}` };
      }
      html = await res.text();
    } catch (err) {
      console.error('ESPNcricinfo fetch error:', err instanceof Error ? err.message : err);
      return { skipped: true as const, reason: 'fetch-error' };
    }

    const fixtures = parseFixtures(html);
    let inserted = 0;
    let updated = 0;

    for (const fx of fixtures) {
      try {
        const result = await ctx.runMutation(
          internal.sources.cricketWriter.upsertCricketFixture,
          {
            externalId: fx.externalId,
            series: fx.series,
            home: fx.home,
            away: fx.away,
            startsAtMs: fx.startsAtMs,
            sourceUrl: fx.sourceUrl,
          },
        );
        if (result === 'inserted') inserted++;
        else if (result === 'updated') updated++;
      } catch (err) {
        console.warn(
          'cricket fixture upsert failed:',
          err instanceof Error ? err.message : err,
        );
      }
    }

    console.log(
      `pollCricketFixtures: parsed ${fixtures.length} · inserted ${inserted} · updated ${updated}`,
    );
      return { skipped: false as const, parsed: fixtures.length, inserted, updated };
    }),
});

// ─── Parser ─────────────────────────────────────────────────────────────────

function parseFixtures(html: string): ScrapedFixture[] {
  const $ = cheerio.load(html);
  const fixtures: ScrapedFixture[] = [];

  // Defensive selectors — try a few likely shapes ESPNcricinfo has used.
  // Each fixture lives inside an article-like card with a link to the match
  // page (/series/.../match/<id>) and two team-name elements.
  const cards = $('a[href*="/match/"]')
    .toArray()
    .filter((node) => {
      const href = $(node).attr('href') ?? '';
      return /\/series\/[^/]+\/.+\/match\//.test(href);
    });

  const seenIds = new Set<string>();

  for (const card of cards) {
    try {
      const href = $(card).attr('href') ?? '';
      const idMatch = href.match(/\/match\/([0-9]+)/);
      if (!idMatch) continue;
      const externalId = `cricinfo-${idMatch[1]}`;
      if (seenIds.has(externalId)) continue;

      // Walk up to a parent block that holds the teams + time text.
      const block = $(card).closest('div, section, article').first();
      const text = block.text().replace(/\s+/g, ' ').trim();
      if (!text) continue;

      // Team names: ESPNcricinfo renders them as separate spans with
      // class names that include 'team'. Fall back to the link text.
      const teamEls = block.find('[class*="team" i] [class*="name" i]').toArray();
      const teams = teamEls
        .map((t) => $(t).text().trim())
        .filter(Boolean)
        .filter((s) => s.length < 60);
      if (teams.length < 2) continue;

      const series =
        block.find('[class*="series" i]').first().text().trim() ||
        block.find('[class*="competition" i]').first().text().trim() ||
        'Cricket';

      // Start time: prefer datetime attribute, fall back to text parsing.
      let startsAtMs = 0;
      const dt = block.find('time, [datetime]').first().attr('datetime');
      if (dt) startsAtMs = Date.parse(dt);
      if (!startsAtMs) {
        // Skip if we cannot place the fixture in time — DigiPicks sorts
        // events by startsAt and a 0 timestamp would land in 1970.
        continue;
      }

      seenIds.add(externalId);
      fixtures.push({
        externalId,
        series,
        home: teams[0],
        away: teams[1],
        startsAtMs,
        sourceUrl: href.startsWith('http') ? href : `${SOURCE_URL_BASE}${href}`,
      });
    } catch {
      // Defensive — never throw out of the parser; just skip the card.
    }
  }

  return fixtures;
}

