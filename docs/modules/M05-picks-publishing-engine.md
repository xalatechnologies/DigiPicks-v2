# M05 — Picks & Publishing Engine

## Purpose

The creator's primary action: publish a pick on an event with a market,
selection, odds, units, and confidence. Owns drafts, scheduled publishing,
AI co-write integration, grading lifecycle, and the immutability lock that
makes historical performance numbers trustworthy.

## Target Roles

Creator · Customer · Admin · System

## Core Features

- Three statuses: `draft`, `scheduled`, `published` (+ `archived`)
- `publishAt` future timestamp drives the 1-min `publish-scheduled-picks` cron
- AI co-write via `ai.suggestPick` (Anthropic Haiku, prompt-cached system prompt)
- Async fan-out chain on publish: AI analysis + Discord webhook + notify dispatch
- Grade lock: terminal grades (`win | loss | push`) cannot be re-patched
- Per-pick grading audit history exposed via `picks.gradingHistory`
- MFA freshness gate (`gateOnMfaIfEnrolled`) on publish

## User Stories

- As a creator, I want to draft a pick, save it, and finish later.
- As a creator, I want AI to suggest a tight summary + confidence score.
- As a creator, I want to schedule a pick for a specific kickoff time.
- As a customer, I want to see why a pick was graded the way it was.
- As an admin, I want to know that a finalized grade can't be silently rewritten.

## Backend / Convex Build

**Tables**

- `picks` (creatorId, access, sport, league, eventId, eventName, eventTime, title, market, selection, odds, units, confidence, body, teaser, status, grade, netUnits, gradedAt, publishedAt, publishAt, aiSummary, aiConfidence, aiReasoning, aiAnalyzedAt, aiModel, trendingScore, trendingComputedAt)

**Indexes** — `by_creator (createdAt)`, `by_sport (createdAt)`, `by_status (createdAt)`, `by_status_and_publishAt`, `by_status_and_trending`, `by_access (createdAt)`

**Queries**

- `picks.feed`, `picks.feedPaginated` (cursor), `picks.byCreator`, `picks.gradingHistory`

**Mutations**

- `picks.create` — accepts status `draft | scheduled | published` (publishAt required when scheduled). Schedules AI + Discord + notify on publish. MFA-gated.
- `picks.grade` (internal) — rejects re-grade once terminal; audit-logged
- `picks._setAiAnalysis` (internal) — called by `ai.analyzePick`
- `picks._publishDueScheduled` (internal cron handler)

**Actions**

- `ai.analyzePick` — generates {summary, confidence, reasoning}; quiet no-op without `ANTHROPIC_API_KEY`
- `ai.suggestPick` — pre-publish co-write; rate-limited via `stripeCheckout` bucket

## Frontend Build

**Pages**

- `apps/web/src/dashboard/pages/CreatePick.tsx` — composer with AIAssistPanel
- `apps/web/src/dashboard/pages/Picks.tsx` — creator's published list

**Components**

- `PickCard` (free / premium / vip access states), `AIAssistPanel`, `AISummary`, `ConfidenceGauge`, `AccessBadge`, `GradeBadge`, `LockedAnalysis`

## Testing

**Unit**

- `picks.grade` re-grade rejection (`tests.test.ts > picks > grading is immutable once finalized`)
- `publishAt` validation (must be future for `scheduled`)
- AI parser handles malformed JSON

**Integration**

- Create + publish → AI summary persisted + Discord scheduled + notify fan-out fired
- Scheduled pick at `publishAt - ε` → cron flips to published + fan-out fires within 60s

**E2E**

- Creator drafts a pick → AI suggest → accept → publish → subscriber feed updates
- Creator schedules a pick → next minute the cron publishes + alerts fire

## Governance / Rules

- Grade is immutable once `win | loss | push` — runtime guard + convex test.
- Every grade transition writes an audit row with `entityType: 'pick', action: 'pick.graded.<grade>'`.
- Scheduled publish defers all fan-out to the cron — `picks.create` doesn't fire AI/Discord/notify for `scheduled` rows.
- `gateOnMfaIfEnrolled` on `picks.create` so enrolled creators must re-verify within 15 minutes for sensitive publish action.
- Premium / VIP picks gate at the read layer via subscription check (M06), never client-only.
