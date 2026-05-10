# BPMN-009 — Creator custom event creation

## Purpose

A creator submits a local / regional / niche match that no upstream
provider covers. The system runs it through admin verification and, on
approval, publishes it as a first-class event eligible for picks,
streams, and community rooms. This is the diagram that proves
**provider-agnostic architecture**.

## Trigger

Creator submits a new event at `/dashboard/events/new`.

## Preconditions

- Creator authenticated and verified.
- Event is not duplicate of an existing federated event (same league,
  date, and participants).

## Actors / Swimlanes

- **Creator**
- **Convex Backend** — `events`, `auditLogs`.
- **Admin**
- **Notify** — admin queue + creator decision.
- **Feed** — public events feed.

## Main flow

```mermaid
flowchart TD
  subgraph CR[Creator]
    cr1[Open /dashboard/events/new]
    cr2[Fill: title, sport, league,<br/>participants, startsAt]
    cr3[Submit]
    cr4[Receive decision]
  end
  subgraph K[Convex Backend]
    k1[(events<br/>insert verificationStatus=creator_submitted)]
    k2[(events<br/>patch verificationStatus=verified)]
    k3[(events<br/>patch verificationStatus=rejected)]
    k4[(auditLogs)]
  end
  subgraph A[Admin]
    a1[Open /admin/events/review]
    a2[Inspect submission]
    a3{Decision}
  end
  subgraph N[Notify]
    n1{{notify.dispatch<br/>admins}}
    n2{{notify.dispatch<br/>creator}}
  end
  subgraph F[Feed]
    f1[events.public re-runs]
  end

  cr1 --> cr2 --> cr3 --> k1 -.-> n1 --> a1 --> a2 --> a3
  a3 -->|approve| k2 -.-> f1
  a3 -->|reject| k3
  k2 -.-> n2 --> cr4
  k3 -.-> n2
  k1 -.-> k4
  k2 -.-> k4
  k3 -.-> k4
```

## Alternative flows

- **Duplicate detection** → mutation rejects with
  `EVENT_DUPLICATE_OF=:eventId` so the creator can converge onto the
  federated row.
- **Need-more-info** → admin patches `verificationStatus='info_needed'`
  with a note; creator gets a resubmit prompt.
- **Rejection appeal** → creator opens a dispute (BPMN-011); audit row
  links the appeal to the original decision.
- **Creator is admin** → still flows through the queue; admin self-review
  is allowed but every transition writes an audit row for traceability.

## Postconditions

- `events.verificationStatus` ∈ {`creator_submitted`, `verified`,
  `rejected`, `info_needed`}.
- On approval, the event is eligible for picks, streams, and grading
  (BPMN-013).
- Audit rows for every state transition.

## Realtime events

- `events.public` re-runs on approval.
- Admin queue counter on `/admin` updates live.
- Creator's `myEvents` query reflects the new state.

## AI interactions

None inline. Optional: a downstream AI dedupe action can compare a
submitted event against the federated catalog and flag likely
duplicates for the admin queue.

## Module mapping

- [M05 — Federated events catalog](../modules/M05-federated-events.md)
- [M16 — Admin & moderation](../modules/M16-admin-moderation.md)
- [M22 — Audit log](../modules/M22-audit-log.md)
