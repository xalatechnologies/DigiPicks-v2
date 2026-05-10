# DigiPicks

Realtime sports intelligence + creator economy platform. Verified
creators publish picks, customers subscribe for premium access, AI
summarizes the analysis, and Discord/Telegram/email/push fan out alerts
in realtime.

> **"The Bloomberg Terminal + TradingView for Sports Intelligence."**
> — `docs/PRD.md`

DigiPicks is **not** a sportsbook. It positions as sports analytics
with transparent grading, creator monetization, and AI-augmented
discovery.

---

## Stack at a glance

| Layer             | Tech                                                                               |
| ----------------- | ---------------------------------------------------------------------------------- |
| Frontend          | React · Vite · TypeScript · React Router · Convex React · Framer Motion            |
| Component library | `@digipicks/ds` (custom; 130+ components, design-token driven)                     |
| Backend           | [Convex](https://convex.dev) — realtime DB + queries + mutations + actions + crons |
| Auth              | Convex Auth (Password + Discord OAuth, MFA via TOTP)                               |
| Payments          | Stripe (Checkout + webhooks, idempotent via `stripeEvents`)                        |
| AI                | Anthropic Claude — Haiku 4.5 (single-shot) + Sonnet 4.6 (Copilot tool-use loop)    |
| Email             | Resend (transactional + verification)                                              |
| Notifications     | Web Push (VAPID) · Telegram Bot · Discord (per-creator) · Email · In-app inbox     |
| External data     | The Odds API · ESPNcricinfo · Twitch / YouTube / Kick (livestream status)          |
| Tests             | Vitest + `convex-test`                                                             |

---

## Repository layout

```
DigiPicks/
├── apps/
│   └── web/                    # Vite + React app — single SPA, routes for public, /account, /dashboard
├── packages/
│   ├── ds/                     # Component library (atoms, forms, surfaces, data, nav,
│   │                           #   layout, feedback, motion, domain — all design-token driven)
│   ├── tokens/                 # Design tokens (CSS variables: colors, spacing, motion, …)
│   ├── shared/                 # Cross-package types + helpers
│   ├── app-shell/              # Theme provider, route shells, error boundaries
│   ├── sdk/                    # Convex hooks wrappers (auth, current user, helpers)
│   ├── eslint-config/          # Shared ESLint preset
│   └── tsconfig/               # Shared TS config preset
├── convex/                     # Backend — 60+ modules (auth, picks, events, ai, discord, …)
│   ├── schema.ts               # Single source of truth for the data model
│   ├── crons.ts                # Cron registrations
│   ├── http.ts                 # HTTP endpoints (Stripe webhook, Discord OAuth, …)
│   ├── shared/                 # Permission helpers, retry, sentry, rate limiter, …
│   ├── aiCopilot/              # M24 multi-turn copilot (queries · mutations · respond · tools)
│   └── discord/                # M20 inbound + outbound (delivery · sentiment · oauth · gdpr)
└── docs/
    ├── PRD.md                  # Product requirements
    ├── SRSD.md                 # Software requirements specification
    ├── RUNBOOK.md              # Day-2 operations
    ├── modules/M01–M25         # Engineering specs per module
    ├── bpmn/BPMN-001–016       # Workflow diagrams (Mermaid; one per core flow)
    └── functionality-index.md  # Original feature backlog
```

---

## Quickstart

### Prerequisites

- Node ≥ 20
- `pnpm` ≥ 9
- A Convex account (or `npx convex dev` to provision a personal dev deployment)

### Install + run

```bash
pnpm install
pnpm dev              # spawns convex dev + web dev concurrently
```

Web dev server lands at `http://localhost:5173`. Convex dashboard URL
is printed by `convex dev`.

### Useful scripts

```bash
pnpm dev              # convex dev + web dev (concurrently)
pnpm dev:web          # web dev only
pnpm dev:convex       # convex dev only
pnpm typecheck        # repo-wide tsc --noEmit (8 packages)
pnpm test             # vitest run (Convex backend tests)
pnpm lint             # eslint where configured
pnpm build            # production build (web + DS package)
```

---

## Environment variables

Set Convex env vars with `npx convex env set <KEY> <value>`. Vite vars
go in `.env.local` at the repo root.

### Required for full feature parity

| Var                                                                                   | Purpose                                           | Module   |
| ------------------------------------------------------------------------------------- | ------------------------------------------------- | -------- |
| `STRIPE_SECRET_KEY`                                                                   | Stripe API access (Checkout, webhook verify)      | M07      |
| `STRIPE_WEBHOOK_SECRET`                                                               | HMAC verify on `/stripe-webhook`                  | M07      |
| `ANTHROPIC_API_KEY`                                                                   | Claude API for AI summaries + Copilot             | M12, M24 |
| `THE_ODDS_API_KEY`                                                                    | Live odds + upcoming events polling               | M11, M22 |
| `RESEND_API_KEY`                                                                      | Email delivery (welcome, verification, lifecycle) | M13, M01 |
| `RESEND_FROM_EMAIL`                                                                   | Default `From:` header (`"DigiPicks <hello@…>"`)  | M13      |
| `WEB_PUSH_VAPID_PUBLIC_KEY` / `WEB_PUSH_VAPID_PRIVATE_KEY` / `WEB_PUSH_VAPID_SUBJECT` | Web push (VAPID)                                  | M13      |
| `TELEGRAM_BOT_TOKEN`                                                                  | Telegram notifications                            | M21      |
| `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET`                                             | Discord OAuth signin                              | M01      |
| `DISCORD_BOT_TOKEN`                                                                   | M20 inbound Discord ingest                        | M20      |
| `DISCORD_OAUTH_ENC_KEY`                                                               | AES-256-GCM key for Discord OAuth tokens          | M20      |
| `DISCORD_PUBLIC_KEY`                                                                  | Ed25519 verify on `/discord/interactions`         | M20      |
| `DISCORD_AUTHOR_SALT`                                                                 | sha-256 author hashing for inbound msgs (privacy) | M20      |
| `WEB_BASE_URL`                                                                        | Used for deep links in emails / notifications     | M13      |
| `SENTRY_DSN_NODE`                                                                     | Server-side Sentry (Node actions only)            | M02      |

### Operational tunables (all optional)

| Var                            | Default        | Effect                                                      |
| ------------------------------ | -------------- | ----------------------------------------------------------- |
| `GRACE_PERIOD_DAYS`            | 3              | Past-due subscription grace window before access revokes    |
| `PLATFORM_FEE_RATE_BPS`        | 1300 (13%)     | Platform + processing fee shown on Earnings page            |
| `NOTIFY_DEDUP_WINDOW_MS`       | 300000 (5 min) | Inbox dedup window per `entityKey`                          |
| `LINE_MOVE_THRESHOLD_PCT`      | 5              | Implied-probability threshold for line-movement alerts      |
| `ODDS_SNAPSHOTS_ENABLED`       | false          | Daily bookmaker odds capture (quota-heavy, opt-in)          |
| `SPORT_SOURCE_CRICKET_ENABLED` | false          | ESPNcricinfo scraper enable flag                            |
| `SEED_TOKEN`                   | —              | Bearer token for `/seed-events` admin trigger               |
| `RESEND_VERIFY_FROM`           | —              | Override `From:` for verification emails (e.g. `noreply@…`) |

Anything missing from this list is a **quiet no-op** — the relevant
feature degrades gracefully (e.g., AI returns `{ skipped: true }`,
notifications drop the channel) so dev environments don't blow up.

---

## Architectural contract

Every contributor reads [`CLAUDE.md`](./CLAUDE.md) — it's a hard
contract for how UI is built. Highlights:

- **No inline styles** in `apps/**`. No raw `className=` strings on DOM
  nodes. No Tailwind utility classes. No `.css` files.
- All UI composes `@digipicks/ds` components only.
- All values in CSS modules use `var(--token-name)`.
- Every page is thin — composition, no business logic.

The four strict-mode greps in `CLAUDE.md §7` must return zero hits in
`apps/**` for any commit to be considered clean.

CI mirrors these checks. The repo is currently clean (`pnpm typecheck`
across 8 packages, 86/86 tests passing, 0 strict-mode violations).

---

## Module index

Engineering specs live in [`docs/modules/`](./docs/modules/). 25
modules cover the full surface — auth, picks, events, billing,
moderation, AI, integrations, compliance.

Workflow diagrams live in [`docs/bpmn/`](./docs/bpmn/). 16 Mermaid
flowcharts describe every realtime fanout chain (publish → grade →
notify → discord → audit), keyed back to module IDs.

Both sets of docs are maintained as **executable architecture
documentation** — when code changes, the docs change in the same
commit. Drift is regularly audited (see commit history for `phase-19`
and `phase-19b`).

---

## Testing

```bash
pnpm test
```

86 tests across 9 files cover: auth + MFA, channels access gating,
disputes lifecycle, federated event ingest, feed personalization,
saved-picks idempotency, Stripe subscription mapping, AI parse safety,
copilot PII scrubbing.

E2E coverage (Playwright) is deferred — see
[`docs/modules/M25-platform-settings-compliance-audit.md`](./docs/modules/M25-platform-settings-compliance-audit.md).

---

## Operations

See [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) for incident response,
backfill procedures, and recovery playbooks.

For Convex dashboard tasks: cron audit, manual `events.seedFromOddsApi`
trigger, idempotent migration mutations (`migrations.*`), and the
`/admin` web surface for moderation queues + audit feed.

---

## License

Proprietary — © Xala Technologies. Not for redistribution.
