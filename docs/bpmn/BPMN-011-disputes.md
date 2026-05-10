# BPMN-011 — Fraud detection & dispute resolution

## Purpose

A user (customer or creator) opens a dispute against a grade, payment,
or moderation decision. Admin investigates with full audit context and
either upholds or overrides. Override paths are heavily audited and
require fresh MFA.

## Trigger

User clicks **Open dispute** from a graded pick, transaction, or
moderation outcome.

## Preconditions

- User authenticated.
- The target entity exists and is within the dispute window
  (`disputeWindowDays`, default 14).
- No open dispute already exists for the same entity from the same user
  — `disputes.open` runs a bounded scan (`.take(50)` on `by_pick`) and
  returns the existing dispute id if one is found. The duplicate guard
  is idempotent: a re-click is a no-op, not an error.

## Actors / Swimlanes

- **User (claimant)**
- **Convex Backend** — `disputes`, target entity, `auditLogs`.
  `disputes.transition` accepts an optional `overrideGrade` arg; when
  set on a `pick` dispute it flips `picks.grade` and writes a paired
  `pick.grade.overridden` audit row inside the same transaction
  (NFR-006 — the only sanctioned exit from grade immutability).
- **Admin**
- **Notify** — both parties.

## Main flow

```mermaid
flowchart TD
  subgraph U[Claimant]
    u1[Open dispute]
    u2[Provide evidence]
    u3[Receive resolution]
  end
  subgraph K[Convex Backend]
    k0{Duplicate-open guard<br/>by_pick .take 50}
    k1[(disputes<br/>insert status=open)]
    k2[(disputes<br/>patch status=under_review)]
    k3[(disputes<br/>patch status=upheld)]
    k4{{disputes.transition<br/>overrideGrade arg}}
    k4a[(disputes<br/>patch status=overridden)]
    k5[(picks<br/>flip grade)]
    k6[(auditLogs<br/>dispute.* + paired<br/>pick.grade.overridden)]
  end
  subgraph A[Admin]
    a1[Open /admin/disputes]
    a2[Investigate]
    a3{Decision}
  end
  subgraph N[Notify]
    n1{{notify.dispatch}}
  end

  u1 --> u2 --> k0
  k0 -->|duplicate found| u3
  k0 -->|new| k1
  k1 -.-> n1 --> a1 --> a2 --> k2 --> a3
  a3 -->|uphold| k3 -.-> n1 --> u3
  a3 -->|override| k4 --> k4a
  k4 -.-> k5
  k4a -.-> k6
  k4a -.-> n1 --> u3
  k1 -.-> k6
  k3 -.-> k6
```

## Alternative flows

- **Stripe refund (DEFERRED)** — there is no Stripe refund integration
  on the dispute path today. Admins can override a grade or close the
  dispute upheld; monetary remediation requires a future code path that
  calls `refunds.create`.
- **MFA stale on override** → action blocked; admin re-authenticates.
- **Multiple disputes per entity** → consolidated by `entityId`; the
  decision applies to all.
- **Grading override** — even though grades are normally immutable
  (NFR-006), `disputes.transition({ overrideGrade })` is the explicit,
  audited override channel. The transition flips `picks.grade` and
  writes a paired `pick.grade.overridden` audit row in the same
  transaction.

## Postconditions

- `disputes.status` ∈ {`open`, `under_review`, `upheld`,
  `overridden`}.
- On override with `overrideGrade`: `picks.grade` is flipped and a
  paired `pick.grade.overridden` audit row is written in the same
  transaction.
- Audit rows on every transition.

## Realtime events

- Both parties' `disputes.mine` queries update without refresh.
- Admin queue counter (`admin.summary`) reflects the new pending count.

## AI interactions

- AI-driven anomaly detection over grading patterns is DEFERRED. Today
  the admin queue is rule-based; admins read evidence directly.

## Module mapping

- [M09 — Pick grading & performance](../modules/M09-pick-grading-performance.md)
- [M17 — Admin operations & moderation](../modules/M17-admin-operations-moderation.md)
- [M25 — Platform settings, compliance & audit](../modules/M25-platform-settings-compliance-audit.md)
