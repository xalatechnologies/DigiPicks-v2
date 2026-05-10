# M08 — Creator Verification & Trust System

## Purpose
The trust foundation. Anyone can apply to be a creator; admins review;
approved applicants get a creator profile + role flip + linked user record.
A nightly cron computes a 0–100 composite trust score from observable
signals so customers can pick creators with confidence.

## Target Roles
Applicant · Creator · Customer · Admin · Support · System

## Core Features
- Application form on the public `/apply` route (auth-gated)
- Duplicate-email rejection on submit
- Admin review with approve / reject / more_info / flagged transitions
- Inline creator-profile creation on approval (atomic with the user-record patch)
- Nightly trust score recomputation: verification 30% + winRate 25% + disputeRatio 20% + ageDays 15% + sampleSize 10%
- 5-tier visual badge (Elite / Trusted / Established / Emerging / Unverified)

## User Stories
- As an applicant, I want to submit a profile, niche, sports, and proof.
- As an admin, I want a review queue with approve / reject / request-more-info actions.
- As a customer, I want to see at a glance how trustworthy a creator is.
- As an admin, I want every review action audit-logged.

## Backend / Convex Build
**Tables**
- `applications` (name, handle, email, sport, niche, existingFollowing, priceHint, proofCount, winClaim, status, reviewedBy, reviewNotes, submittedAt, reviewedAt)
- `creators.{trustScore, trustScoreUpdatedAt, trustSignals}` — recomputed nightly
- `creators.{verified, status}` — admin-controlled flags

**Indexes** — `applications.by_status (submittedAt)`, `by_email`

**Queries**
- `applications.listByStatus` (admin)
- `trust.get` — `{ score, updatedAt, signals }` for a creator

**Mutations**
- `applications.submit` — auth-required, rate-limited (3/min sharded bucket)
- `applications.review` — admin-only. On approve: synchronously creates the `creators` row, patches the applicant's `users.creatorId`, audit-logs the transition.
- `creators.create` (internal) — used by the review path
- `trust.recomputeTrustScores` (internal cron handler)

## Frontend Build
**Pages**
- `apps/web/src/pages/Apply.tsx` — public application form
- `apps/web/src/pages/admin/Admin.tsx` — review summary dashboard
- `apps/web/src/pages/CreatorDetail.tsx` — surfaces `TrustScoreBadge` + verified mark

**Components**
- `TrustScoreBadge` (atom — 5 tiers via tone)
- `VerifiedMark`
- `CreatorApplicationForm` (built from DS forms)

## Testing
**Unit** — `convex/tests.test.ts > applications`
- Submit + duplicate-email rejection + unauthenticated rejection

**Integration**
- Approve → user.creatorId patched + creator row inserted + audit row written, all in the same transaction
- Trust signals: full table scan with bounded `take(2000)` recomputes scores

**E2E**
- Applicant submits → admin approves → applicant signs in → reaches `/dashboard/`
- Trust badge renders the right tier on a creator with mid-range stats

## Governance / Rules
- Approval is **atomic** — the application status flip, creator row insert, and `users.creatorId` patch all happen inside the same `applications.review` mutation transaction. No half-state where the application says "approved" but the user can't access creator endpoints.
- `applications.submit` rate-limited (3/min, sharded × 1) so the manual review queue is never flooded.
- Trust score recompute runs nightly; null scores show a muted "—" placeholder so fresh creators don't render broken badges.
- All admin transitions write `audit.log` entries with `entityType: 'application'`.
- Verification badge (`creators.verified`) is admin-only — never auto-flipped from trust score alone.
