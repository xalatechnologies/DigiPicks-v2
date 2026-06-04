# DigiPicks — Runtime Setup Runbook

**Audience:** the operator standing up DigiPicks for the first time, or
turning on a phase that has shipped behind a feature flag.

The codebase ships every Phase 1–7 surface ready to run. The work in this
runbook is the **out-of-band configuration** the code can't do for itself
— external service accounts, API keys, webhook routing, and one-time data
migrations.

Companion docs: [PRD](./PRD.md) · [SRSD](./SRSD.md). Project doctrine in
[../CLAUDE.md](../CLAUDE.md).

---

## 0. Convex deployment

Everything assumes a working Convex deployment. From the repo root:

```bash
# Start the dev deployment (interactive — picks/creates a project).
npx convex dev

# Deploy from CI / one-off.
npx convex deploy
```

`convex dev` regenerates `convex/_generated/api.{d.ts,js}`. If your
typecheck breaks after pulling new backend code, run `convex dev` once.

### Local setup (first time or “Could not find public function”)

You need **two terminals** and a `.env.local` that matches the deployment
`npx convex dev` syncs to.

**Terminal 1 — Convex (keep running)**

```bash
cd /path/to/DigiPicks-v2
npx convex login          # once per machine
npx convex dev --configure existing --team <your-team-slug>
```

Pick an existing project or create one. Convex writes/updates `.env.local`:

- `CONVEX_DEPLOYMENT=dev:…`
- `CONVEX_URL=https://….convex.cloud`
- `VITE_CONVEX_URL` (same URL — required for the Vite app)

If you see **“You don't have access to the selected project”**, the repo is
still linked to someone else's deployment (e.g. `info-cb24c`). Either:

- **A)** Re-run `npx convex dev --configure existing --team <your-team-slug>` and
  choose **your** project (recommended for solo dev), or
- **B)** Ask the team owner to invite your Convex account to their team, then
  `npx convex dev` without reconfiguring.

**Terminal 2 — Web**

```bash
cd /path/to/DigiPicks-v2
pnpm dev:web
# or: pnpm dev   (runs Convex + web together)
```

Open http://localhost:5173/admin — functions like `admin:overview` only exist
after Terminal 1 has pushed code at least once.

**Schema validation failed on `users` (legacy fields)**

If `npx convex dev` reports extra fields like `displayName` or `passwordHash`
on `users`, the deployment has rows from an older schema. After the first
successful push:

```bash
# Preview — lists sample users, subscription counts, broken creatorId links
npx convex run migrations:stripLegacyUserFields '{"dryRun": true}'
npx convex run migrations:stripLegacyUserFields
```

**Subscriber vs creator data:** personas live on `users` (`role`, optional
`creatorId`); billing links are in `subscriptions` (`subscriberId` →
`creatorId`). This migration only strips obsolete columns on `users` (e.g.
`passwordHash`, legacy `status`). It does **not** touch `creators` or
`subscriptions`, does not change `role` or `creatorId`, and does not map
legacy `users.status` to `isActive` (that string is unrelated to
`creators.status` or `subscriptions.status`). User `_id` values are unchanged
so subscriber/creator foreign keys stay valid.

Then restart `npx convex dev`.

**“Multiple CONVEX_URL environment variables”**

Ensure only one `CONVEX_URL` is set — check `.env.local` and shell exports
(`env | grep CONVEX`). Remove duplicates; keep `VITE_CONVEX_URL` aligned with
`CONVEX_URL`.

**Optional — dev admin password on the deployment**

```bash
npx convex env set DEV_ADMIN_EMAIL admin@digipicks.com
npx convex env set DEV_ADMIN_PASSWORD 'AdminDev123!'
```

Match those in `apps/web/.env.local` only if you override defaults (local
`pnpm dev` already uses `admin@digipicks.com` / `AdminDev123!`).

**Convex Auth — `JWT_PRIVATE_KEY` missing**

