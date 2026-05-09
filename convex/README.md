# Convex Backend

DigiPicks Convex functions, schema, crons, and HTTP endpoints.

## Importing real events

Live + upcoming match data comes from [the-odds-api.com](https://the-odds-api.com).
Team logos come from [TheSportsDB](https://www.thesportsdb.com/documentation).

### Required env vars

Set via `npx convex env set <NAME> <value>` (per-deployment):

| Variable           | Purpose                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| `THE_ODDS_API_KEY` | API key for the-odds-api.com. When unset, importers gracefully no-op. |
| `SEED_TOKEN`       | Bearer token required by the `POST /seed-events` HTTP route.           |

TheSportsDB uses the free public key `'3'` for logo lookups — no env var
needed.

### Crons

Defined in `convex/crons.ts`:

- `poll-live-scores` — every **60s**, calls `internal.liveScores.pollActive`.
  Hits `/v4/sports/{key}/scores` (live + recent). Updates scores and statuses.
- `poll-upcoming-events` — every **1 hour**, calls
  `internal.oddsApi.pollUpcoming`. Hits the cheap `/v4/sports/{key}/events`
  endpoint (1 quota credit per call) for ~20 sport keys covering Soccer,
  Football, Basketball, Baseball, Hockey, Cricket, Tennis, MMA, Rugby.
  Each event upsert fire-and-forget schedules `internal.teamLogos.resolveOne`
  for the home + away teams.

### Logo resolution

`internal.teamLogos.resolveOne({ sport, name })`:

1. Normalizes the team name (lowercased, accent-stripped, suffix-stripped —
   matches `apps/web/src/lib/teamLogo.ts`).
2. Checks the `teamLogos` table by `(sport, normalizedName)`. If a row exists
   with `badgeUrl` set or `notFound: true`, exits (idempotent).
3. Otherwise calls
   `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=<name>`,
   picks the first team whose `strSport` matches the sport (substring or
   alias — e.g. "Football" ↔ "American Football"), falls back to the first
   result.
4. Caches the result. On any error or empty response, writes `notFound: true`
   so we never retry that team.
5. If a `badgeUrl` was found, runs `internal.events.applyLogo` to backfill
   `homeLogo` / `awayLogo` on every matching event row (capped at 200 events
   per call via the `by_sport_and_startsAt` index).

### Manual triggers

Two ways to populate the events table on demand:

**1. Admin mutation (Convex dashboard or app):**

```ts
await mutation(api.events.seedFromOddsApi, {});
```

Requires the caller to have an admin role (`admin`, `tenant_admin`, or
`super_admin`). Schedules `pollUpcoming` and `pollActive` immediately.

**2. HTTP route:**

```bash
curl -X POST \
  -H "Authorization: Bearer $SEED_TOKEN" \
  $CONVEX_SITE_URL/seed-events
```

Returns `{"ok": true}` on success, `401` on bad token, `500` if
`SEED_TOKEN` is not configured.

### Quota notes

- `/events` costs 1 credit per request. Hourly × ~20 sport keys ≈ 480/day.
- `/scores` costs 1 credit per request. 60s × ~20 keys ≈ heavy — check the
  active sport key list in `convex/liveScores.ts` if the free tier is tight.
- TheSportsDB free key `'3'` is rate-limited (a few req/sec). The `notFound`
  flag prevents repeat lookups for unknown teams.

### Edge cases worth noting

- Some Odds API sport keys are seasonal and return `404` out of season
  (e.g. `tennis_atp_australian_open` only has events in Jan). The importer
  logs warnings and continues with the next key.
- TheSportsDB matches names loosely — "Manchester United" might return
  multiple unrelated teams. We bias toward the entry whose `strSport`
  matches our sport, but the heuristic is best-effort.
- The upsert in `internal.liveScores.upsertEvent` matches on `externalId`
  first, then falls back to home/away team-name match for events created
  manually before the importer ran.
