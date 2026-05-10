# M10 — Customer Feed & Discovery

## Purpose
The customer's home base. Personalized feed of picks from subscribed creators
with a fallback to the platform's latest published picks for fresh users.
Plus the discovery surfaces — Creators directory, Trending carousel, Saved
library, Followed creators — that drive subscription conversion.

## Target Roles
Visitor · Customer · Creator · System

## Core Features
- Personalized feed merges picks from active subscriptions, sorted by recency
- Empty-state fallback: latest platform picks when user has no active subs
- Cursor pagination via `picks.feedPaginated` (Convex `paginate()`)
- Trending carousel sourced from `trending.trending` cron-computed scores
- Saved-picks library + followed-creators library
- Sport / access filtering at query level

## User Stories
- As a visitor, I want to browse the latest picks across the platform.
- As a customer, I want my feed to show only the creators I subscribe to.
- As a customer, I want to follow a creator without paying for them.
- As a customer, I want to save a pick to come back to later.
- As a customer, I want a "Trending now" rail on the landing page.

## Backend / Convex Build
**Tables**
- `picks` (status='published' filter)
- `subscriptions` (status='active' filter for personalization)
- `savedPicks` (userId, pickId, savedAt)
- `followedCreators` (userId, creatorId, followedAt)

**Queries**
- `picks.feed` — non-paginated, sport-filterable
- `picks.feedPaginated` — cursor-based via `paginationOpts`
- `picks.byCreator`
- `feed.personalized` — auth-required; merges subscribed-creator picks with creator profile join, fallback to public picks when zero subs
- `savedPicks.list`, `savedPicks.listPaginated`, `savedPicks.isSaved`, `savedPicks.savedIdsBatch`
- `followedCreators.listMine`, `followedCreators.isFollowing`, `followedCreators.countByCreator`
- `trending.trending` — top picks ranked by composite `trendingScore`
- `creators.list`, `creators.getByHandle`, `creators.search`

**Mutations**
- `savedPicks.save / unsave` (idempotent on `(userId, pickId)`)
- `followedCreators.follow / unfollow` (idempotent on `(userId, creatorId)`)

**Cron**
- `recompute-trending` (12h) — `trending.recomputeTrending` weights recency × saves × creator reach + pending bonus

## Frontend Build
**Pages**
- `apps/web/src/pages/Landing.tsx` — TrendingCarousel + featured creators + brand marquee
- `apps/web/src/pages/Feed.tsx` — personalized feed with sport filters
- `apps/web/src/pages/Creators.tsx` — directory with search + filters
- `apps/web/src/pages/CreatorDetail.tsx` — profile with FollowButton + tier checkout
- `apps/web/src/pages/Saved.tsx` — saved picks library
- `apps/web/src/account/pages/Dashboard.tsx` — subscriber overview

**Components**
- `TrendingCarousel`, `PickCard`, `CreatorCard`, `CreatorChip`, `FollowButton`, `FilterChips`, `Hero`, `HeroLivePanel`

## Testing
**Unit**
- `feed.personalized` fallback when zero active subs returns latest platform picks
- `savedPicks.save` idempotent — same row returned on second call

**Integration** — `convex/feed.test.ts`, `convex/savedPicks.test.ts`
- Subscribed-only filter when active subs exist
- Cancelled subs don't personalize the feed
- `savedIdsBatch` correctness for the feed render path

**E2E**
- Customer follows a creator → next published pick appears in feed
- Customer saves a pick → appears in library; unsave removes it
- Trending carousel renders after the cron has run

## Governance / Rules
- Feed query is auth-required (returns Unauthorized for visitors); the visitor home is the public Landing trending rail.
- Cursor pagination is the documented path for lists that grow — `feedPaginated`, `savedPicks.listPaginated`, `notifications.listMinePaginated`.
- Trending scores recomputed every 12h; the public query is a bounded `by_status_and_trending` index lookup, not a per-request scan.
- `savedPicks.list` enriches each row with the joined creator — N+1 acceptable because per-user save lists are bounded (~hundreds).
- Follow is free and signals interest; subscribe is paid (M07) — keep the two surfaces visually distinct so users understand the difference.
