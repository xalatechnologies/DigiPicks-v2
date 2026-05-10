# M02 — Realtime Convex Platform Foundation

## Purpose

The shared backend conventions every other module inherits. Not a feature on
its own — it's the contract that makes the platform feel realtime, auditable,
and scale-ready without per-module reinvention.

## Target Roles

System (cross-cutting; every role benefits indirectly)

## Core Features

- Convex queries for all reactive reads (subscribed via `useQuery`)
- Mutations for domain writes; actions for external HTTP / Node libs
- Cron jobs for scheduled work (11 registered)
- Per-table `createdAt`, `updatedAt`, `status`, `actorUserId` audit fields
- `auditLogs` append-only with CI-enforced grep guard
- `withRetry` helper with exponential backoff + jitter for external calls
- `@convex-dev/rate-limiter` component with sharded buckets
- `withSentry` wrapper for Node actions (capture-and-rethrow)
- Bounded scans only — no `.collect()` on growth tables; CI-checked

## User Stories

- As a customer, I want feeds to update without refreshing.
- As a creator, I want subscribers to see my pick within ~100ms of publish.
- As an admin, I want every sensitive action recorded permanently.
- As an SRE, I want failed external calls to retry then surface to Sentry.

## Backend / Convex Build

**Tables**

- `auditLogs` (entityType, entityId, action, actorUserId, metadata, createdAt) — append-only
- (Cross-cutting: every domain table inherits the convention)

**Queries**

- `audit.listByEntity` — admin-only drill-down

**Mutations**

- `audit.log` (internal) — only legitimate writer of `auditLogs`

**Actions**

- All external integrations (Stripe, Anthropic, Odds API, Twitch, Telegram, etc.)

**Crons** — registered in `convex/crons.ts`

- `poll-live-scores` (60s) · `poll-upcoming-events` (1h) · `poll-odds-snapshots` (24h)
- `poll-creator-streams` (5min) · `poll-sport-sources` (24h)
- `recompute-trust-scores` (24h) · `publish-scheduled-picks` (1min) · `recompute-trending` (12h)
- `poll-line-movements` (1h) · `check-completed-events` (1h) · `archive-expired-listings` (6h)

**Shared helpers**

- `convex/shared/permissions.ts` — `requireUser`, `requireAdmin`, `requireCreator`, `requireCreatorOwnership`, `isAdmin`
- `convex/shared/retry.ts` — `withRetry({ label, maxAttempts, shouldRetry })`
- `convex/shared/rateLimit.ts` — named buckets with `shards: N` on hot keys
- `convex/shared/sentryNode.ts` — `withSentry(label, fn)` for Node actions
- `convex/__tests__/setup.test.ts` — `convexTest` wrapper that pre-registers components

## Frontend Build

**Pages**

- N/A — foundation only

**Components**

- N/A — DS handles every visual primitive

**Patterns**

- `useQuery` / `usePaginatedQuery` / `useMutation` / `useAction` from `convex/react`
- `apps/web/src/main.tsx` providers: ConvexAuth → BrowserRouter → ThemeProvider → I18nProvider → Sentry boundary

## Testing

**Unit**

- Permission helper coverage in `tests.test.ts`
- Retry helper retry/backoff behavior (TODO test for `withRetry`)

**Integration**

- Mutation → query reactivity round-trip via `convex-test`
- Audit log emission on permission failures (`tests.test.ts > disputes > audit log entry`)

**E2E**

- Publish pick in creator view → customer feed updates without refresh

## Governance / Rules

- Every mutation must call a `require*` helper before any DB write.
- Internal helpers (`_*`) never exposed via `mutation` / `query` — always `internalMutation` / `internalQuery`.
- Bounded scans: `.take(N)` with `N ≤ 5000` is the platform contract; `.collect()` only on tables that are guaranteed small at scale.
- Audit append-only: zero `.patch / .replace / .delete` against `auditLogs` anywhere — CI grep gates this.
- Every external call wrapped in `withRetry` and (Node-side) `withSentry`.
