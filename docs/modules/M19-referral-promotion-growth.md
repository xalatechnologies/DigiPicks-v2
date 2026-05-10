# M19 — Referral, Promotion & Growth Tools

## Purpose
The growth layer. Per-user referral codes that attach to Stripe Checkout
and credit the referrer 10% of the first invoice. Promoted-creator
placement on Landing. Future home for trial offers and discount campaigns.

## Target Roles
Customer · Creator · Admin · System

## Core Features
- Per-user referral codes minted via `referrals.mintMyCode` (idempotent — returns existing un-converted row)
- Stripe Checkout attaches `metadata.referralCode` so the webhook can credit on first conversion
- 10% payout on the first invoice — flat for MVP, configurable later
- Self-refer block + idempotent re-delivery
- Promoted creators rotation (`promotedUntil` + `promotedRank`) on Landing
- Admin-only promotion mutation, audit-logged

## User Stories
- As a creator, I want a referral link I can share to grow my audience.
- As a customer, I want my friend's referral link to give them credit when I subscribe.
- As an admin, I want to feature a creator on the Landing page for a paid window.
- As a creator, I want to see lifetime conversions + earnings from my referrals.

## Backend / Convex Build
**Tables**
- `referrals` (referrerUserId, code, referredUserId?, convertedAt?, payoutCents?, stripeCouponId?, metadata, createdAt) — by_code, by_referrer (createdAt), by_referred
- `creators.{promotedUntil, promotedRank}` (extends creators) — by_promoted

**Queries**
- `referrals.myCodes` — calling user's history (live + converted)
- `referrals.lookup` — public; resolve a code to the referrer (used by checkout)
- `creators.promoted` — currently-promoted creators ordered by rank

**Mutations**
- `referrals.mintMyCode` — idempotent live-row reuse
- `referrals._redeem` (internal — called by Stripe webhook on `invoice.paid`)
- `creators.setPromotion` (admin-only — audit-logged)

**Stripe path** — `convex/http.ts dispatchPayout`
- Reads `subscriptionMetadata.referralCode` + `subscriptionMetadata.userId`
- Calls `referrals._redeem({ code, referredUserId, payoutCents = floor(amountPaid * 0.10) })`

**Code generation**
- 8-char base36 with `dp_` prefix (e.g. `dp_4kqxn0a3`)

## Frontend Build
**Pages**
- `apps/web/src/dashboard/pages/Growth.tsx` — `ReferralsCard` with live code + conversions + lifetime earnings
- `apps/web/src/pages/Landing.tsx` — promoted creators surface (consumes `creators.promoted`)

**Components**
- `ReferralShareModal` (feedback — copy-link + code + stats)

## Testing
**Unit**
- `referrals.mintMyCode` idempotent — returns same un-converted row on repeat
- `_redeem` self-refer block (referrerUserId === referredUserId)
- Idempotent re-delivery (already-converted rows return same id)

**Integration**
- `createCheckoutSession` with `referralCode` arg → metadata propagated to subscription_data
- Stripe `invoice.paid` webhook with referral metadata → `_redeem` writes payoutCents

**E2E**
- Creator opens Growth page → mints code → ReferralShareModal copies the link
- Friend uses link → subscribes → first invoice clears → payout row updated; creator sees lifetime earnings update

## Governance / Rules
- **Self-refer block.** `_redeem` rejects when `referrerUserId === referredUserId`.
- **Idempotent re-delivery.** Already-converted rows return the same id — Stripe webhook retries are safe.
- **10% flat for MVP.** Configurable per deploy (env-tunable would land here when needed).
- **Promoted creators audit-logged.** `creators.setPromotion` writes `creator.promoted` / `creator.unpromoted` audit rows.
- **Code prefix `dp_`** distinguishes referral codes from internal IDs in URLs / logs.
- **Trial offers / general promo coupons deferred.** Stripe Coupon API would integrate here; not built at MVP.
