# M18 — Saved Library, Watchlists & Tracking

## Purpose
The customer's bookkeeping surface. Saved picks for "come back later",
followed creators for "interested but not paying", and watchlists for
"alert me when X happens". Watchlists hook into M13 dispatch so a match
fans the same notification chain as a direct subscription.

## Target Roles
Customer

## Core Features
- Saved picks (idempotent on `(userId, pickId)`)
- Followed creators (idempotent on `(userId, creatorId)`)
- Watchlists with composable filter (sport / league / creatorIds / market / minConfidence / access / bodyContains / lineMoveAbovePercent)
- Cursor pagination on saved-picks library
- Watchlists CRUD with inline pause/activate switch
- Auto-fan-out on new pick: `notify.onPickPublished` calls `watchlists._matchPick` and dispatches an extra notify per match (entityKey-deduped)

## User Stories
- As a customer, I want to save a pick I'm thinking about so I can find it later.
- As a customer, I want to follow a creator without paying — so I see their public picks in my feed.
- As a customer, I want to define "alert me when any creator publishes an EPL spread pick at High confidence."
- As a customer, I want a watchlist that fires on line moves above 5%.

## Backend / Convex Build
**Tables**
- `savedPicks` (userId, pickId, savedAt) — by_user, by_user_and_pick, by_pick
- `followedCreators` (userId, creatorId, followedAt) — by_user, by_creator, by_user_and_creator
- `watchlists` (userId, name, filter, isActive, createdAt, updatedAt) — by_user (createdAt), by_active

**Queries**
- `savedPicks.list`, `savedPicks.listPaginated`, `savedPicks.isSaved`, `savedPicks.savedIdsBatch`
- `followedCreators.listMine`, `followedCreators.isFollowing`, `followedCreators.countByCreator`
- `watchlists.listMine`

**Mutations**
- `savedPicks.save / unsave` (idempotent)
- `followedCreators.follow / unfollow` (idempotent)
- `watchlists.create / update / remove`
- `watchlists._matchPick` (internal — evaluator called by M13 fan-out)

**Filter semantics**
- Shallow AND across set fields; empty fields are wildcards
- `minConfidence` ordered Low<Medium<High; pick must meet or exceed
- `bodyContains` case-insensitive substring against title + body + teaser
- `lineMoveAbovePercent` consumed by M11 line-movement poller, not pick triggers

## Frontend Build
**Pages**
- `apps/web/src/pages/Saved.tsx` — saved picks library
- `apps/web/src/account/pages/Watchlists.tsx` — full CRUD with inline pause/activate
- `apps/web/src/pages/CreatorDetail.tsx` — `FollowButton` for follow/unfollow toggle

**Components**
- `FollowButton` (atom — Follow / Following toggle)
- `PickCard` with save state
- `Switch` for watchlist active toggle

## Testing
**Unit** — `convex/savedPicks.test.ts`
- `savedPicks.save` idempotent (same row id on second call)
- `savedPicks.unsave` no-op when never saved
- `savedIdsBatch` correctness across mixed saved/unsaved
- `watchlists._matchPick` filter matrix

**Integration**
- Save → `list` shows the pick joined with creator profile
- Watchlist with `sport='Football', minConfidence='High'` matches the right picks
- Match → notify fan-out (M13) writes the in-app row with watchlist name in payload

**E2E**
- Customer saves pick → appears in Saved page; unsave removes it
- Customer creates a watchlist → next matching pick triggers a notification with "Watchlist hit · <name>"

## Governance / Rules
- **Saves and follows are idempotent.** Repeated calls return the same row — no duplicates.
- **Watchlist active flag respected by the matcher.** `_matchPick` filters on `isActive` before evaluating filters; pausing pauses fanout.
- **Filter semantics are shallow AND.** Empty filter object matches every pick — useful for "all-creator" alerts.
- **Watchlist hits dedup with subscription alerts.** Both fan-outs use the same `pick-published:<pickId>` entityKey so a user who's both subscribed and watchlist-matched gets one in-app row.
- **Per-user bounded.** No global watchlists; each user manages their own.
