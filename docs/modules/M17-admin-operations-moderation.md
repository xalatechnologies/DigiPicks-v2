# M17 — Admin Operations, Moderation & Fraud Prevention

## Purpose
The admin's command surface. Moderation queue (events + applications +
disputes), audit-log viewer, GDPR ops, dispute lifecycle, append-only audit
guarantee enforced at the CI layer. Every admin action audit-logged, full
stop.

## Target Roles
Admin · Support · System

## Core Features
- Dispute queue with full lifecycle (open → under_review → resolved | dismissed)
- Application review queue (M08)
- Federated event review queue (M04)
- Audit log drill-down by entityType / entityId
- GDPR export + cascade-anonymize endpoints (M25)
- Append-only audit logs — CI grep blocks any patch/replace/delete
- MFA-gated admin transitions on sensitive paths

## User Stories
- As an admin, I want a single queue for every kind of moderation work.
- As an admin, I want to resolve a dispute with a written resolution that lands in the audit log.
- As support, I want to read the audit trail of every admin action for an account.
- As an admin, I want MFA freshness required for resolving disputes / approving creators.

## Backend / Convex Build
**Tables**
- `disputes` (pickId, creatorId, openedByUserId, reason, detail, status, resolvedByAdminId, resolution, notes[], createdAt, updatedAt)
- `auditLogs` (entityType, entityId, action, actorUserId, metadata, createdAt) — append-only
- `applications` (review queue feeds M08)

**Indexes** — `disputes.by_pick`, `by_creator (createdAt)`, `by_status (createdAt)`, `by_opener (createdAt)`; `auditLogs.by_actor`, `by_tenant`, `by_entity (entityType, entityId)`

**Queries**
- `disputes.queue` (admin), `disputes.get`, `disputes.mine` (opener side)
- `audit.listByEntity` (admin)
- `admin.summary` — dashboard stats (queue counts + recent audit)
- `events.pendingReview`, `applications.listByStatus`

**Mutations**
- `disputes.open` (subscriber/creator/admin), `disputes.addNote`, `disputes.transition` (admin, MFA-gated, audit-logged inline)
- `applications.review` (admin, MFA-gated)
- `events.reviewEvent` (admin)
- `audit.log` (internal — only legitimate writer of `auditLogs`)
- `creators.setPromotion` (admin, audit-logged)

## Frontend Build
**Pages** — `apps/web/src/pages/admin/*`
- `Admin.tsx` — summary dashboard
- `DisputeQueue.tsx` — full moderation surface with filter + transition controls
- `EventReview.tsx` — federated event review

**Components**
- `Table` / `Tr` / `Td` (DS data), `DisputeForm` (DS forms — used on subscriber side too)
- `Segmented` for status filters
- `Badge` (tone-mapped per status)

## Testing
**Unit** — `convex/tests.test.ts > disputes`
- Subscriber opens → admin resolves → terminal status locked
- Non-subscriber non-creator cannot open
- Audit log written inline (same transaction as the dispute write)

**Integration**
- `transition` rejects on already-finalized dispute
- `audit.log` appears in `audit.listByEntity` query

**E2E**
- Admin opens dispute queue → filter to `open` → click into a dispute → resolve with note → audit row visible
- Admin without fresh MFA → transition blocked with clear error

## Governance / Rules
- **Append-only audit.** CI grep (`audit-log append-only guard` step) fails the build on any `.patch / .replace / .delete` against `auditLogs` in the convex/ tree.
- **Audit inline, not scheduled.** Sensitive transitions (`disputes.transition`, `applications.review`) write the audit row in the same transaction so the admin action is atomic with its trail.
- **MFA freshness.** `gateOnMfaIfEnrolled` on every admin-only mutation — soft gate so admins without MFA still work, enrolled admins must re-verify within 15 min.
- **Terminal status is final.** Disputes resolved or dismissed cannot be reopened — re-opening would require a new dispute. Audit captures the original.
- **Admin app stays in `apps/web`.** Routed under `/admin/*` with cookie + role gate; separate-app split deferred unless security review demands isolation.
