# M14 — Community & Realtime Interaction

## Purpose
The space where creators talk to subscribers and subscribers talk to each
other. Tiered channels (public / subscriber / vip), per-creator stream-linked
rooms, creator-subscriber DMs, message reactions. All polymorphic over a
single `messages` table so DMs and channels share infrastructure.

## Target Roles
Customer · Creator · Admin · System

## Core Features
- 3-tier access on channels (`public`, `subscriber`, `vip`) with creator-owner + admin bypass
- Stream-linked rooms — auto-spun up when a creator goes live, locked when offline
- Creator ↔ subscriber DMs with unread counters per side
- Emoji reactions on every message kind (channel + DM)
- Polymorphic `messages` table — `channelId | dmThreadId | conversationId` (legacy listings)
- Subscriber-only channels return locked UI for non-subscribers (drives conversion)

## User Stories
- As a creator, I want a public welcome channel and a subscriber-only inner-circle.
- As a subscriber, I want to DM the creator I subscribe to.
- As a customer in a chat, I want to react to a hot take with 🔥 without flooding the room.
- As a non-subscriber, I want to see a subscriber-only channel exists with a clear unlock CTA.
- As a creator, I want a transient room that opens when I go live and closes when I stop.

## Backend / Convex Build
**Tables**
- `channels` (creatorId, slug, name, description, type, access, isActive, linkedStreamCreatorId, memberCount, lastMessageAt, createdAt)
- `messages` (conversationId? / channelId? / dmThreadId?, senderUserId, body, readAt, createdAt, reactions: [{ emoji, userIds[] }])
- `dmThreads` (creatorId, userId, unreadForCreator, unreadForUser, lastMessageAt, createdAt)
- `conversations` (legacy listing buyer/seller — retained for back-compat)

**Indexes** — `channels.by_creator`, `by_slug`, `by_type`, `by_linkedStream`; `messages.by_channel_and_createdAt`, `by_dmThread_and_createdAt`; `dmThreads.by_creator (lastMessageAt)`, `by_user (lastMessageAt)`, `by_creator_and_user`

**Queries**
- `channels.list`, `channels.byCreator`, `channels.getBySlug`, `channels.myAccess`
- `messages.listByChannel` (returns [] for blocked users), `messages.getMessages`, `messages.listConversations`
- `dmThreads.myThreads`, `dmThreads.threadsForMyCreator`, `dmThreads.messagesIn`

**Mutations**
- `channels.create / update`
- `messages.postToChannel` (rate-limited 30/min sharded; rejects locked channels + offline stream rooms)
- `messages.send` (legacy listing path), `messages.toggleReaction`
- `dmThreads.openWithCreator` (subscription-gated except for creator-owner), `dmThreads.send`, `dmThreads.markRead`
- `streams._ensureStreamRoom` (internal — idempotent stream-room creation)

**Helper** — `convex/channels.ts`
- `checkChannelAccess(ctx, channel, userId)` — single source of truth for channel gating

## Frontend Build
**Pages**
- `apps/web/src/pages/Community.tsx` — public + subscriber channel browser
- `apps/web/src/dashboard/pages/Messages.tsx` — creator-side DM inbox
- `apps/web/src/account/pages/Messages.tsx` — subscriber-side DM inbox

**Components**
- `ChatPanel` (with reactions + picker, `onToggleReaction` handler)
- `LockedChannelPanel` (subscribe CTA for non-subscribers)
- `PersonRow` for thread list rows

## Testing
**Unit**
- `checkChannelAccess` matrix (creator-owner, admin, active sub on subscriber/vip channels, no sub)
- `messages.toggleReaction` add/remove + empty-bucket pruning
- `dmThreads.openWithCreator` rejects non-subscribers

**Integration** — `convex/channels.test.ts`
- Subscriber-only channel: list returns rows; postToChannel rejects with "requires subscriber subscription" for non-sub
- Stream-linked channel: `postToChannel` rejects when `streamLive` false
- DM thread: send increments recipient-side unread counter

**E2E**
- Customer subscribes → can post in subscriber channel
- Customer reacts 🔥 to a creator message → reaction count updates live
- Creator goes live → stream-linked room becomes postable; stream ends → posts blocked

## Governance / Rules
- **Server-side gating only.** `messages.listByChannel` returns `[]` for blocked users — UI uses `channels.myAccess` to render `LockedChannelPanel`. Never decide access in JS.
- **Reactions are toggles.** `messages.toggleReaction` adds the user if absent, removes if present. Empty buckets pruned so `reactions[]` stays clean.
- **Stream rooms are transient.** `streams._ensureStreamRoom` is idempotent — re-runs reactivate the existing room. Posts blocked when `streamLive=false`.
- **Rate limiter on posts.** `channelsPost` bucket (30/min, sharded × 8) so a hot stream room can sustain 10k+ rps cumulative.
- **Polymorphic messages.** Exactly one of `conversationId / channelId / dmThreadId` set per row — reactions and access checks branch on which.