Password/OAuth sign-in needs JWT keys on the **Convex deployment** (not in `.env.local`).
Local `.env.local` / `apps/web/.env.local` only point the app at your deployment
(`CONVEX_URL`, `VITE_CONVEX_URL`).

**Stable local dev (Convex + Vite)**

```bash
pnpm dev                      # convex dev + Vite at http://localhost:5173
pnpm setup:convex-auth        # once per deployment (SITE_URL + keys if missing)
pnpm verify:convex-auth       # read-only sanity check
```

`setup:convex-auth` is **idempotent** by default: it updates `SITE_URL` but keeps
existing `JWT_PRIVATE_KEY` / `JWKS`. Use `--rotate` only when you intend to
invalidate all browser sessions:

```bash
pnpm setup:convex-auth -- --rotate
# then: restart pnpm dev, clear __convexAuth* in localStorage for :5173, sign in again
```

Align `SITE_URL` with the Vite port if needed:

```bash
pnpm setup:convex-auth -- --site-url http://localhost:5173
```

**Verify**

```bash
pnpm verify:convex-auth
npx convex login status
npx convex env list | grep -E 'JWT_PRIVATE_KEY|JWKS|SITE_URL'
```

If verify reports **JWKS is not valid JSON** (causes `AuthProviderDiscoveryFailed` /
“token saved but Convex rejected it”), rotate keys once:

```bash
pnpm setup:convex-auth -- --rotate
```

Admin sign-in: `http://localhost:5173/auth?next=%2Fadmin` with
`admin@digipicks.com` / `AdminDev123!` (see dev defaults in `apps/web`).

Or: `npx @convex-dev/auth` (initial bootstrap alternative — prefer `pnpm setup:convex-auth`).

---

## 1. Environment variables

Set every key via `npx convex env set <KEY> <VALUE>` (or the Convex
dashboard → Settings → Environment Variables). The code **gracefully
degrades** when a key is missing — the relevant phase just no-ops.

| Key                      | Required for                                                   | Format                                                     |
| ------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------- |
| `THE_ODDS_API_KEY`       | Phase 6 odds + base events polling                             | The Odds API key                                           |
| `ODDS_SNAPSHOTS_ENABLED` | Phase 6 line-movement snapshots                                | literal string `true` to enable                            |
| `STRIPE_SECRET_KEY`      | Phase 3 Checkout                                               | `sk_test_...` (test) or `sk_live_...`                      |
| `STRIPE_WEBHOOK_SECRET`  | Phase 3 webhook signature verification                         | `whsec_...`                                                |
| `WEB_BASE_URL`           | Phase 3 success / cancel redirects                             | e.g. `https://app.digipicks.com` (no trailing slash)       |
| `ANTHROPIC_API_KEY`      | Phase 5 AI pick analysis + M20 inbound summaries + M24 Copilot | `sk-ant-...`                                               |
| `SEED_TOKEN`             | `/seed-events` HTTP route                                      | any random string; pass as `Authorization: Bearer <token>` |
| `DISCORD_BOT_TOKEN`      | M20 outbound + inbound Bot API                                 | Discord developer portal → Bot token                       |
| `DISCORD_CLIENT_ID`      | M20 OAuth install                                              | Application ID                                             |
| `DISCORD_CLIENT_SECRET`  | M20 OAuth token exchange                                       | Client secret                                              |
| `DISCORD_PUBLIC_KEY`     | `/discord/interactions` Ed25519 verify                         | Application → General → Public Key                         |
| `DISCORD_AUTHOR_SALT`    | M20 inbound author hashing (privacy)                           | Random string; never rotate without GDPR review            |
| `DISCORD_TOKEN_ENC_KEY`  | OAuth token encryption at rest                                 | 32-byte hex or per `convex/discord/oauth.ts`               |
| `CONVEX_SITE_URL`        | Discord OAuth callback base                                    | `https://<deployment>.convex.site`                         |
| `TELEGRAM_BOT_TOKEN`     | M21 Telegram delivery                                          | BotFather token                                            |

Quickstart for a clean dev environment:

