# M11 — Realtime Odds Intelligence

## Purpose
Captures and serves the live odds market — multi-bookmaker comparison and
line-movement history per event. Powers the OddsIntel page, attaches odds
snapshots to creator picks, and feeds the line-movement alert trigger
(M13) when implied probability shifts cross threshold.

## Target Roles
Customer · Creator · Admin · System

## Core Features
- Per-bookmaker snapshot capture across markets (h2h / spreads / totals)
- Multi-region (US / UK / EU) + decimal odds normalization
- Line-movement time series via `odds.lineMovement`
- Event-level multi-book comparison via `odds.byEvent`
- Hourly line-movement alert poller (M13)
- Provider-agnostic adapter (only The Odds API wired today; SportsDataIO deferred)

## User Stories
- As a creator, I want to attach odds snapshots to my picks so subscribers see CLV.
- As a customer, I want to compare odds across bookmakers for the same event.
- As a customer, I want a chart of how the line moved between when the pick was posted and game time.
- As the system, I want to swap odds providers without touching the UI.

## Backend / Convex Build
**Tables**
- `oddsSnapshots` (eventId, externalEventId, market, book, bookTitle, side, price, point, capturedAt)

**Indexes** — `by_event_and_capturedAt`, `by_event_market_book`

**Queries**
- `odds.byEvent` — latest snapshot per (book, market, side); reduces 200 latest rows to one per group
- `odds.lineMovement` — time series for one (event, market, book, side); ordered ascending for the chart

**Mutations**
- `odds._writeSnapshots` (internal — bulk insert from the cron)
- `odds._findEventByExternalId` (internal — provider eventId → DigiPicks Id resolution)

**Actions / Crons**
- `oddsApi.pollOddsSnapshots` (24h, `ODDS_SNAPSHOTS_ENABLED` gated) — `/v4/sports/<key>/odds`, regions=us,uk,eu, markets=h2h,spreads,totals
- `lineMovement.pollLineMovements` (1h) — detects implied-probability shifts ≥ `LINE_MOVE_THRESHOLD_PCT` (default 5) and dispatches notify (M13)

## Frontend Build
**Pages**
- `apps/web/src/pages/OddsIntel.tsx` — multi-book grid + line-movement chart per event

**Components**
- `OddsGrid` (data table — book × market × side cells), `Sparkline` (ARIA-labelled trend description), `Odds` (atom — formatted ± / decimal)

## Testing
**Unit**
- `odds.byEvent` reduces snapshots to latest per (market, book, side)
- `lineMovement.detect` flags shifts ≥ threshold; ignores < threshold
- `impliedPct` decimal-odds → probability conversion

**Integration**
- Cron writes snapshots → `byEvent` returns reduced view
- Threshold-crossing snapshot pair → `lineMovement.pollLineMovements` fans notify to subscribers + savers + watchlist owners

**E2E**
- Customer opens an event → OddsGrid renders all books + Sparkline shows the trend
- Significant line shift → in-app notification arrives within an hour

## Governance / Rules
- Odds snapshots cron is **opt-in** via `ODDS_SNAPSHOTS_ENABLED=true` — the `/odds` endpoint is expensive (~9 credits per sport per call). Default off saves quota.
- Line-movement poller is its own cron (1h) — separate from snapshot capture so the threshold logic can be tuned without touching ingestion.
- Snapshot writes are append-only — never patched. Historical line context never rewrites.
- `odds.byEvent` returns the latest per group; `odds.lineMovement` is the time-series surface. Don't mix the two in the same query.
- All external Odds API calls wrapped in `withRetry` with retryable status set (429, 5xx, network).
