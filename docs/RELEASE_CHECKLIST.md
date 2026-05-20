# DigiPicks 1.0 — release checklist (Phase F)

Use with [`requirements-traceability-matrix.md`](requirements-traceability-matrix.md) on branch `integration/digipicks-1-0`.

## Pre-merge gates

- [ ] `pnpm -r --if-present typecheck` green
- [ ] `pnpm -r --if-present lint` green (no new errors)
- [ ] `pnpm --filter @digipicks/web build` green
- [ ] Doctrine greps from [`CLAUDE.md`](../CLAUDE.md) §7 — zero violations in `apps/**`
- [ ] `pnpm test` (Convex vitest) green
- [ ] `pnpm --filter @digipicks/web e2e` — public smoke + trust routes pass

## Traceability matrix

- [ ] Every M01–M25 row is **Shipped**, **Partial** (ticket linked), **Deferred** (signed off), or **N/A**
- [ ] All 10 golden E2E journeys are **automated** or **Deferred** with owner in matrix
- [ ] Cross-cutting standards row reviewed (authz, webhooks, DS doctrine, tests)

## Staging / production

- [ ] Convex env vars set per [`RUNBOOK.md`](RUNBOOK.md) §1 (Stripe, Anthropic, Odds, Discord, `WEB_BASE_URL`)
- [ ] Stripe webhook endpoint live; test subscription smoke on staging
- [ ] Discord: bot token, OAuth client, interactions URL, `DISCORD_AUTHOR_SALT` configured
- [ ] Crons enabled on deployment (`discord-import-messages`, odds, live scores as needed)
- [ ] Convex dashboard: error rate, OCC conflicts, function duration within limits
- [ ] Security pass completed per [`SECURITY_REVIEW.md`](SECURITY_REVIEW.md)

## Sign-off

| Role                  | Name | Date |
| --------------------- | ---- | ---- |
| Engineering           |      |      |
| Product               |      |      |
| Legal (template copy) |      |      |

## Release PR

1. `integration/digipicks-1-0` → `main` (squash or merge per team policy)
2. Tag release (e.g. `v1.0.0-rc.1`)
3. `npx convex deploy --prod` + web deploy per hosting runbook
4. Post-deploy smoke: `/`, `/creators`, `/auth`, `/apply`, admin overview
