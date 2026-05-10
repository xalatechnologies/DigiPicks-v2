# BPMN-006 — Creator application & verification

## Purpose

A user applies to become a creator, uploads proof, and is reviewed by an
admin. On approval the user gains the `creator` role and a `creators`
row.

## Trigger

User submits the creator application at `/apply`.

## Preconditions

- User is authenticated.
- No existing application in `submitted` / `review` status for this user.

## Actors / Swimlanes

- **Applicant (user)**
- **Convex Backend** — `applications`, `creators`, `users`, `auditLogs`.
- **Admin** — `/admin` review queue.
- **Notify** — applicant + admin channels.
- **Storage** — Convex file storage for proof uploads.

## Main flow

```mermaid
flowchart TD
  subgraph U[Applicant]
    u1[Open /apply]
    u2[Fill form + upload proof]
    u3[Submit]
    u4[Receive decision]
  end
  subgraph K[Convex Backend]
    k1[(applications<br/>status=submitted)]
    k2[(applications<br/>status=approved)]
    k3[(users<br/>role=creator)]
    k4[(creators<br/>insert)]
    k5[(auditLogs)]
  end
  subgraph A[Admin]
    a1[Open /admin queue]
    a2[Review proofs]
    a3{Decision}
  end
  subgraph N[Notify]
    n1{{notify.dispatch<br/>applicant}}
    n2{{notify.dispatch<br/>admins}}
  end

  u1 --> u2 --> u3 --> k1
  k1 -.-> n2 --> a1 --> a2 --> a3
  a3 -->|approve| k2
  k2 -.-> k3
  k3 -.-> k4
  k4 -.-> k5
  k4 -.-> n1 --> u4
  a3 -->|reject| k5
```

## Alternative flows

- **Reject** → `applications.status='rejected'`, applicant notified;
  reapply blocked for `cooldownDays` (default 30).
- **Flag for review** → `status='flagged'` enters the trust-ops queue
  (BPMN-010).
- **Proof upload fails** → applicant retries; no `applications` row is
  written until submit succeeds atomically.
- **Approval revoked later** → admin sets `creators.suspended=true`;
  audit row written; downstream queries filter the creator out.

## Postconditions

- `applications.status` ∈ {`approved`, `rejected`, `flagged`}.
- On approval: `users.role='creator'`, `users.creatorId` set, `creators`
  row exists with default tiers seeded.
- Audit rows for every state transition (append-only).

## Realtime events

- Admin queue counter (`admin.summary.pendingApplications`) updates live.
- Applicant's `applications.mine` flips status without refresh.

## AI interactions

- AI authenticity scoring of application narratives is DEFERRED. The
  schema reserves `applications.aiAuthenticityScore` but no flow
  populates it today; admin review is fully manual.

## Module mapping

- [M01 — Authentication, identity & roles](../modules/M01-authentication-identity-roles.md)
- [M08 — Creator verification & trust](../modules/M08-creator-verification-trust.md)
- [M17 — Admin operations & moderation](../modules/M17-admin-operations-moderation.md)
- [M25 — Platform settings, compliance & audit](../modules/M25-platform-settings-compliance-audit.md)