```bash
npx convex env set THE_ODDS_API_KEY xxxxx
npx convex env set STRIPE_SECRET_KEY sk_test_xxxxx
npx convex env set STRIPE_WEBHOOK_SECRET whsec_xxxxx
npx convex env set WEB_BASE_URL http://localhost:5173
npx convex env set ANTHROPIC_API_KEY sk-ant-xxxxx
# Optional, opt-in only:
# npx convex env set ODDS_SNAPSHOTS_ENABLED true
```

### Dev platform admin (no signup)

For local QA, open **`http://localhost:5173/admin`** while `pnpm dev` is running. The app
signs in (or registers once via Convex Auth) as the dev admin — no manual signup form.

**Defaults** (non-production Convex only): `admin@digipicks.com` / `AdminDev123!`

**Admin login still failing**

1. Split env files (avoids Convex “multiple CONVEX_URL” warnings):
   - Root `.env.local`: `CONVEX_DEPLOYMENT`, `CONVEX_URL`, `CONVEX_SITE_URL` only
   - `apps/web/.env.local`: `VITE_CONVEX_URL` (+ optional `VITE_DEV_*`)
2. Keep `npx convex dev` running, then restart `pnpm dev:web`.
3. Reset credentials + admin profile on the deployment:

```bash
npx convex run devProvisionActions:bootstrapDevAdmin
```

4. Open `/admin` (auto sign-in) or `/auth?next=/admin` with the defaults above.
5. If you previously clicked **Sign out** on admin, that blocks auto sign-in until you use **Try again** or clear `sessionStorage` key `digipicks_dev_admin_signed_out`.
6. Legacy DB with one email-less `users` row is upgraded in place by bootstrap (no duplicate subscriber/creator rows).

Keep **`npx convex dev`** running so backend functions stay in sync with the repo. Optional
one-shot password reset: `npx convex run devProvision:setupAdminForDev` (see `convex/devProvision.ts`).

Optional overrides:

- **Convex:** `npx convex env set DEV_ADMIN_EMAIL …` and `DEV_ADMIN_PASSWORD …`
- **Vite:** `VITE_DEV_ADMIN_EMAIL` / `VITE_DEV_ADMIN_PASSWORD` in `.env.local` (must match Convex)
- **Hosted preview:** also set `VITE_DEV_UNLOCK_DASHBOARD=true` (local `pnpm dev` does not need this)

`bootstrapDevAdmin` is disabled on production Convex deployments.

### Creator studio QA path

1. **New creator:** `/apply` → submit application → admin **`/admin/applications`** approve → creator lands on **`/dashboard`**.
2. **Dev shortcut:** approve an application in admin, or use an account with `users.creatorId` set, then open **`/dashboard`**.
3. **Smoke walk:** see [STUDIO_E2E_SMOKE.md](./STUDIO_E2E_SMOKE.md) for the full checklist (sidebar, CRUD loops, redirects, build gates).

### Subscriber account QA path

1. **New subscriber:** sign in → **`/account`** dashboard.
2. **Subscribe loop:** **`/account/discover`** → creator profile → Stripe checkout → **`/creators/:handle/subscribed`** → **Go to feed**.
3. **Smoke walk:** see [ACCOUNT_E2E_SMOKE.md](./ACCOUNT_E2E_SMOKE.md) for sidebar, entitlements, billing, and build gates.

---

## 2. Phase 1 — Federated Event Engine backfill

The schema widen ships in code; existing provider rows still need their
federated fields populated. Idempotent and safe to re-run.

1. Push the schema with `npx convex dev`.
2. From the Convex dashboard → Functions → `migrations:backfillFederatedEvents` → Run.
3. Verify by running this one-shot read in the dashboard's Data tab:

   ```ts
   // Console: should print 0 once the backfill completes.
   const all = await ctx.db.query('events').take(10000);
   all.filter((e) => e.sourceType === undefined).length;
   ```

4. The 60-second `liveScores.upsertEvent` cron self-heals any rows the
   backfill missed; verify by raw-inserting an event without
   `sourceType` from the dashboard and watching the next poll repair it.

