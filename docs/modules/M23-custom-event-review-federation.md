# M23 — Custom Event Review & Federation Source Management

## Purpose
The admin's surface for reviewing the long tail of events: creator-submitted
matchups, federation fixtures, sport-source scrapes, community competitions.
Distinct from M04 (which owns the federated event model itself) — this
module is the moderation + trust workflow that wraps it.

## Target Roles
Creator · Admin · System

## Core Features
- Admin review queue for `creator_submitted` events
- Per-source trust levels via `verificationStatus` (`unverified` → `creator_submitted` → `source_verified` → `admin_verified`)
- Inline approve / reject from the queue UI
- Source URL rendered for spot-checking
- Audit-logged transitions
- Result-source tracking (`provider | manual_creator | manual_admin | community_confirmed`)

## User Stories
- As an admin, I want a review queue of all creator-submitted events before they go public.
- As a creator, I want my submitted event to be flagged as "creator_submitted" until reviewed.
- As an admin, I want to upgrade a sport-source-scraped event to `admin_verified` after spot-checking.
- As a customer, I want to see which events are admin-verified vs source-only.

## Backend / Convex Build
**Tables**
- `events.{verificationStatus, resultSource, sourceType, sourceUrl, createdByUserId, reviewedByAdminId, reviewedAt}` (extends events from M04)

**Indexes** — `events.by_verificationStatus`, `by_createdByUserId`, `by_sourceType_and_startsAt`

**Queries**
- `events.pendingReview` (admin) — bounded queue of `creator_submitted` events
- `events.byCreator` — creator's submission history
- `admin.summary` — includes pending-review count

**Mutations**
- `events.createByCreator` — creator-only; defaults to `verificationStatus: 'creator_submitted'`, `resultSource: 'manual_creator'`
- `events.reviewEvent` (admin-only) — flips `verificationStatus` to `'admin_verified'` (or `rejected`-equivalent via status), records `reviewedByAdminId`, audit-logged

**Result-source rules**
- `provider` — Odds API / SportsDataIO ingestion
- `manual_creator` — creator-submitted, default before admin review
- `manual_admin` — admin-curated platform events
- `community_confirmed` — community votes on outcome (deferred)

## Frontend Build
**Pages**
- `apps/web/src/pages/admin/EventReview.tsx` — review queue with inline approve/reject
- `apps/web/src/dashboard/pages/MyEvents.tsx` — creator's submitted events with status badges
- `apps/web/src/dashboard/pages/CreateEvent.tsx` — creator submission form

**Components**
- `EventCard` (compact view with `EventSourceBadge` showing the sourceType)
- `EventSourceBadge` (atom — `provider | sport_source | federation | platform | creator | community`)
- `EventForm` (form — used by both creators and admins)
- `Table` for the review queue

## Testing
**Unit**
- `events.createByCreator` defaults `verificationStatus`, `resultSource`, `sourceType: 'creator'`
- `reviewEvent` rejects non-admin callers
- Source-type validation enforced via the discriminated union validator

**Integration** — `convex/events-federated.test.ts`
- Creator submits → status = `creator_submitted`
- Admin approves → status = `admin_verified` + audit row
- All 6 sourceType transitions exercised

**E2E**
- Creator submits a private FIFA tournament → admin queue shows it → admin approves → event surfaces in public discovery
- Admin rejects an event → creator sees rejection state in their dashboard

## Governance / Rules
- **Default lowest trust on creator events.** Creator submissions land at `verificationStatus: 'creator_submitted'` — admin must promote.
- **Premium-monetized events require admin verification.** A creator can attach a free pick to a `creator_submitted` event but premium picks should require `admin_verified` (UI-side check, server enforcement deferred to a future contract).
- **Result source matters for grading.** Picks on `provider`-sourced events auto-grade from the score feed; `manual_creator` events require admin or creator confirmation to grade.
- **Admin review actions audit-logged.** `events.reviewEvent` writes `entityType: 'event', action: 'event.<status>'` audit rows.
- **Sport-source provenance preserved.** `sourceUrl` persisted on every non-platform event so admins can spot-check the original source.
