# M15 — Livestream Integrations

## Purpose
Detect when a creator goes live on Twitch / YouTube / Kick, surface live
status across the platform, and notify subscribers in real time. Spins up
a transient stream-linked channel (M14) so subscribers have a place to
gather while the stream runs.

## Target Roles
Creator · Customer · Admin · System

## Core Features
- Per-platform live polling: Twitch Helix, YouTube Data API v3, Kick public API
- 5-minute cron interval (configurable)
- Auto-detect offline → live transition; emit `notify.dispatch` with kind `pick_published` (reused) and `creator-live` entityKey
- Auto-spin / reactivate stream-linked community room
- StreamEmbed surfaces on CreatorDetail when `streamLive=true`
- HeroLivePanel on Landing shows currently-live creators

## User Stories
- As a creator, I want my stream to surface across DigiPicks the moment I go live.
- As a subscriber, I want a push notification when a creator I follow starts streaming.
- As a customer, I want a stream-linked chat room that's only open while the stream runs.
- As an admin, I want to see who's currently live for moderation.

## Backend / Convex Build
**Tables**
- `creators.{streamPlatform, streamHandle, streamLive, streamLastCheckedAt, streamWentLiveAt, streamTitle, streamViewerCount}` (extends creators)

**Queries**
- `streams.getLiveState` — `{ platform, handle, live, wentLiveAt, title, viewerCount, lastCheckedAt }` for one creator
- `streams.liveNow` — list of currently-live creators (for HeroLivePanel)

**Mutations**
- `streams.setStream` — creator binds platform + handle (resets live state)
- `streams._setLiveState` (internal — bumped each poll cycle)
- `streams._ensureStreamRoom` (internal — idempotent room creation, see M14)

**Actions / Crons**
- `streams.pollStreams` (5min) — iterates creators with linked handles, calls per-platform `checkTwitch / checkYouTube / checkKick`
- `streams.fanLiveNotification` (internal action, fires only on offline → live transition) — creates room + dispatches notify to active subscribers
- `streams._creatorsWithStreamHandle` (internal query — bounded)
- `streams._liveContext` (internal query — fetch creator + active subscribers)

**Per-platform checks** — `convex/streams.ts`
- Twitch Helix `/streams?user_login=` (requires `TWITCH_CLIENT_ID` + `TWITCH_APP_ACCESS_TOKEN`)
- YouTube Data v3 `/search?eventType=live` + optional `forHandle` lookup (requires `YOUTUBE_API_KEY`)
- Kick public `/api/v2/channels/<slug>` (no key required)

## Frontend Build
**Pages**
- `apps/web/src/pages/CreatorDetail.tsx` — embeds `StreamEmbed` when `streamLive=true`
- `apps/web/src/pages/Landing.tsx` — `HeroLivePanel` rail of live creators
- `apps/web/src/dashboard/pages/Settings.tsx` — creator binds platform + handle

**Components**
- `StreamEmbed` (Twitch / YouTube / Kick iframe + fallback)
- `HeroLivePanel` (compact rail of live creators)

## Testing
**Unit**
- Twitch / YouTube / Kick check functions handle non-OK responses without throwing
- Offline → live transition fires `fanLiveNotification` exactly once per session

**Integration**
- Cron polls all linked creators; bounded `take(2000)` scan
- `_ensureStreamRoom` is idempotent — re-runs reactivate the existing channel

**E2E**
- Creator binds Twitch handle → goes live → cron picks it up within 5 min → push lands on subscriber's device
- Customer opens CreatorDetail → StreamEmbed renders; stream ends → embed hides on next state poll

## Governance / Rules
- **Per-platform credentials are optional.** Missing env keys quietly skip that platform — never break the rest of the cron.
- **5-minute cadence.** Lower would risk YouTube quota burn (1440 calls/day/platform); higher would feel stale to subscribers. Tunable per deploy.
- **Live-start fires once.** `_setLiveState` carries a `wentLive` flag the cron passes only on offline → live transitions; subsequent polls keep `streamLive=true` without re-firing.
- **Stream-linked rooms are open while live, closed otherwise.** `messages.postToChannel` rejects posts to a stream-linked channel when the linked creator's `streamLive=false`.
- **No raw stream content stored** — only metadata (title, viewer count) and the live flag.
