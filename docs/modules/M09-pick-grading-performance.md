# M09 — Pick Grading & Performance Tracking

## Purpose
Closes the loop on every pick. Owns the grading lifecycle (pending → win /
loss / push), the immutability lock that protects historical performance
numbers, the audit timeline that explains every grade, and the rolling
performance metrics that drive trust + trending.

## Target Roles
Creator · Customer · Admin · System

## Core Features
- 4 terminal states: `win`, `loss`, `push`, plus `pending` baseline
- Internal-only grading mutation (clients can't grade their own picks)
- Immutability lock — terminal grades cannot be re-patched (NFR-006)
- Per-pick audit history (`picks.gradingHistory`) sourced from `auditLogs`
- ROI / win-rate / streak rollups via `subscriberStats.myPortfolio`
- Auto-completion for events past start + 4h via `check-completed-events` cron
- Grade fan-out: notify saved-pick savers + active subscribers + recompute trust signals on next nightly cron

## User Stories
- As a customer, I want to see whether the picks I follow won or lost.
- As a creator, I want my published win-rate to be the same number my subscribers see.
- As a customer, I want to see the timeline of how a pick was graded so disputes are transparent.
- As an admin, I need to be sure a graded pick can't be silently overwritten.

## Backend / Convex Build
**Tables**
- `picks.{grade, netUnits, gradedAt}` (lifecycle fields on the picks table)
- `auditLogs` (entityType: 'pick', action: 'pick.graded.{win|loss|push}', metadata: { netUnits })

**Queries**
- `picks.gradingHistory` — append-only timeline for one pick (auditLogs scoped to entityType='pick')
- `subscriberStats.myPortfolio` — aggregate stats across followed creators (winRate, netUnits, streak, bySport, byCreator)
- `subscriberStats.recentResults` — recent graded picks list

**Mutations**
- `picks.grade` (internal) — guards `pick.grade !== 'pending'` → throws; on success patches `{grade, netUnits, gradedAt}` + audit-logs + schedules `notify.onPickGraded`
- `crons.checkCompletedEvents` (internal) — flips events to `completed` past startsAt + 4h

**Helpers**
- M11 `liveScores.pollActive` provides scores; manual grading via admin tooling closes the loop until auto-grader is wired

## Frontend Build
**Pages**
- `apps/web/src/dashboard/pages/Performance.tsx` — creator-side win rate, ROI, streak, distribution
- `apps/web/src/account/pages/Results.tsx` — subscriber portfolio (PortfolioHero + StatTile + InsightCard)
- `apps/web/src/dashboard/pages/Picks.tsx` — list with `GradeBadge` per row

**Components**
- `GradeBadge` (atom — pending / win / loss / push), `Sparkline` (ARIA labelled), `PortfolioHero`, `StatTile`, `BigStat`, `Metric`

## Testing
**Unit** — `convex/tests.test.ts > picks`
- `grade a pick` happy path
- `grading is immutable once finalized` — re-grade throws

**Integration**
- Grade transition writes audit row `pick.graded.{win|loss|push}`
- `notify.onPickGraded` fans to `savedPicks.by_pick` users + active subscribers
- `subscriberStats.myPortfolio` reflects the new grade on next reactive query

**E2E**
- Pick graded as `win` → creator's win rate widget updates
- Customer's saved pick row shows the GradeBadge with `+2.4u` net units
- Re-grade attempt from internal admin tooling → user-facing error

## Governance / Rules
- **Grading is immutable.** Terminal grades (`win`, `loss`, `push`) cannot be patched a second time. Convex test asserts this.
- All grade transitions audit-logged via `audit.log` inside the same mutation transaction (not scheduled — atomicity matters here).
- `picks.grade` is `internalMutation` only — clients can never call it directly. Public surface is `picks.gradingHistory` for read-only timeline display.
- Net units format is a string ('+1.39u' / '-1u') so creator pricing units stay user-readable.
- Rate-limiter not applied — grading is internal only and the cron is bounded.
