# M06 — Access Control & Entitlements

## Purpose

Who-can-see-what. Premium / VIP picks, subscriber-only channels, creator DMs,
and admin surfaces all converge through this module's helpers. Every access
decision is server-evaluated — UI never decides on its own.

## Target Roles

Customer · Creator · Admin · System

## Core Features

- Subscription-tier gating at the query layer (free / premium / vip)
- Three channel access levels (`public`, `subscriber`, `vip`) with creator-owner + admin bypass
- Stream-linked rooms close when the linked creator is offline
- DM threads require an active subscription unless the caller is the creator-owner
- Refund webhook flips `subscriptions.status` to `'refunded'` and revokes access in real time
- Reactive — Convex queries re-evaluate the moment subscription state changes

## User Stories

- As a customer, I want premium picks unlocked the moment my subscription clears.
- As a creator, I want subscriber-only channels that non-subscribers can see (locked) but not read.
- As an admin, I want a refunded subscription to revoke premium access immediately.
- As a non-subscriber, I want a clear locked state with a "subscribe to unlock" CTA.

## Backend / Convex Build

**Tables**

- `subscriptions` (subscriberId, creatorId, plan, status, startedAt, renewsAt, cancelledAt, stripeSubscriptionId, stripeCustomerId)
- `pricingTiers` (creatorId, name, priceCents, interval, perks[], stripePriceId, archived, sortOrder, legacyPlan)

**Queries**

- `subscriptions.isSubscribed`, `subscriptions.mySubscriptions`, `subscriptions.countByCreator`, `subscriptions.byCreator`
- `channels.myAccess` — `{ allowed, requiredTier }` for the active user

**Mutations**

- `subscriptions.subscribe` (free plan) / `subscriptions.cancel`
- `subscriptions._recordSubscriptionFromStripe` / `_updateSubscriptionStatusFromStripe` / `_cancelSubscriptionFromStripe` (webhook callbacks)

**Helpers** — `convex/channels.ts`

- `checkChannelAccess(ctx, channel, userId)` → `{ allowed, requiredTier }`. Returns `allowed: true` for creator-owners and admins.

**Stripe webhook branches** — `convex/http.ts`

- `customer.subscription.{created,updated,deleted}`, `invoice.paid`, `charge.refunded`, `invoice.refunded`, `invoice.voided`

## Frontend Build

**Pages**

- `apps/web/src/pages/CreatorDetail.tsx` — `PricingModal` checkout entry point
- `apps/web/src/pages/Community.tsx` — shows `LockedChannelPanel` when `myAccess.allowed === false`
- `apps/web/src/dashboard/pages/Products.tsx` — creator-side tier editor

**Components**

- `LockedChannelPanel`, `LockedAnalysis`, `PricingModal`, `PricingCard`, `AccessBadge`

## Testing

**Unit**

- `checkChannelAccess` matrix: public / subscriber / vip × {creator-owner, admin, active sub, no sub}
- VIP channel rejects subscriber-tier active subscription

**Integration**

- `messages.postToChannel` rejects with "requires subscriber subscription" when caller has no active sub
- `messages.listByChannel` returns `[]` for non-subscribers so the UI can render the locked state via `myAccess`

**E2E**

- Customer subscribes via Stripe → premium pick body unlocks within seconds
- Stripe refund webhook → access revoked on next reactive re-evaluation
- Non-subscriber lands on a sub-only channel → locked panel + Subscribe CTA

## Governance / Rules

- **Server-evaluated only.** Client-side gating is presentation; truth lives in Convex queries.
- Creator-owner bypass in `checkChannelAccess` + admin bypass — both audit-logged when used.
- Refund flips `subscriptions.status` to `'refunded'`; the next reactive query revokes access without a manual reload.
- Locked channels stay visible in lists by design — drives conversion. Hidden channels would lose the funnel.
- Stripe is the source of truth for subscription state; webhook idempotency via `stripeSubscriptionId` index.
