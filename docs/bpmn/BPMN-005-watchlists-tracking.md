# BPMN-005 — Customer tracking & watchlists

## Purpose

Customers track creators / events / odds movements and receive realtime
alerts on triggers.

## Trigger

- Customer creates a watchlist rule.
- `lineMovement.checkAlerts` (cron) detects a movement ≥ threshold.
- A pick is published that matches a saved rule.

## Preconditions

- Customer is authenticated.
- Notification preferences are set (or default channels are in effect).

## Actors / Swimlanes

- **Customer**
- **Convex Backend** — `watchlists`, `lineMovement`, `notify`.
- **Notify** — push / telegram / discord / email channels.

## Main flow

```mermaid
flowchart TD
  subgraph C[Customer]
    c1[Add watchlist rule]
    c2[Receive push / DM]
    c3[Tap notification]
    c4[Land on pick / event]
  end
  subgraph K[Convex Backend]
    k1[(watchlists<br/>insert)]
    k2{{lineMovement.checkAlerts<br/>cron 5 min}}
    k3[(odds<br/>read)]
    k4{{notify.onLineMovement}}
    k5{{notify.onPickPublished<br/>matcher}}
  end
  subgraph N[Notify]
    n1{{notify.dispatch}}
  end

  c1 --> k1
  k2 --> k3 -->|implied prob shift &gt;= threshold| k4 -.-> n1 --> c2 --> c3 --> c4
  k5 -.-> n1
```

## Alternative flows

- **Threshold not crossed** → no notification; cursor advances.
- **Notification channel unavailable** → queued + retried with backoff
  (BPMN-015).
- **Watchlist rule disabled** → cron skips the row.
- **Duplicate movement within debounce window** → suppressed
  (`lineMovement.lastNotifiedAt`).

## Postconditions

- `watchlists` row owns the rule.
- `notifications` (audit) row written per fanout.
- `lineMovement.lastNotifiedAt` patched to suppress dupes.

## Realtime events

- `watchlists.mine` reflects the new rule for the customer.
- `notifications.mine` shows the inbox entry.

## AI interactions

None directly. Optional: Copilot can answer "why did I get this alert?"
via the audit query tool.

## Module mapping

- [M14 — Recommendations](../modules/M14-recommendations.md)
- [M19 — Notifications & realtime](../modules/M19-notifications-realtime.md)
