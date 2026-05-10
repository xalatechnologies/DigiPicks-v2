# M07 — Subscription, Billing & Monetization

## Purpose
The revenue engine. Stripe Checkout → subscription lifecycle → entitlement
flip → creator payouts. Idempotency-protected on every outbound call;
webhook-driven on every state transition.

## Target Roles
Customer · Creator · Admin · Support · System

## Core Features
- Stripe Checkout Sessions in subscription mode
- Per-creator pricing tiers (`pricingTiers` table replacing the legacy free/premium/vip enum)
- Auto-seed of Free/Premium/VIP defaults on first creator-load post-deploy
- Idempotency-Key on customer create + checkout session create
- Webhook handlers: `customer.subscription.{created,updated,deleted}`, `invoice.paid`, `charge.refunded`
- Creator earnings via `payouts` table (Stripe-backed)
- Referral coupon attachment at checkout (M19)
- Rate-limiter (5/10min sharded bucket) on `createCheckoutSession`

## User Stories
- As a creator, I want to define multiple paid tiers with custom perks.
- As a customer, I want one-click Stripe checkout that unlocks content immediately.
- As a creator, I want to see my Stripe-backed earnings + payout history.
- As a support operator, I want refunds to revoke access instantly.
- As an admin, I want every Stripe event audit-logged.

## Backend / Convex Build
**Tables**
- `subscriptions` (subscriberId, creatorId, plan, status, startedAt, renewsAt, cancelledAt, stripeSubscriptionId, stripeCustomerId)
- `pricingTiers` (creatorId, name, priceCents, interval, perks[], stripePriceId, archived, sortOrder, legacyPlan)
- `payouts` (creatorId, amount, currency, status, stripePayoutId, periodStart, periodEnd, paidAt, metadata)
- `creators.{stripePriceIdPremium, stripePriceIdVip}` (legacy fields, retained)
- `users.stripeCustomerId`

**Queries**
- `pricingTiers.byCreator`, `pricingTiers.get`
- `payouts.byMe`, `payouts.summary`
- `creators.earningsHistory`

**Mutations**
- `pricingTiers.create / update / archive` (creator-only)
- `pricingTiers._ensureDefaultsForCreator` (internal idempotent seed)
- `subscriptions.subscribe` (free) / `cancel`
- `subscriptions._recordSubscriptionFromStripe` / `_updateSubscriptionStatusFromStripe` / `_cancelSubscriptionFromStripe`
- `payouts._recordPayoutFromStripe`

**Actions**
- `stripe.createCheckoutSession` (action — uses raw Stripe API via `withRetry` + Idempotency-Key)
- `stripe._meForCheckout` / `_creatorForCheckout` (internal queries called from the action)

**Webhook** — `convex/http.ts /stripe-webhook`
- HMAC-SHA256 signature verification, audit-logs every event before dispatch

## Frontend Build
**Pages**
- `apps/web/src/dashboard/pages/Products.tsx` — tier editor
- `apps/web/src/dashboard/pages/Earnings.tsx` — payout history
- `apps/web/src/account/pages/Subscriptions.tsx` — subscriber-side billing

**Components**
- `PricingModal`, `PricingCard`, `PriceCard`, `SubscriptionTile`, `BigStat`, `KV`

## Testing
**Unit** — `convex/subscriptions-stripe.test.ts`
- `_recordSubscriptionFromStripe` idempotency on `stripeSubscriptionId`
- Status mapping: `active|trialing → active`, `past_due|unpaid → past_due`, others → `cancelled`
- `_recordPayoutFromStripe` idempotency

**Integration**
- `createCheckoutSession` → Stripe webhook → `_recordSubscriptionFromStripe` → entitlement flip
- Refund webhook → `status: 'refunded'`

**E2E**
- Customer subscribes via Stripe test card → premium pick unlocks within 5s
- Customer cancels → access remains until period end → after deletion webhook, access revoked

## Governance / Rules
- **Idempotency-Key required on every Stripe POST.** Customer-create keys are `customer-create:<userId>` (lifetime). Checkout-session keys are bucketed to a 5-minute window so retries land on the same session.
- Webhook signature verified before any dispatch — invalid signatures return 401, valid events audit-logged before any DB write.
- Mutation handlers idempotent on `stripeSubscriptionId` / `stripePayoutId` so Stripe redelivery is safe.
- Refunds (`charge.refunded` / `invoice.refunded` / `invoice.voided`) flip status to `'refunded'`; M06 query path picks it up reactively.
- `pricingTiers._ensureDefaultsForCreator` runs idempotently on first read post-deploy — existing creators don't lose subscriptions.
- Support-side admin overrides go through audit-logged mutations — never direct DB edits.
