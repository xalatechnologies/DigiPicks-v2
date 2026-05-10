# M20 — Discord Integration & Community Sync

## Purpose
Two-way Discord bridge. Outbound: creators send picks, grading updates,
and live-stream alerts to their Discord servers via webhooks. Inbound
(planned): import discussion summaries + sentiment from approved channels
to power community-intelligence features. Outbound is shipped today;
inbound + thread linking is the planned expansion (see
`/docs/discord-integration.md` for the full vision).

## Target Roles
Creator · Customer · Admin · System

## Core Features
- Per-creator Discord webhook URL (`creators.discordWebhookUrl`)
- Outbound pick delivery on publish — rich embed with sport emoji + market + selection + odds
- Test webhook from Settings (sends a sample embed)
- Discord OAuth identity on `users.{discordId, discordUsername}` (for creator-side recognition)
- Audit-logged webhook outcomes
- Planned: inbound channel sync, thread linking, sentiment summaries

## User Stories
- As a creator, I want my picks auto-posted to my Discord server.
- As a creator, I want to test my webhook URL before going live.
- As a customer, I want to identify with my Discord account so creators recognize me.
- As an admin, I want to disable a Discord integration if it's spamming.
- (Future) As a creator, I want a digest of what my Discord community is saying about my picks.

## Backend / Convex Build
**Tables (current)**
- `creators.discordWebhookUrl` (per-creator outbound)
- `users.{discordId, discordUsername}` (OAuth identity) — by_discordId

**Tables (planned, per `/docs/discord-integration.md`)**
- `discordIntegrations`, `discordChannelSyncs`, `discordMessageImports`,
  `discordThreadLinks`, `discordDeliveryLogs`, `discordWebhookEvents`,
  `discordSentimentSummaries`

**Queries**
- N/A today (Settings reads `creators.discordWebhookUrl` via `creators.get`)

**Mutations**
- `discordSettings.setWebhookUrl` — creator-only; validates `https://discord.com/api/webhooks/` prefix
- `discordSettings._getCreator` (internal — used by the test action)

**Actions**
- `discord.deliverPickNotification` (internal, V8) — embed posted via fetch + audit log
- `discordSettings.testWebhook` — sends a sample embed for verification
- (Planned) `discord.connectGuild`, `discord.refreshGuildChannels`, `discord.importChannelMessages`, `discord.generateDiscussionSummary`, `discord.calculateSentiment`

## Frontend Build
**Pages**
- `apps/web/src/dashboard/pages/Settings.tsx` — Discord Integration card (webhook URL + Save + Test)
- `apps/web/src/pages/Auth.tsx` — Discord OAuth button (sign in with Discord)

**Components (current)**
- `Field`, `Input`, `Button` (DS) inside a single Settings card

**Components (planned)**
- `DiscordIntegrationCard`, `DiscordConnectButton`, `DiscordChannelMapper`,
  `DiscordSyncDirectionSelector`, `DiscordAlertRuleEditor`,
  `DiscordDeliveryLogTable`, `DiscordDiscussionSummary`,
  `DiscordThreadLinkBadge`

## Testing
**Unit**
- Webhook URL prefix validation in `discordSettings.setWebhookUrl`
- Embed payload formatting (sport emoji map, color, footer)

**Integration**
- `picks.create` (status=published) schedules `discord.deliverPickNotification`
- Test webhook returns ok / fails gracefully on bad URL

**E2E**
- Creator pastes webhook URL → clicks Test → sample embed lands in Discord
- Creator publishes a pick → embed lands in Discord within seconds

## Governance / Rules
- **Outbound is fire-and-forget.** Errors logged + audit-logged, never re-thrown so the picks.create scheduler chain isn't blocked by Discord downtime.
- **Audit every outcome.** `audit.log` entries for delivery success/failure with embed metadata.
- **Webhook prefix enforced.** Only `https://discord.com/api/webhooks/` URLs accepted to prevent SSRF / open redirect vectors.
- **Inbound message content requires explicit creator opt-in** (see `/docs/discord-integration.md`) — Discord MESSAGE_CONTENT intent must be configured per app.
- **Don't store raw message content by default.** When inbound ships, store summaries + sentiment + author hashes — not raw content.
- **Allow creators / admins to disable sync at any time** — `discordSettings.setWebhookUrl(null)` clears the URL.
