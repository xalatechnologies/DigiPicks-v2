# M25 — Platform Settings, Compliance & Audit

## Purpose
The compliance + governance backbone. GDPR Article 15 (export) and
Article 17 (erasure), append-only audit trail, retention policies, MFA
freshness gates, rate limiter, system-config env vars. Every other module
borrows from this one's primitives.

## Target Roles
Admin · Support · System (every user benefits via the compliance surfaces)

## Core Features
- GDPR export — every record DigiPicks holds about a user, returned as a JSON blob
- GDPR delete — anonymizes user record + cascades across subs / saved / notifications / messages / applications
- Append-only audit log with CI grep guard
- Rate limiter component with sharded buckets
- TOTP MFA with 15-minute freshness gate
- Sentry server-side + client-side
- Stripe webhook signature verification
- Per-cron audit metadata
- Platform settings via Convex env vars (no settings table at MVP)

## User Stories
- As a customer, I want to download every record DigiPicks holds about me.
- As a customer, I want to permanently delete my account and have my personal data scrubbed.
- As an admin, I want every sensitive action recorded in an immutable audit log.
- As an SRE, I want runtime errors captured to Sentry with full action context.
- As legal, I want demonstrable compliance with GDPR Articles 15 + 17.

## Backend / Convex Build
**Tables**
- `auditLogs` (entityType, entityId, action, actorUserId, metadata, createdAt) — append-only
- `users` — locale, mfaSecret, mfaLastVerifiedAt, mfaRecoveryCodes, notifyPrefs, telegramChatId, etc.

**Queries**
- `audit.listByEntity` (admin)

**Mutations**
- `audit.log` (internal — only writer of `auditLogs`)
- `gdpr.deleteMyAccount` (with `confirm: 'DELETE'` literal arg)
- `gdpr._anonymizeUserCascade` (internal)

**Actions**
- `gdpr.exportMyData` — collects + returns JSON blob; rate-limited (3/h sharded)
- `gdpr._collectUserExport` (internal query)

**Cascade — `gdpr._anonymizeUserCascade`**
1. `users` row → name='Deleted user', email/phone/image/stripeCustomerId/discord* cleared, isActive=false
2. `subscriptions` → status='cancelled', stripe IDs cleared
3. `savedPicks` (by user) → deleted
4. `notifications` (by user) → deleted
5. `messages` (by sender) → body='[deleted]', row retained for thread continuity
6. `applications` (by email) → email scrubbed, name+handle replaced

**CI guards** — `.github/workflows/ci.yml`
- "Audit-log append-only guard" — greps `convex/` for any `.patch / .replace / .delete` against `auditLogs`
- "Thin-app guardrails" — greps `apps/<x>/src` for inline styles / Tailwind / stray `.css`

**Stripe webhook signature** — `convex/http.ts /stripe-webhook`
- HMAC-SHA256 over `<timestamp>.<rawBody>` compared against the `Stripe-Signature` header v1 value

**Rate limiter buckets** (`convex/shared/rateLimit.ts`)
- `applicationsSubmit` (3/min, capacity 5)
- `channelsPost` (30/min, capacity 30, **sharded × 8**)
- `stripeCheckout` (5/10min, capacity 5, **sharded × 4** — also used by `ai.suggestPick`)
- `gdprExport` (3/hour, **sharded × 4**)

**MFA helpers** — `convex/mfa.ts`
- `requireMfaFresh(ctx, userId)` — strict: throws if not enrolled OR not fresh
- `gateOnMfaIfEnrolled(ctx, userId)` — soft: throws only if enrolled AND not fresh

## Frontend Build
**Pages**
- `apps/web/src/dashboard/pages/Settings.tsx` — Privacy & data card with Export + Delete
- `apps/web/src/account/pages/AccountSettings.tsx` — subscriber-side counterpart
- `apps/web/src/pages/admin/Admin.tsx` — surfaces audit drill-down

**Components**
- `MfaEnrollmentCard` (3-state machine: idle / enrolling / enrolled)
- DS Privacy & data card (Export my data + Delete my account buttons + warning copy)

## Testing
**Unit**
- TOTP HMAC-SHA1 with ±1 step drift
- Rate limiter shard distribution under load
- GDPR cascade scrub leaves audit logs intact

**Integration**
- Export action returns every relevant row for a test user
- Delete action anonymizes and cancels subs + scrubs notifications + redacts messages
- Stripe webhook with bad signature returns 401

**E2E**
- Customer clicks Export → downloads JSON containing their picks/subs/messages
- Customer clicks Delete → confirms → account inaccessible on next request

## Governance / Rules
- **Audit logs are append-only.** Schema doesn't enforce — CI grep does. Zero `.patch / .replace / .delete` against `auditLogs` anywhere in `convex/`.
- **GDPR cascade is surgical.** Subscriptions retained but anonymized so creator analytics stay intact. Messages retained (body redacted) so chat threads don't develop holes.
- **Audit logs survive deletion.** `actorUserId` retained as a Convex Id; no longer dereferences to a personally-identifying record after anonymization.
- **MFA freshness = 15 minutes.** Tunable via `MFA_FRESHNESS_MS` constant in `mfa.ts`.
- **Rate limiter shards documented.** `channelsPost` × 8 covers 10k+ rps cumulative; `stripeCheckout` / `gdprExport` × 4 covers compliance-audit bursts.
- **Stripe webhook signature verified before any DB write.** Invalid signatures return 401; valid events audit-logged before dispatch.
- **Retention policies deferred** to a later phase. Current behavior: indefinite retention of audit logs + soft-deleted records. Compliance with longer-than-statutory retention requires a follow-up cron.
- **No platform-settings table at MVP** — all config is env-driven so deploys are atomic.
