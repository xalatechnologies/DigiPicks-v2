# M04 — Provider-Agnostic Event Engine

## Purpose

The federated event model that lets DigiPicks cover **any** sport, league, or
competition — global provider events alongside creator-submitted, federation,
and community-curated events. Closes PRD §7.1 and SRSD FR-EVT-001..005.

## Target Roles

Visitor · Customer · Creator · Admin · System

## Core Features

- Six `sourceType` values: `provider | sport_source | federation | platform | creator | community`
- Canonical event model: `participants[]`, `visibility`, `verificationStatus`, `resultSource`, `endTime`, `metadata`, `sourceUrl`
- Provider ingestion (The Odds API) via hourly + 60s crons
- ESPNcricinfo sport-source scraper (cheerio, feature-flagged)
- Creator-submitted events with admin review queue
- Live score polling (60s) + completion auto-mark (1h)
- Team-logo backfill via TheSportsDB

## User Stories

- As a customer, I want to browse global EPL fixtures alongside Norwegian cricket matches.
- As a creator, I want to create a private FIFA tournament for my subscribers.
- As an admin, I want to approve creator-submitted events before they're monetized.
- As the system, I want provider events normalized into a single shape.

## Backend / Convex Build

**Tables**

- `events` (sport, league, home, away, time, startsAt, status, sourceType, providerName, sourceUrl, createdByUserId, reviewedByAdminId, title, endTime, visibility, verificationStatus, resultSource, participants[], metadata, homeScore, awayScore, gameStatus, externalId, homeLogo, awayLogo)
- `teamLogos` — TheSportsDB cache, per (sport, normalizedName)

**Indexes** — `by_sport_and_startsAt`, `by_featured_and_startsAt`, `by_status_and_startsAt`, `by_external_id`, `by_sourceType_and_startsAt`, `by_createdByUserId`, `by_verificationStatus`

**Queries**

- `events.today`, `events.featured`, `events.byCreator`, `events.pendingReview` (admin)

**Mutations**

- `events.create` (admin/platform — `sourceType: 'platform'`)
- `events.createByCreator` (creator — `verificationStatus: 'creator_submitted'`)
- `events.reviewEvent` (admin — flips to `admin_verified`)
- `events.updateStatus`
- `liveScores.upsertEvent` (internal — provider self-heals federated fields on legacy rows)
- `sources.cricketWriter.upsertCricketFixture` (internal)

**Actions**

- `oddsApi.pollUpcoming` (1h cron) — `/v4/sports/<key>/events`
- `liveScores.pollActive` (60s cron) — `/v4/sports/<key>/scores/`
- `sources.espncricinfo.pollCricketFixtures` (24h cron, `SPORT_SOURCE_CRICKET_ENABLED` gate)
- `teamLogos.resolveOne` (fire-and-forget per team after upsert)

## Frontend Build

**Pages**

- `apps/web/src/pages/Events.tsx` — public event list, grouped by league
- `apps/web/src/dashboard/pages/MyEvents.tsx` — creator's submitted events
- `apps/web/src/dashboard/pages/CreateEvent.tsx` — submission form
- `apps/web/src/pages/admin/EventReview.tsx` — admin moderation queue

**Components**

- `EventCard` (compact + full), `EventSourceBadge`, `EventForm`, `HeroLivePanel`

## Testing

**Unit**

- ESPNcricinfo HTML parser handles malformed cards without throwing
- `liveScores.upsertEvent` bounded fallback finds a match within ±36h window
- `sourceType` enum validation

**Integration** — `convex/events-federated.test.ts`

- All 6 sourceType transitions
- Creator-submit → admin-approve flow
- Provider self-heal on legacy events

**E2E**

- Creator submits event → admin approves → creator attaches a pick → customer sees it in feed

## Governance / Rules

- Provider events land with `verificationStatus: 'source_verified'` automatically.
- Creator events default to `creator_submitted` — admin must flip to `admin_verified` before they appear in public discovery for monetized picks.
- The cron self-heals federated fields on rows touched by the provider — no migration backfill required.
- Sport-specific scrapers (ESPNcricinfo) gate behind a per-source enable env var so a fragile selector change can be killed instantly.
- Team logos are cached in `teamLogos` to keep TheSportsDB calls bounded.
