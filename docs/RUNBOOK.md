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
