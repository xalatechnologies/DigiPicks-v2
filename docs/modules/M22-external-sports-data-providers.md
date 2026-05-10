# M22 — External Sports Data Provider Layer

## Purpose
The provider abstraction. All external sports data flows through bounded
internal actions wrapped in `withRetry` (and `withSentry` for Node actions).
Today: The Odds API (events + scores + odds), TheSportsDB (team logos),
ESPNcricinfo (cricket fixtures, gated). SportsDataIO and API-SPORTS are
planned redundant adapters.

## Target Roles
Admin · System

## Core Features
- The Odds API ingestion via `oddsApi.pollUpcoming` (events) + `liveScores.pollActive` (scores) + `oddsApi.pollOddsSnapshots` (odds)
- TheSportsDB team-logo backfill via `teamLogos.resolveOne` (fire-and-forget per upsert)
- ESPNcricinfo cheerio scraper behind `SPORT_SOURCE_CRICKET_ENABLED` flag
- All providers normalize into the canonical M04 events schema
- Per-call `withRetry` (3 attempts, exponential backoff with jitter)
- Per-action `withSentry` (Node actions only) for error capture

## User Stories
- As the system, I want every provider call to retry on transient failures.
- As the system, I want a feature flag per fragile scraper so I can kill it instantly.
- As an SRE, I want errors captured to Sentry without breaking the cron chain.
- As an admin, I want to add a new provider without touching the consuming UI.

## Backend / Convex Build
**Tables**
- `events` (provider eventId via `externalId` index)
- `oddsSnapshots` (per-bookmaker history)
- `teamLogos` (TheSportsDB cache: sport, normalizedName → badgeUrl, notFound)

**Queries** — N/A (read paths live in M04 / M11)

**Mutations**
- `liveScores.upsertEvent` (internal — provider self-heals federated fields)
- `odds._writeSnapshots` (internal — bulk insert)
- `odds._findEventByExternalId` (internal — provider eventId resolver)
- `sources.cricketWriter.upsertCricketFixture` (internal — V8 mutation called from the Node scraper)
- `teamLogos.resolveOne` (internal — TheSportsDB lookup + cache write)

**Actions / Crons**
- `oddsApi.pollUpcoming` (1h) — `/v4/sports/<key>/events` (cheap, 1 credit per call)
- `oddsApi.pollOddsSnapshots` (24h, opt-in) — `/v4/sports/<key>/odds`
- `liveScores.pollActive` (60s) — `/v4/sports/<key>/scores/`
- `sources.espncricinfo.pollCricketFixtures` (24h, flag-gated, Node + cheerio)
- `streams.pollStreams` (5min) — Twitch / YouTube / Kick (M15)
- `lineMovement.pollLineMovements` (1h) — derived from snapshots (M11)

**Sport-key map** — `convex/oddsApi.ts SPORT_KEY_MAP`
- Soccer (8 leagues), Football (NFL), Basketball (NBA + EuroLeague), Baseball (MLB), Hockey (NHL), Cricket (IPL + T20), Tennis (ATP/WTA majors), MMA, Rugby

**Helpers**
- `convex/shared/retry.ts` — `withRetry({ label, maxAttempts, shouldRetry, baseDelayMs, maxDelayMs })`
- `convex/shared/sentryNode.ts` — `withSentry(label, fn)` for Node actions

## Frontend Build
**Pages** — N/A (admin verifies via cron logs / `/health`)

## Testing
**Unit**
- `withRetry` retries on retryable errors; respects max attempts; non-retryable surfaces immediately
- `parseFixtures` (ESPNcricinfo) handles malformed cards without throwing
- `teamLogos.resolveOne` caches `notFound: true` so repeat lookups don't burn quota

**Integration**
- Provider event payload → normalized `events` row with `sourceType: 'provider'`
- ESPNcricinfo card → `events` row with `sourceType: 'sport_source'`, `providerName: 'espncricinfo'`, `sourceUrl` populated

**E2E**
- Manual `/seed-events` HTTP endpoint (Bearer-token gated) triggers `pollUpcoming + pollActive` end-to-end → fresh deployment populated

## Governance / Rules
- **Provider keys are env-only** — never logged or surfaced in UI.
- **Quiet skip on missing key.** `THE_ODDS_API_KEY` / `YOUTUBE_API_KEY` / `TWITCH_*` / `SPORT_SOURCE_CRICKET_ENABLED` — if any is unset, the corresponding action returns early without throwing.
- **Per-call `withRetry`.** All HTTP calls wrapped — 3 attempts with exponential backoff + jitter; 4xx (other than 429) skip retry to avoid wasting attempts.
- **Per-action `withSentry`** on Node actions (`push.sendToUser`, `sources.espncricinfo.pollCricketFixtures`) — capture-and-rethrow so retry/scheduler behavior is preserved.
- **Sport-source scrapers gate-flagged** so a fragile selector change can be killed without code deploy.
- **Audit log for every cron run** (planned — currently only error-side logging via console).
