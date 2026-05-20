# Security review checklist (Phase F)

Run before merging `integration/digipicks-1-0` → `main`. Complements [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md).

## HTTP / webhooks

| Surface              | File             | Check                                           |
| -------------------- | ---------------- | ----------------------------------------------- |
| Stripe webhooks      | `convex/http.ts` | Signature verified with `STRIPE_WEBHOOK_SECRET` |
| Discord interactions | `convex/http.ts` | Ed25519 verify with `DISCORD_PUBLIC_KEY`        |
| Discord OAuth        | `convex/http.ts` | State cookie + creatorId binding                |
| Seed route           | `convex/http.ts` | `SEED_TOKEN` bearer required                    |

## Auth & RBAC

| Check                                                                              | Location                             |
| ---------------------------------------------------------------------------------- | ------------------------------------ |
| Sensitive mutations use `requireUser` / `requireAdmin` / `requireCreatorOwnership` | `convex/shared/permissions.ts`       |
| Admin routes gated in `AuthGate`                                                   | `apps/web/src/admin/Routes.tsx`      |
| Creator studio gated                                                               | `apps/web/src/dashboard/Routes.tsx`  |
| MFA for elevated actions                                                           | `convex/mfa.ts` (verify admin flows) |

## Rate limiting & abuse

| Check                    | Location                     |
| ------------------------ | ---------------------------- |
| Shared rate limit helper | `convex/shared/rateLimit.ts` |
| AI / Copilot scrub       | `convex/aiCopilot/scrub.ts`  |

## Data privacy

| Check                                           | Location                               |
| ----------------------------------------------- | -------------------------------------- |
| GDPR export/delete                              | `convex/gdpr.ts`                       |
| Discord inbound: hashed authors, no raw content | `convex/discord/inbound.ts`            |
| Audit append-only                               | CI guard in `.github/workflows/ci.yml` |

## Secrets

- No secrets in client bundles (`VITE_*` only for public Convex URL).
- Discord OAuth tokens encrypted at rest (`DISCORD_TOKEN_ENC_KEY` / oauth module).
- All production keys via Convex env dashboard, not committed.

## Sign-off

| Reviewer | Date | Notes |
| -------- | ---- | ----- |
|          |      |       |
