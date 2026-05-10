# BPMN-016 — Realtime event lifecycle

## Purpose

The architectural backbone. An event — federated provider event,
creator-submitted custom event, or stream-linked event — lives through a
single, shared state machine. Picks, streams, channels, grading, and
notifications all attach to this lifecycle.

## Trigger

- Provider ingest (`eventsSync.fetchAndUpsert`) for federated events.
- `events.create` mutation for creator-submitted events
  (BPMN-009).
- `streams.create` for stream-only events (BPMN-008 — the stream may
  link to an existing event or create a lightweight one).

## Preconditions

- Sport / league reference data exists.
- For verified events: an admin or upstream source has approved them
  (`verificationStatus='verified'`).

## Actors / Swimlanes

- **Source** — external provider, creator, or stream.
- **Convex Backend** — `events`, `picks`, `streams`, `channels`,
  `auditLogs`.
- **Cron** — odds (BPMN-012), live scores, grading (BPMN-013), stream
  detection (BPMN-008).
- **Feed / consumers** — public events list, picks, streams.

## State machine

```mermaid
flowchart TD
  S[(scheduled)]
  L[(live)]
  C[(completed)]
  G[(graded)]
  X[(canceled)]

  S -->|kickoff time| L
  L -->|final score| C
  C -->|autoGrader.gradeCompletedPicks| G
  S -.->|admin / source| X
  L -.->|admin / source| X
```

## Main flow

```mermaid
flowchart TD
  subgraph SRC[Source]
    src1[/Provider sync<br/>or creator submit<br/>or stream/]
  end
  subgraph K[Convex Backend]
    k1[(events<br/>insert status=scheduled)]
    k2{{eventsSync.normalize<br/>or events.approve}}
    k3[(events<br/>patch status=live)]
    k4[(events<br/>patch homeScore<br/>awayScore status=completed)]
    k5[(events<br/>downstream:<br/>picks graded BPMN-013)]
    k6[(events<br/>patch status=canceled)]
    k7[(auditLogs)]
  end
  subgraph CRON[Cron]
    cr1{{liveScores.poll<br/>1 min}}
    cr2{{pollOddsSnapshots<br/>1 min}}
    cr3{{streams.detectLive<br/>5 min}}
    cr4{{autoGrader.gradeCompletedPicks<br/>hourly}}
  end
  subgraph F[Feed / consumers]
    f1[events.public]
    f2[events.detail]
    f3[picks.byEvent]
    f4[streams.byEvent]
  end

  src1 --> k1 --> k2
  cr1 --> k3
  cr1 --> k4
  cr2 -.-> f2
  cr3 -.-> f4
  cr4 --> k5
  k1 -.-> f1
  k3 -.-> f1
  k4 -.-> f1
  k4 -.-> k7
  k6 -.-> k7
  k1 -.-> k7
  k3 -.-> k7
```

## Alternative flows

- **Postponed** → status flips back to `scheduled` with a new
  `startsAt`; picks remain pending; subscribers get a postponement
  notification (BPMN-015).
- **Forfeit / no-contest** → admin patches status to `canceled` and the
  grader voids open picks (`grade='void'`, `netUnits=0`).
- **Score correction post-grading** → grades are immutable
  (NFR-006); the correction flows through dispute resolution
  (BPMN-011) and writes a `pick.grade.overridden` audit row.
- **Stream-only event with no provider counterpart** → the event is
  created in the `verified` state by the stream creator (admin
  approval still applies if it's a custom event — BPMN-009).
- **Provider drift** — an event already in `live` whose provider record
  disappears keeps the last-known state; a metric counter ticks so
  admins can investigate.

## Postconditions

- `events.status` reflects ground truth: `scheduled`, `live`,
  `completed`, `graded`, or `canceled`.
- All attached `picks` are graded once the event is `graded`.
- `streams` and `channels` rows are archived once the event ends.
- Audit rows for every transition (append-only).

## Realtime events

- Every `events.public`, `events.detail`, `picks.byEvent`,
  `streams.byEvent`, and `feed.list` query subscribes to events.

## AI interactions

- Optional dedupe pass on `eventsSync.normalize` to merge
  near-identical creator submissions with federated events.
- Optional `ai.gradingExplanation` on the
  `completed → graded` transition (BPMN-013).

## Module mapping

- [M05 — Federated events catalog](../modules/M05-federated-events.md)
- [M06 — Odds ingestion & intel](../modules/M06-odds-intel.md)
- [M08 — Picks publishing](../modules/M08-picks-publishing.md)
- [M09 — Grading & analytics](../modules/M09-grading-analytics.md)
- [M11 — Streaming integration](../modules/M11-streaming-integration.md)
- [M22 — Audit log](../modules/M22-audit-log.md)
