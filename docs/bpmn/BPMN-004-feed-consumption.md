# BPMN-004 — Customer feed consumption

## Purpose

A customer opens their feed and consumes a personalized, realtime stream
of picks — including premium content where they hold entitlement.

## Trigger

Customer navigates to `/feed` (or any feed-bearing page).

## Preconditions

- Customer is authenticated.
- Some creators / picks exist.

## Actors / Swimlanes

- **Customer**
- **Convex Backend** — `feed.list`, `picks`, `subscriptions`
  (`isAccessActive` access gate).
- **Notify** — line-movement + pick-published alerts (BPMN-005, -015).

## Main flow

```mermaid
flowchart TD
  subgraph C[Customer]
    c1[Open /feed]
    c2[Scroll]
    c3[Save / track pick]
  end
  subgraph K[Convex Backend]
    k1{{feed.list<br/>cursor pagination}}
    k2[(subscriptions<br/>isAccessActive gate)]
    k3[(picks<br/>visible set)]
    k4[(savedPicks<br/>insert)]
  end

  c1 --> k1 --> k2 --> k3 --> c2
  c2 --> c3 --> k4
```

## Alternative flows

- **No active subscription for a premium pick** → `isAccessActive(sub)`
  is false; `picks.body` is redacted and `PickCard` renders the upsell
  variant linking to BPMN-002.
- **Cursor exhausted** → empty page; UI shows the friendly EmptyState.
- **Realtime new pick during session** → Convex subscription pushes the
  new row; UI prepends without a refresh.
- **AI-ranked feed (opt-in)** — `feed.personalized` accepts an optional
  `rankByAi: true` arg that re-orders items inside the same query via a
  pure-function blend: `0.40 × pick.aiConfidence + 0.25 ×
creator.trustScore + 0.20 × recency-decay + 0.15 ×
pick.confidence-enum`. Defaults missing values to 50 (neutral) so a
  pick with no AI analysis still ranks. Recency uses a 24h half-life
  with a 7-day floor. The response carries `ranked: true` so the UI can
  show a "Top picks" badge. Default false to preserve the legacy
  chronological order for surfaces that depend on it.

## Postconditions

- `savedPicks` row written when the customer taps save.
- `picks.viewedBy` (analytics counter) bumped via internal mutation.

## Realtime events

- `feed.list` re-runs whenever a new `picks` row is inserted that the
  customer is entitled to.
- `lineMovement.alerts` pings via push (BPMN-005).

## AI interactions

No live AI calls on the feed itself — the ranking blend reads
already-stored `pick.aiConfidence` (populated by `ai.analyzePick` in
BPMN-007) and `creator.trustScore` (recomputed nightly by
`trust.recomputeTrustScores`). The Copilot (BPMN-014) is a separate
surface a customer can open from `/account/copilot`.

## Module mapping

- [M06 — Access control & entitlements](../modules/M06-access-control-entitlements.md)
- [M10 — Customer feed & discovery](../modules/M10-customer-feed-discovery.md)
- [M13 — Notifications & smart alerts](../modules/M13-notifications-smart-alerts.md)
- [M18 — Saved library & watchlists](../modules/M18-saved-library-watchlists.md)
