# BPMN-012 — Realtime odds synchronization

## Purpose

Periodic ingest of odds from external providers, normalization to the
DigiPicks schema, and propagation to the feed and watchlist alerts.

## Trigger

- Cron `pollOddsSnapshots` runs every 60 seconds.
- Manual admin refresh from `/admin` — the action is
  `events.seedFromOddsApi` (the prose name `oddsApi.refreshNow` in
  earlier docs is an alias for the same call).

## Preconditions

- `ODDS_API_KEY` env var configured (otherwise the action is a quiet
  no-op and emits a single startup warning).
- Events exist in `scheduled` or `live` state for in-window dates.
- Sport-key registry is shared across pollers — `oddsApi.pollUpcoming`
  imports `SPORT_KEY_MAP_FULL` and `liveScores.pollActive` imports
  `SPORT_KEY_MAP_LIVE` from `convex/shared/sportKeyMap.ts` (single
  source of truth; live-poll subset is intentionally narrower for quota).

## Actors / Swimlanes

- **Cron**
- **Convex Backend** — `events`, `odds`, `oddsSnapshots`,
  `lineMovement`.
- **External provider** — The Odds API (or equivalent).
- **Feed / alerts** — fanout consumers.

## Main flow

```mermaid
flowchart TD
  subgraph C[Cron]
    c1{{pollOddsSnapshots<br/>every 60s}}
  end
  subgraph K[Convex Backend]
    k1[(events<br/>read in-window)]
    k2{{oddsApi.fetch}}
    k3[(odds<br/>upsert)]
    k4[(oddsSnapshots<br/>append)]
    k5{{lineMovement.checkAlerts}}
  end
  subgraph P[Provider]
    p1[/The Odds API/]
  end
  subgraph F[Feed / alerts]
    f1[feed.list re-runs]
    f2[notify.onLineMovement]
    f3{{discord.delivery.fanoutOutbound<br/>eventType=odds_movement}}
  end

  c1 --> k1 --> k2 --> p1
  p1 -->|JSON| k2 --> k3 -.-> k4
  k3 -.-> f1
  k3 -.-> k5 -.-> f2
  k5 -.-> f3
```

## Alternative flows

- **Provider rate-limit (HTTP 429)** → exponential backoff, retry on
  next tick; metric counter increments.
- **Stale data (cache miss)** → log warning + fall back to the most
  recent snapshot; UI shows a "stale odds" badge.
- **Schema drift** → unknown markets are dropped with a metric counter;
  known markets continue to update.
- **Webhook variant** — for providers that support it, an HTTP action
  endpoint replaces the poll; the rest of the diagram is identical.

## Postconditions

- `odds` table reflects the latest snapshot per `(eventId, market)`.
- `oddsSnapshots` keeps a time series for line-movement detection.
- `lineMovement.lastNotifiedAt` patched when an alert fires.

## Realtime events

- `feed.list`, `events.detail`, and `oddsIntel.*` queries auto-update
  on every odds change.
- Watchlist subscribers (BPMN-005) receive push when implied
  probability shifts ≥ threshold.
- Creators with an enabled outbound `discordChannelSyncs` row + the
  `oddsMovement` alert rule on receive a Discord embed for each picked
  event whose line crosses `LINE_MOVE_THRESHOLD_PCT`. Per-creator (not
  per-user) — see BPMN-015.

## AI interactions

None on the ingest path. The `oddsIntel` page may call Anthropic Haiku
for explanatory text, but that's read-side and unrelated to ingest.

## Module mapping

- [M11 — Realtime odds intelligence](../modules/M11-realtime-odds-intelligence.md)
- [M22 — External sports data providers](../modules/M22-external-sports-data-providers.md)
- [M13 — Notifications & smart alerts](../modules/M13-notifications-smart-alerts.md)
- [M20 — Discord integration](../modules/M20-discord-integration.md)
