# Creator studio — manual E2E smoke checklist

Run after studio or Convex auth changes. Requires a dev deployment with seed data or an approved creator account.

## Preconditions

- `pnpm dev` (Vite + Convex)
- Creator: apply → admin approve, or dev bootstrap per [RUNBOOK.md](./RUNBOOK.md#creator-studio-qa-path)
- Optional: Stripe test mode for checkout / Connect

## Studio navigation (sidebar)

Walk each sidebar item without typing URLs:

- [ ] Dashboard (`/dashboard`)
- [ ] Posts / Picks
- [ ] Events
- [ ] Messages
- [ ] Subscribers
- [ ] Products / Pricing
- [ ] Access levels
- [ ] Payouts
- [ ] Analytics
- [ ] Copilot
- [ ] Profile
- [ ] Settings → Discord integration → Discussion insights

## Core loops

- [ ] Create pick → publish → appears in picks table
- [ ] Edit pick (`?pickId=`) → save → list updates
- [ ] Create or edit pricing tier → persists
- [ ] Access levels save
- [ ] Earnings → Connect Stripe CTA → onboarding route
- [ ] Discord webhook save + test (if configured)

## Subscriber / public surfaces

- [ ] `/notifications` redirects to `/account/notifications`
- [ ] `/feed` → `/account/feed`
- [ ] Public header bell → account notifications
- [ ] Platform admin sees **Admin** in public user menu

## Security spot-check

- [ ] Logged-out client cannot call `subscriptions.byCreator` (Convex error / empty)

## Build gates

```bash
pnpm -r --if-present typecheck
pnpm -r --if-present lint
pnpm --filter @digipicks/web build
pnpm exec eslint apps/web/src --rule 'react-hooks/rules-of-hooks: error'
```
