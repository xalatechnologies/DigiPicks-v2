# DigiPicks — requirements traceability matrix

**Purpose:** Single auditable checklist for the `integration/digipicks-1-0` rollout. Every row must end as **Shipped**, **Partial** (ticket + owner), **Deferred** (approved + risk), or **N/A** (rationale). No silent gaps.

**Last updated:** 2026-05-18 (initial execution pass)

## Legend

| Status   | Meaning                                          |
| -------- | ------------------------------------------------ |
| Shipped  | Spec satisfied in production code paths          |
| Partial  | Core present; gaps ticketed below                |
| Deferred | Explicitly postponed with owner + target         |
| N/A      | Out of MVP / not applicable (rationale in notes) |

---

## M01–M25 (engineering modules)

| ID  | Spec                                                                     | Status  | Notes                                                                                                                                                                |
| --- | ------------------------------------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M01 | [M01 Auth](modules/M01-authentication-identity-roles.md)                 | Partial | Verify **Support** role vs customer/admin/creator; MFA per M25                                                                                                       |
| M02 | [M02 Convex foundation](modules/M02-realtime-platform-foundation.md)     | Shipped | Queries/mutations/actions/crons; patterns in schema                                                                                                                  |
| M03 | [M03 DS & tokens](modules/M03-design-system-component-library.md)        | Shipped | `packages/ds`, `packages/tokens`; app guardrails in CI                                                                                                               |
| M04 | [M04 Event engine](modules/M04-provider-agnostic-event-engine.md)        | Shipped | `convex/events.ts`, public Events, creator events                                                                                                                    |
| M05 | [M05 Picks & publishing](modules/M05-picks-publishing-engine.md)         | Shipped | Dashboard picks/create flow                                                                                                                                          |
| M06 | [M06 Entitlements](modules/M06-access-control-entitlements.md)           | Shipped | `shared/permissions`, premium gating                                                                                                                                 |
| M07 | [M07 Billing](modules/M07-subscription-billing-monetization.md)          | Shipped | Stripe, subscriptions, products                                                                                                                                      |
| M08 | [M08 Verification](modules/M08-creator-verification-trust.md)            | Shipped | Applications, admin review                                                                                                                                           |
| M09 | [M09 Grading](modules/M09-pick-grading-performance.md)                   | Shipped | Auto-grader, performance surfaces                                                                                                                                    |
| M10 | [M10 Feed & discovery](modules/M10-customer-feed-discovery.md)           | Shipped | Landing, Creators, Feed                                                                                                                                              |
| M11 | [M11 Odds](modules/M11-realtime-odds-intelligence.md)                    | Shipped | Odds intel page, line movement                                                                                                                                       |
| M12 | [M12 AI engine](modules/M12-ai-intelligence-engine.md)                   | Shipped | `convex/ai.ts`, pick analysis                                                                                                                                        |
| M13 | [M13 Notifications](modules/M13-notifications-smart-alerts.md)           | Partial | In-app + push prefs; “alert builder” depth per backlog optional                                                                                                      |
| M14 | [M14 Community](modules/M14-community-realtime-interaction.md)           | Shipped | Channels, community routes                                                                                                                                           |
| M15 | [M15 Livestream](modules/M15-livestream-integrations.md)                 | Shipped | `convex/streams.ts`, Twitch/YouTube/Kick poll                                                                                                                        |
| M16 | [M16 Creator analytics](modules/M16-creator-analytics-dashboard.md)      | Shipped | Overview, performance, earnings                                                                                                                                      |
| M17 | [M17 Admin](modules/M17-admin-operations-moderation.md)                  | Shipped | Admin portal, disputes, coupons, event review                                                                                                                        |
| M18 | [M18 Saved & watchlists](modules/M18-saved-library-watchlists.md)        | Shipped | Saved, watchlists account routes                                                                                                                                     |
| M19 | [M19 Referrals & growth](modules/M19-referral-promotion-growth.md)       | Shipped | Growth dashboard, referrals                                                                                                                                          |
| M20 | [M20 Discord](modules/M20-discord-integration.md)                        | Partial | Outbound webhook + OAuth; **inbound** code in `convex/discord/inbound.ts` — verify UI/cron wiring vs [discord-integration.md](../discord-integration.md) full vision |
| M21 | [M21 Telegram](modules/M21-telegram-integration.md)                      | Shipped | `convex/telegram.ts`, user prefs                                                                                                                                     |
| M22 | [M22 Data providers](modules/M22-external-sports-data-providers.md)      | Shipped | Odds API, cricket writer, live scores                                                                                                                                |
| M23 | [M23 Federation & review](modules/M23-custom-event-review-federation.md) | Shipped | Custom events, admin review                                                                                                                                          |
| M24 | [M24 AI Copilot](modules/M24-ai-copilot-conversational.md)               | Shipped | `convex/aiCopilot/*`, account + dashboard Copilot pages                                                                                                              |
| M25 | [M25 Compliance](modules/M25-platform-settings-compliance-audit.md)      | Shipped | GDPR, audit, MFA, rate limits; E2E still deferred below                                                                                                              |

