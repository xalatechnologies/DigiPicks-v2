# M13 — Notifications & Smart Alerts

## Purpose
The connective tissue that turns picks, gradings, line moves, live streams,
and watchlist hits into real-time taps on the customer's shoulder. Fans
events out across in-app + web push + Telegram + per-creator Discord, with
per-user channel + per-kind toggles.

## Target Roles
Customer · Creator · Admin · System

## Core Features
- Central dispatch: `notify.dispatch(userId, kind, payload)` — single entry point for every alert
- 3 kinds: `pick_published`, `pick_graded`, `line_moved` (extensible)
- 4 delivery channels: in-app row + web push (VAPID) + Telegram bot + Discord webhook (per-creator)
- Per-user `notifyPrefs` toggles + per-kind toggles + Telegram link flow
- 5-minute `entityKey` dedup so retries / overlapping fan-outs collapse to one inbox row
- Triggers wired: `picks.create` publish, `picks.grade` finalize, `streams.fanLiveNotification`, `lineMovement.pollLineMovements`, `watchlists` matcher, `dmThreads.send`
- Service worker (`apps/web/public/sw.js`) handles push event + click-to-focus

## User Stories
- As a customer, I want to be notified the moment a creator I follow publishes.
- As a customer, I want push on my phone instead of needing the tab open.
- As a customer, I want Telegram alerts for the creators I care about most.
- As a creator, I want my picks pushed to my Discord server automatically.
- As a customer, I want to silence grading alerts but keep new-pick alerts.

## Backend / Convex Build
**Tables**
- `notifications` (userId, type, title, body, data, readAt, createdAt) — by_user, by_user_and_read
- `pushSubscriptions` (userId, endpoint, p256dh, auth, userAgent, createdAt) — by_user, by_endpoint
- `users.{notifyPrefs, telegramChatId, telegramLinkCode, telegramLinkedAt}` (extends users)
- `creators.discordWebhookUrl`

**Queries**
- `notifications.listMine`, `notifications.listMinePaginated`, `notifications.listUnread`, `notifications.unreadCount`
- `pushSubscriptions.hasAnySubscription`, `pushSubscriptions.publicKey`
- `notify.myPrefs`

**Mutations**
- `notifications.markRead`, `notifications.markAllRead`
- `pushSubscriptions.subscribe / unsubscribe` + internal `_subscriptionsForUser` / `_removeEndpoint`
- `notify.updatePrefs`, `notify.startTelegramLink`, `notify._confirmTelegramLink` (webhook-only)
- `notify._insertInApp` (internal — entityKey-deduped)

**Actions**
- `notify.dispatch` (internal) — fans to in-app + push + telegram per user prefs
- `notify.onPickPublished` / `notify.onPickGraded` (internal — trigger fan-outs)
- `push.sendToUser` (Node, `'use node'`) — web-push lib + auto-unsubscribe on 410
- `telegram.sendToChat` (V8) — Bot API sendMessage with MarkdownV2 escape
- `discord.deliverPickNotification` (V8) — per-creator webhook embed

## Frontend Build
**Pages**
- `apps/web/src/pages/Notifications.tsx` — inbox with unread badge + mark-read
- `apps/web/src/dashboard/pages/Settings.tsx` — Notifications card with channel toggles + push prompt + Telegram link
- `apps/web/src/main.tsx` — service worker registration

**Components**
- `PushNotificationPrompt` (feedback — supported / unknown / granted / denied states)
- `SwitchRow` for per-kind toggles
- AppHeader notification badge with `aria-live` region

## Testing
**Unit**
- `notify._insertInApp` 5-minute entityKey dedup
- TOTP-style MarkdownV2 escape correctness for Telegram payloads
- 410 endpoint auto-unsubscribe

**Integration**
- `picks.create` (status=published) → `notify.onPickPublished` fans to all active subscribers' in-app rows
- `picks.grade` (terminal) → `notify.onPickGraded` to savers + subscribers
- Watchlist match adds an extra dispatch with the same entityKey → in-app stays one row

**E2E**
- Customer enables push + receives a push on the next subscribed creator's publish
- Customer links Telegram via `/start <code>` → next pick lands in Telegram
- Customer toggles "pick_graded" off → no grading alerts arrive

## Governance / Rules
- **Single dispatcher.** Every alert call site routes through `notify.dispatch` so per-user prefs are honored consistently.
- **Per-kind defaults to on.** Users with empty `notifyPrefs` still receive every alert; opt-out is explicit.
- **entityKey dedup.** All fan-outs use a stable `entityKey` (e.g. `pick-published:<pickId>`) — overlapping triggers (subscriber + watchlist hit) collapse into one in-app row.
- **Push graceful.** Missing VAPID env → `push.sendToUser` returns `{ sent: 0, removed: 0 }` quietly.
- **Telegram link is one-shot.** `telegramLinkCode` is consumed on `_confirmTelegramLink` so a leaked code can't be replayed.
- **Discord is per-creator** (URL on creators row), not per-user. Creators control where their picks go.
