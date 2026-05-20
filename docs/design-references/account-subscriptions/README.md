# Account — Subscriptions

Stitch reference for the subscriber **Subscriptions** page (`/account/subscriptions`).

| File         | Role                                                               |
| ------------ | ------------------------------------------------------------------ |
| `screen.png` | Visual target — summary metrics, membership cards, billing sidebar |
| `code.html`  | Structure, copy, filters, payment/history panels                   |
| `DESIGN.md`  | Editorial system notes (map to existing tokens only)               |

## Implementation

- **Route:** `apps/web/src/account/pages/Subscriptions.tsx`
- **DS:** `StudioSummaryGrid`, `SubscriptionMembershipCard`, `AccountBillingPanel`, `AccountSubscriptionsPromo`
- **Data:** `api.subscriptions.mySubscriptions`, `api.subscriptions.cancel`
