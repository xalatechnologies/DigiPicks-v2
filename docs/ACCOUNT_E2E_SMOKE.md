# Subscriber account — manual E2E smoke checklist

Run after account shell, feed entitlement, or Convex auth changes. Requires a signed-in subscriber (Stripe test mode optional for checkout).

## Preconditions

- `pnpm dev` (Vite + Convex)
- Subscriber account with email/password or OAuth
- Optional: Stripe test mode for subscribe / cancel loops

## Account navigation (sidebar)

Walk each sidebar item without typing URLs:

- [ ] Dashboard (`/account`)
- [ ] My Feed (`/account/feed`)
- [ ] Discover (`/account/discover`)
- [ ] Today's Events (`/account/events`)
- [ ] My Results (`/account/results`)
- [ ] Saved (`/account/saved`)
- [ ] Subscriptions (`/account/subscriptions`)
- [ ] Notifications (`/account/notifications`)
- [ ] Messages (`/account/messages`)
- [ ] Community (`/account/community`)
- [ ] Settings (`/account/settings`)

Billing sub-routes (reachable from Settings / Subscriptions):

- [ ] Payment methods (`/account/payment-methods`)
- [ ] Billing history (`/account/billing-history`)
- [ ] Payment issue (`/account/billing/payment-issue`)

## Core subscriber loops

- [ ] **No subs:** feed shows explore banner + Discover CTA
- [ ] Discover → creator profile → checkout → subscribed confirmation
- [ ] Post-checkout **Go to feed** → `/account/feed` shows personalized picks
- [ ] Premium pick body visible **only** for subscribed creator
- [ ] Save pick → appears on Saved; unsave removes it
- [ ] Cancel sub → premium body locks again on feed
- [ ] Messages empty state → Discover / Subscriptions CTAs
- [ ] Dashboard topic chips → Discover with `?sport=` filter
- [ ] Dashboard event cards → Events with `?highlight=` deep-link

## Public / cross-surface

- [ ] `/feed` redirects to `/account/feed`
- [ ] `/saved` → `/account/saved`
- [ ] `/notifications` → `/account/notifications`
- [ ] Public header bell → account notifications
- [ ] Signed-in user on `/events` sees **View in account** CTA
- [ ] Creator user: header menu **Switch to creator studio** → `/dashboard`

## Security spot-check

- [ ] Logged-out client cannot call `feed.personalized` (Convex error)
- [ ] Premium pick `body` omitted server-side when `canViewBody` is false
- [ ] DM send rejected without active subscription to thread creator

## Build gates

```bash
pnpm -r --if-present typecheck
pnpm -r --if-present lint
pnpm --filter @digipicks/web build
pnpm exec eslint apps/web/src --rule 'react-hooks/rules-of-hooks: error'
```

Doctrine greps (zero meaningful hits in `apps/**`):

```bash
grep -rE "style=\{\{" apps --include="*.tsx"
grep -rnE 'className=' apps --include="*.tsx" | grep -vE '\.module\.css|\bcx\(|s\.|className: '
grep -rE 'className="[^"]*\b(flex|grid|gap-|p-|m-|text-|bg-|border|rounded|w-|h-|max-w|min-w|space-|items-|justify-)' apps --include="*.tsx"
find apps -name "*.css"
```
