# M16 — Creator Analytics Dashboard

## Purpose
The numbers a creator runs their business on: subscribers, win rate, ROI,
streak, earnings, churn. Composed from existing tables — no separate
`creatorAnalyticsSnapshots` table at MVP scale; Convex's reactive queries
keep the dashboard fresh.

## Target Roles
Creator · Admin

## Core Features
- Subscriber count + recent subs + plan distribution
- Win rate / netUnits / streak / record
- Stripe-backed earnings + payout history
- Per-pick performance + recent picks list
- Reactive — every metric updates the moment a sub or grade lands

## User Stories
- As a creator, I want a single dashboard with subs, ROI, win rate, and earnings.
- As a creator, I want to see which subscribers are at risk (cancelled / past_due).
- As an admin, I want to see creator quality metrics for trust scoring.
- As a creator, I want recent subs and recent picks side-by-side.

## Backend / Convex Build
**Tables** (read-only — no analytics-specific table)
- `creators` — subscriberCount, winRate, record, last10, units, streak, trustScore, trustSignals
- `subscriptions` — joined to surface plan distribution + churn
- `picks` — joined for win rate / netUnits / streak rollups
- `payouts` — Stripe-backed earnings history

**Queries**
- `subscriptions.byCreator` — enriched subscriber list (name, email, plan, status, LTV)
- `subscriptions.countByCreator` — active subscriber count
- `creators.earningsHistory` — payouts joined for the Earnings page
- `creators.get` — base profile (incl. trust signals)
- `subscriberStats.myPortfolio` (creator's own follow side, when applicable)
- `picks.byCreator` — recent published picks

**Mutations**
- N/A — this module is read-only (writes happen in M05/M07/M09)

## Frontend Build
**Pages**
- `apps/web/src/dashboard/pages/Overview.tsx` — overview with recent subs, recent picks, performance summary
- `apps/web/src/dashboard/pages/Subscribers.tsx` — subscriber list with plan / LTV / churn risk
- `apps/web/src/dashboard/pages/Performance.tsx` — win-rate, ROI, streaks, distribution
- `apps/web/src/dashboard/pages/Earnings.tsx` — Stripe-backed payouts table
- `apps/web/src/dashboard/pages/Growth.tsx` — opportunities + referrals + campaigns

**Components**
- `MetricGrid`, `Metric`, `BigStat`, `StatTile`, `Sparkline`, `Table`, `KV`, `PersonRow`

## Testing
**Unit**
- `subscriptions.byCreator` enrichment correctness
- Win-rate calculation handles empty graded set (returns 0, not NaN)

**Integration**
- New subscription → `Overview.recentSubs` updates reactively
- Pick graded → `Performance.winRate` updates reactively

**E2E**
- Creator opens dashboard → Overview renders without spinner cascade
- New customer subscribes → recent subs row appears within seconds
- Pick graded as `win` → Performance widget reflects the new win rate

## Governance / Rules
- **Composed from primary tables.** No separate analytics snapshot table — Convex queries are cheap enough at MVP scale (sub-100ms p95 on 6k creators × 100k subs).
- **Promote to materialized snapshots** if a single dashboard query exceeds 10MB transaction or 1.5s p95 — track via `npx convex insights`.
- **Reactive by default.** Every metric uses `useQuery`; numbers update without page reload when the underlying picks / subs change.
- **Performance reads are not write paths** — never modify `creators.winRate` / `record` / `streak` from the dashboard. Those fields are derived elsewhere (or via cron).
- **Per-creator scope.** `requireCreatorOwnership` on all mutation paths that this module reads from indirectly; queries are public-or-creator.
