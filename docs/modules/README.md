# DigiPicks — Module Specification

Engineering-ready specs for every module in the platform. Each file
follows the same structure (Purpose · Target Roles · Core Features ·
User Stories · Backend / Convex Build · Frontend Build · Testing ·
Governance / Rules) so a contributor can pick any module up cold.

## Foundations

- [M01 — Authentication, Identity & Roles](./M01-authentication-identity-roles.md)
- [M02 — Realtime Convex Platform Foundation](./M02-realtime-platform-foundation.md)
- [M03 — Custom Component Library & Design Token System](./M03-design-system-component-library.md)

## Domain Core

- [M04 — Provider-Agnostic Event Engine](./M04-provider-agnostic-event-engine.md)
- [M05 — Picks & Publishing Engine](./M05-picks-publishing-engine.md)
- [M06 — Access Control & Entitlements](./M06-access-control-entitlements.md)
- [M07 — Subscription, Billing & Monetization](./M07-subscription-billing-monetization.md)
- [M08 — Creator Verification & Trust System](./M08-creator-verification-trust.md)
- [M09 — Pick Grading & Performance Tracking](./M09-pick-grading-performance.md)

## Customer Surfaces

- [M10 — Customer Feed & Discovery](./M10-customer-feed-discovery.md)
- [M11 — Realtime Odds Intelligence](./M11-realtime-odds-intelligence.md)
- [M12 — AI Intelligence Engine](./M12-ai-intelligence-engine.md)
- [M13 — Notifications & Smart Alerts](./M13-notifications-smart-alerts.md)
- [M14 — Community & Realtime Interaction](./M14-community-realtime-interaction.md)
- [M15 — Livestream Integrations](./M15-livestream-integrations.md)

## Creator + Admin

- [M16 — Creator Analytics Dashboard](./M16-creator-analytics-dashboard.md)
- [M17 — Admin Operations, Moderation & Fraud Prevention](./M17-admin-operations-moderation.md)
- [M18 — Saved Library, Watchlists & Tracking](./M18-saved-library-watchlists.md)
- [M19 — Referral, Promotion & Growth Tools](./M19-referral-promotion-growth.md)

## Integrations

- [M20 — Discord Integration & Community Sync](./M20-discord-integration.md)
- [M21 — Telegram Integration](./M21-telegram-integration.md)
- [M22 — External Sports Data Provider Layer](./M22-external-sports-data-providers.md)
- [M23 — Custom Event Review & Federation Source Management](./M23-custom-event-review-federation.md)

## AI + Compliance

- [M24 — AI Copilot & Conversational Intelligence](./M24-ai-copilot-conversational.md)
- [M25 — Platform Settings, Compliance & Audit](./M25-platform-settings-compliance-audit.md)

---

## Build Status Legend

Each module page documents what's **shipped**, what's **partial**, and
what's **planned**. As of the latest commit:

- **Fully shipped (backend + UI):** M01, M02, M03, M04, M05, M06, M07, M08, M09, M10, M11, M12, M13, M14, M15, M16, M17, M18, M19, M20, M21, M22, M23, M24, M25
- **M20 note:** Inbound cron + studio inbound panel shipped; rich slash-command bot UX remains incremental per [discord-integration.md](../discord-integration.md)

## Companion Documents

- [`docs/PRD.md`](../PRD.md) — Product requirements
- [`docs/SRSD.md`](../SRSD.md) — Software requirements specification
- [`docs/RUNBOOK.md`](../RUNBOOK.md) — Day-2 operations
- [`docs/discord-integration.md`](../discord-integration.md) — Full Discord vision (informs M20)
- [`docs/functionality-index.md`](../functionality-index.md) — Original functionality backlog
- [`docs/convex-components.md`](../convex-components.md) — Component-level architecture notes
- [`docs/requirements-traceability-matrix.md`](../requirements-traceability-matrix.md) — Shipped / partial / deferred matrix for release gating

## Cross-Cutting Standards

Every module honors:

- Authentication + RBAC at the function layer (`requireUser` / `requireAdmin` / `requireCreatorOwnership`)
- Argument validation via `convex/values`
- Audit logging on sensitive actions
- Idempotency on Stripe + retry-friendly external calls
- Soft-delete or anonymization on user-data writes
- Status-based lifecycle transitions

Every page honors the thin-app contract (`/CLAUDE.md`):

- Compose DS components only — no inline styles, no Tailwind utilities, no raw `className` on DOM elements
- Import `@digipicks/ds` from the package root only
- Import `@digipicks/ds/styles` exactly once in `main.tsx`
- All values in CSS Modules use `var(--token-name)`

Test strategy across the platform:

- Unit tests for validation + domain logic (`convex/*.test.ts` via `convex-test`)
- Integration tests for Convex flows (round-trip via the test harness)
- E2E for golden journeys (`apps/web/e2e`, Playwright — expand from smoke to full 10 journeys)
- A11y on major screens (focus traps, skip links, ARIA on charts shipped)
- Permission tests on role-based access
- Realtime tests for live updates (implicit via `useQuery` reactivity)