---

## SRSD functional modules (FM) & federated events (FR-EVT)

| ID                         | Status  | Notes                                                                                             |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| FM-001 Public discovery    | Shipped | Landing, creators, events, odds                                                                   |
| FM-002 Creator system      | Shipped | Apply, verification, tiers, analytics                                                             |
| FM-003 Realtime publishing | Shipped | Picks, drafts, publish                                                                            |
| FM-004 Sports intelligence | Shipped | Odds, lines, events                                                                               |
| FM-005 AI intelligence     | Shipped | M12 + M24                                                                                         |
| FM-006 Community           | Shipped | Channels, DMs                                                                                     |
| FM-007 Livestream          | Shipped | Embeds + poll + notify                                                                            |
| FM-008 Grading & analytics | Shipped | Grades, performance                                                                               |
| FM-009 Monetization        | Shipped | Stripe, referrals                                                                                 |
| FM-010 Notifications       | Partial | See M13                                                                                           |
| FM-011 Administration      | Shipped | Admin routes                                                                                      |
| FR-EVT-001–005             | Shipped | Normalized events, creator custom, admin review — verify Sportradar/custom webhooks if in backlog |

---

## functionality-index.md §1–§20

Mapped to modules above; all sections have at least **Partial** coverage via M01–M25. Deep items (visual regression, full alert-rule builder) → **Deferred** unless ticketed.

---

## Cross-cutting standards ([functionality-index.md](functionality-index.md))

| Topic                             | Status   | Notes                                                                                                                                                     |
| --------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Convex authz + validation + audit | Partial  | Ongoing review per sensitive mutation                                                                                                                     |
| Idempotency (Stripe/webhooks)     | Shipped  | See `stripeIdempotency`, http routes                                                                                                                      |
| Thin apps / DS-only               | Shipped  | CI greps in workflow                                                                                                                                      |
| Unit tests (Convex)               | Partial  | Expand on billing/M20/GDPR                                                                                                                                |
| Component tests                   | Deferred | No Storybook test runner in repo yet                                                                                                                      |
| Integration tests                 | Partial  | Several `*.test.ts`                                                                                                                                       |
| E2E (10 golden journeys)          | Partial  | `apps/web/e2e/smoke.spec.ts` + `playwright.config.ts`; run `pnpm --filter @digipicks/web e2e` (Vite-only webServer). Full 10 journeys still to implement. |
| A11y major screens                | Partial  | Spot-check + tickets                                                                                                                                      |
| Visual regression                 | Deferred | Tooling TBD                                                                                                                                               |
| Permission tests                  | Partial  | Convex + AuthGate patterns                                                                                                                                |

---

## Ten golden E2E journeys

| #    | Journey                                                               | Status  |
| ---- | --------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------- |
| 1–10 | Golden journeys from [functionality-index.md](functionality-index.md) | Partial | Implement in `apps/web/e2e/` after auth/test-data strategy; smoke spec is starter |

---

## Public trust & legal surfaces (Phase B)

| Route                                  | Status  | Notes                                                  |
| -------------------------------------- | ------- | ------------------------------------------------------ |
| /pricing                               | Shipped | Static info page                                       |
| /trust/verification                    | Shipped |                                                        |
| /trust/results-methodology             | Shipped |                                                        |
| /trust/disputes                        | Shipped | General info; `/admin/disputes` remains operator queue |
| /responsible-betting                   | Shipped |                                                        |
| /about, /press, /brand, /contact       | Shipped | Informational                                          |
| /legal/terms, /privacy, /refunds, /age | Shipped | Template copy — legal review Deferred                  |

---

## Companion docs

| Doc                                          | Action                                    |
| -------------------------------------------- | ----------------------------------------- |
| [PRD.md](PRD.md)                             | Product reference                         |
| [SRSD.md](SRSD.md)                           | Spec reference                            |
| [RUNBOOK.md](RUNBOOK.md)                     | Env/deploy checklist — verify before prod |
| [convex-components.md](convex-components.md) | Architecture                              |
| [bpmn/](bpmn/)                               | Optional BPMN vs code review              |

---

## How to use this file

1. On each integration PR, update **Status** and **Notes** for touched rows.
2. File GitHub issues for every **Partial** / **Deferred** with IDs in Notes.
3. Release when all rows are **Shipped**, **N/A**, or **Deferred** with sign-off.
