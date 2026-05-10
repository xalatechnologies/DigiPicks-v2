# M21 — Telegram Integration

## Purpose
Per-user Telegram bot delivery. Each user opts in via a one-shot link code
that the DigiPicks bot's `/start` handler turns into a stored `chatId`.
After that, every notify fan-out hits Telegram alongside in-app + web push,
honoring the user's per-channel toggle.

## Target Roles
Customer · Creator · System

## Core Features
- Per-user Telegram link via one-time `telegramLinkCode`
- `/start <code>` flow on the bot resolves to a `chatId` stored on the user
- MarkdownV2-escaped messages with kind-specific emoji prefix
- Per-user channel toggle via `notifyPrefs.telegram`
- Withretry-wrapped Bot API call
- Quiet no-op when `TELEGRAM_BOT_TOKEN` is unset

## User Stories
- As a customer, I want to link my Telegram so I get pick alerts on my phone.
- As a customer, I want to pause Telegram delivery without unlinking.
- As the system, I want a one-shot link code so leaked codes can't be replayed.

## Backend / Convex Build
**Tables**
- `users.{telegramChatId, telegramLinkCode, telegramLinkedAt}` (extends users)
  — `by_telegramLinkCode`, `by_telegramChatId` indexes

**Queries**
- `notify.myPrefs` — exposes `telegramLinked` boolean + current code

**Mutations**
- `notify.startTelegramLink` — generates a fresh code (8-char base36 with `dg_` prefix), writes to `users.telegramLinkCode`
- `notify._confirmTelegramLink` (internal, webhook-only) — `/start <code>` handler: resolves the code → patches `users.telegramChatId` + clears `telegramLinkCode` + sets `notifyPrefs.telegram=true`
- `notify.updatePrefs` — toggle `telegram: true|false`

**Actions**
- `telegram.sendToChat` (V8 internal) — Bot API `/sendMessage` with `parse_mode=MarkdownV2`, `withRetry` wrapper

**Helper** — `convex/telegram.ts`
- `escapeMarkdownV2(s)` — escapes every reserved char so user-supplied content can't break formatting

## Frontend Build
**Pages**
- `apps/web/src/dashboard/pages/Settings.tsx` — Notifications card has the Telegram link flow + toggle

**Components**
- `SwitchRow` for the on/off toggle (disabled until linked)
- `Mono` to display the `/start dg_<code>` payload

## Testing
**Unit**
- MarkdownV2 escaper — covers all reserved chars `_*[]()~ `\`>#+-=|{}.!\``
- `_confirmTelegramLink` — invalid code returns `{ ok: false, reason: 'invalid_code' }`

**Integration**
- `startTelegramLink` → `_confirmTelegramLink` → `users.telegramChatId` set + `notifyPrefs.telegram=true`
- `notify.dispatch` with `telegram: true` + valid `chatId` → `telegram.sendToChat` runs

**E2E**
- Customer clicks Link Telegram → copies `dg_<code>` → messages bot → toggle goes live → next pick lands in Telegram

## Governance / Rules
- **One-shot codes.** `telegramLinkCode` cleared on confirm so a leaked code can't be replayed.
- **`_confirmTelegramLink` is internal only.** Bot's `/start` webhook handler is the only legitimate caller. (Bot infrastructure runs outside Convex; the webhook posts to a public action that calls the internal mutation.)
- **Bot token via env only.** `TELEGRAM_BOT_TOKEN` — never logged. Missing → quiet no-op so dev environments don't spam.
- **Per-kind toggles still apply.** Telegram delivery respects `notifyPrefs.{pickPublished, pickGraded, lineMoved}` like every other channel.
- **MarkdownV2 escape mandatory** on all user-supplied strings (creator name, pick title) before interpolating into the message body.
