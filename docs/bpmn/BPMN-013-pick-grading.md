# BPMN-013 — Pick grading workflow

## Purpose

When an event completes, every pending pick on it is auto-graded
(win / loss / push / void) with NFR-006 grade immutability. The
grading run feeds analytics, performance, and downstream notifications.

## Trigger

- Cron `liveScores.poll` flips `events.status` to `completed` once the
  upstream score provider reports the final.
- Cron `autoGrader.gradeCompletedPicks` runs hourly and grades pending
  picks on completed events.
- Admin manual override path (rare; runs through BPMN-011).

## Preconditions

- Event has `status='completed'` and both `homeScore` /
  `awayScore` are numeric.
- Picks on the event have `grade='pending'`.

## Actors / Swimlanes

- **Cron**
- **Convex Backend** — `events`, `picks`, `auditLogs`,
  `creatorPerformance`.
- **AI Engine** — optional grading-explanation summary.
- **Notify** — pick-graded fanout.
- **Customer feed** — `results.mine`, creator `Performance`.

## Main flow

```mermaid
flowchart TD
  subgraph C[Cron]
    c1{{liveScores.poll}}
    c2{{autoGrader.gradeCompletedPicks<br/>hourly}}
  end
  subgraph K[Convex Backend]
    k1[(events<br/>patch status=completed)]
    k2[(picks<br/>read pending)]
    k3{{gradePick<br/>spread / total / h2h}}
    k4[(picks<br/>patch grade + netUnits + gradedAt)]
    k5[(auditLogs<br/>pick.graded.* autoGraded=true)]
    k6{{creatorPerformance.rollUp}}
  end
  subgraph A[AI]
    a1{{ai.gradingExplanation<br/>optional}}
  end
  subgraph N[Notify]
    n1{{notify.onPickGraded}}
  end

  c1 --> k1
  c2 --> k1
  k1 --> k2 --> k3 --> k4 -.-> k5
  k4 -.-> k6
  k4 -.-> n1
  k4 -.-> a1
```

## Alternative flows

- **Unparseable line** → the pick stays `pending`; admin can grade
  manually. Counter increments on the auto-grader observability card
  (`/admin`).
- **Spread mascot collision** (e.g., both teams share a city) → grader
  bails to `pending` rather than guess; admin handles it.
- **Late score correction** → upstream provider patches the score;
  because grades are immutable (NFR-006), correction flows through the
  dispute path (BPMN-011) which writes a `pick.grade.overridden` audit
  row.
- **Re-run safety** → `_gradeOnePick` short-circuits when
  `pick.grade !== 'pending'`. Re-running the cron is safe.

## Postconditions

- `picks.grade` ∈ {`win`, `loss`, `push`, `void`}.
- `picks.netUnits` reflects the resolved P&L.
- One `pick.graded.<grade>` audit row per pick with
  `metadata.autoGraded=true` (or `false` for admin overrides).
- `creatorPerformance` rollup updated (win rate, ROI, units).

## Realtime events

- `picks.mine`, `results.mine`, and creator `Performance` queries
  auto-update.
- Admin auto-grader observability section (`/admin`) reflects the
  latest counts.

## AI interactions

- Optional: `ai.gradingExplanation` produces a one-sentence summary
  ("Took -3.5; final 27-21, covered by 2.5"). Stored on
  `picks.gradeExplanation` for the customer-facing surface.

## Module mapping

- [M09 — Grading & analytics](../modules/M09-grading-analytics.md)
- [M14 — Recommendations](../modules/M14-recommendations.md)
- [M19 — Notifications & realtime](../modules/M19-notifications-realtime.md)
- [M22 — Audit log](../modules/M22-audit-log.md)