---

## 3. Phase 3 — Stripe (subscriptions + payouts)

### One-time Stripe dashboard setup

1. Create a Stripe account in **test mode**.
2. **Webhook endpoint:** Stripe dashboard → Developers → Webhooks → Add endpoint:
   - URL: `https://<your-deployment>.convex.site/stripe-webhook`
   - Events: `customer.subscription.created`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.paid`
   - Copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
3. **Products + prices:** for each pricing tier you want creators to
   sell, create a _Product_ with two recurring prices (Premium + VIP).
   Copy the price IDs (`price_...`).

### Per-creator price configuration

Each creator advertises their own Premium and VIP prices. Today this
runs through the Convex dashboard:

1. Open the Convex dashboard → Tables → `creators` → pick a creator.
2. Set `stripePriceIdPremium` to the Premium `price_...`.
3. Set `stripePriceIdVip` to the VIP `price_...`.
4. Adjust `startingPrice` (a number, not a string) so the displayed
   `$X/mo` matches the actual Stripe price.

Until both fields are set, the _Premium / VIP_ tiers in the
`PricingModal` show as **Not configured** and the buttons are disabled.

### Smoke test

1. Sign in as a subscriber → `/creators/<handle>` → click **Subscribe**.
2. Pick Premium → **Continue with Stripe** → land on Stripe Checkout
   (test card `4242 4242 4242 4242` / any future date / any CVC).
3. After completion, Stripe redirects to
   `${WEB_BASE_URL}/creators/<id>?subscribed=1`.
4. Convex `audit` table records the webhook event; `subscriptions` row
   gets `status: 'active'` and a `stripeSubscriptionId`. The "Subscribe"
   button on the creator page now shows **Manage subscription**.
5. Earnings dashboard (`/dashboard/earnings`, signed in as the creator)
   shows MRR derived from active subs. Once `invoice.paid` fires, a
   matching row appears in **Payouts**.

### Cancelling

`/dashboard/subscriptions` (or the equivalent UI you wire up later) calls
`subscriptions.cancel`. The webhook on `customer.subscription.deleted`
syncs the cancelled state back to Convex.

---

## 4. Phase 5 — Anthropic AI pick analysis

Auto-runs on every `picks.create` with `status: 'published'`.

1. Set `ANTHROPIC_API_KEY` (see §1).
2. As a creator, publish a pick from `/dashboard/create`. The pick row
   inserts immediately; AI analysis is best-effort and runs async via
   `ctx.scheduler.runAfter(0, internal.ai.analyzePick, {...})`.
3. Watch the Convex Logs tab — within a few seconds you'll see the
   action complete and the pick row gains `aiSummary`, `aiConfidence`,
   `aiReasoning`, `aiModel`, `aiAnalyzedAt`.
4. The AI surface renders inside `PickCard` on `/feed`,
   `/saved`, and `/creators/<handle>` once the fields are populated.

Default model is `claude-haiku-4-5-20251001`. To switch (e.g., to
`claude-sonnet-4-6` for deeper analysis), call `ai.analyzePick` directly
with `{ pickId, model }`. The auto-trigger always uses the default.

---

## 5. Phase 6 — Odds snapshots (opt-in)

Snapshot collection is **off by default** to keep the Odds API quota
predictable.

### Enable

1. Confirm `THE_ODDS_API_KEY` is set.
2. `npx convex env set ODDS_SNAPSHOTS_ENABLED true`.
3. The `poll-odds-snapshots` cron is wired in `convex/crons.ts` at a
   24-hour interval. It reads the env flag at runtime and no-ops when
   disabled — so simply setting `true` is enough; no redeploy required.

### Quota math

`/v4/sports/{sport}/odds` costs 1 credit per market per region. With
the default `regions=us,uk,eu` and `markets=h2h,spreads,totals` that's
~9 credits per sport per call. With ~20 sport keys × 1 call/day =
**~180 credits/day**. The Odds API free tier is 500/month — you'll
exhaust it in 3 days. Plan for a paid tier or cut the sport list in
`convex/oddsApi.ts:SPORT_KEY_MAP` before turning this on for real.

### Manual run (preferred for first verification)

From the Convex dashboard → Functions → `oddsApi:pollOddsSnapshots` →
Run. Then load `/odds`, pick an event, and confirm the OddsGrid populates
with bookmaker rows.

---

## 6. Integrations (M20 Discord, M21 Telegram, web push)

### Discord (M20) — shipped

**Creator UI:** `/dashboard/settings/discord` — OAuth guild connect, channel mapping (inbound / outbound / two-way), alert rules, delivery log, discussions sentiment.

**HTTP routes** (Convex site URL):

| Route                                  | Purpose                            |
| -------------------------------------- | ---------------------------------- |
| `GET /discord/oauth/start?creatorId=…` | Start bot + OAuth install          |
| `GET/POST /discord/oauth/callback`     | Complete connect → redirect studio |
| `POST /discord/interactions`           | Discord app interactions (signed)  |

**Crons** (`convex/crons.ts`): `discord-import-messages` (5 min), `discord-recompute-sentiment` (hourly), `discord-retry-failed-deliveries`, `discord-purge-webhook-events`.

**Env:** see §1 (`DISCORD_*`, `ANTHROPIC_API_KEY` for summaries). Without `DISCORD_BOT_TOKEN`, inbound import no-ops; outbound uses per-creator webhooks where configured.

**Smoke test:**

1. Creator → Settings → Discord → Connect guild.
2. Map a channel to **Inbound** or **Two-way**.
3. Post a message in Discord; within ~5 minutes check **Inbound sync** panel on the same page (last import timestamp).
4. Publish a pick → verify **Delivery log** row (or legacy webhook on `creators.discordWebhookUrl`).

### Telegram (M21)

Set `TELEGRAM_BOT_TOKEN`. User links via account notification prefs; `convex/telegram.ts` delivers on publish when enabled.

### Web push notifications

Partial: in-app notifications ship; browser push requires service-worker + `pushSubscriptions` wiring (see M13 backlog in traceability matrix).

### Stripe Connect (creator payouts)

Connect onboarding ships at `/dashboard/earnings/onboarding` when `STRIPE_SECRET_KEY` and Connect are configured. See §3 for Checkout; Connect status via `api.connect.*`.

---

## 7. Day-2 operations

| Task                                    | Where                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------ |
| Approve a creator-submitted event       | `/admin/events/review`                                                   |
| Review creator applications             | Convex dashboard → `applications` table → `applications.review` mutation |
| Inspect Stripe webhook activity         | `audit` table, filter `entityType = 'stripe_webhook'`                    |
| Re-run AI analysis on a pick            | Convex dashboard → `ai:analyzePick` → `{ pickId }`                       |
| Force-backfill federated events         | Convex dashboard → `migrations:backfillFederatedEvents`                  |
| Trigger an immediate odds-snapshot poll | Convex dashboard → `oddsApi:pollOddsSnapshots`                           |
| Force a logo backfill for a team        | Convex dashboard → `teamLogos:resolveOne`                                |

---

## 8. Verification checklist

Pre-flight a fresh deployment:

```bash
# Static checks
pnpm -r --if-present typecheck
pnpm -r --if-present lint
pnpm --filter @digipicks/web build

# Doctrine greps (CLAUDE.md §7) — all must return zero
grep -rE "style=\{\{" apps --include="*.tsx"
grep -rnE 'className=' apps --include="*.tsx" | grep -vE '\.module\.css|\bcx\(|s\.|className: '
grep -rE 'className="[^"]*\b(flex|grid|gap-|p-|m-|text-|bg-|border|rounded|w-|h-|max-w|min-w|space-|items-|justify-)' apps --include="*.tsx"
find apps -name "*.css" -not -path "*/dist/*"
```

If anything in §1–§5 isn't working, check the Convex Logs tab first —
the relevant action / mutation logs the env-var miss with a clear
message rather than throwing.
