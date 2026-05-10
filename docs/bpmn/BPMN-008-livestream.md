# BPMN-008 — Creator livestream workflow

## Purpose

A creator hosts a livestream tied to an event. The system detects the
live state, notifies subscribers, opens a stream-linked community room,
and closes everything down on stream end.

## Trigger

- Creator schedules a stream → `streams.create` mutation.
- 5-minute cron (`streams.detectLive`) flips status when the upstream
  provider (Twitch / YouTube / Kick) reports the channel as live.

## Preconditions

- Creator authenticated and verified.
- `streams.providerHandle` is set.
- Optional: `eventId` linking the stream to a specific match.

## Actors / Swimlanes

- **Creator**
- **Convex Backend** — `streams`, `channels`, `messages`, `auditLogs`.
- **External provider** — Twitch / YouTube / Kick.
- **Notify** — push / telegram / discord fanout.
- **Subscribers** — open the live room.

## Main flow

```mermaid
flowchart TD
  subgraph CR[Creator]
    cr1[Schedule stream]
    cr2[Go live on provider]
    cr3[End stream]
  end
  subgraph K[Convex Backend]
    k1[(streams<br/>insert status=scheduled)]
    k2{{streams.detectLive<br/>cron 5 min}}
    k3[(streams<br/>patch status=live)]
    k4[(channels<br/>insert linked=stream)]
    k5[(streams<br/>patch status=ended)]
    k6[(channels<br/>archive)]
    k7[(auditLogs)]
  end
  subgraph P[External provider]
    p1[/Twitch / YouTube / Kick/]
  end
  subgraph N[Notify]
    n1{{notify.dispatch<br/>stream.live}}
  end
  subgraph S[Subscribers]
    s1[Open live room]
    s2[Chat in linked channel]
  end

  cr1 --> k1
  cr2 --> p1
  k2 --> p1
  p1 -->|live=true| k3 -.-> k4
  k4 -.-> n1 --> s1 --> s2
  k4 -.-> k7
  cr3 --> p1
  p1 -->|live=false| k5 -.-> k6
  k5 -.-> k7
```

## Alternative flows

- **Provider rate-limit / outage** → cron logs warning; status stays at
  last-known. Stream-state UI shows a stale-data badge.
- **Creator forgets to end the stream** → 24-hour TTL auto-closes the
  channel; archived audit row is written.
- **Linked event finishes during the stream** → BPMN-013 runs; pick
  grading happens independently.
- **Stream is restricted (private)** → channel-access gating
  (BPMN-002 entitlements) limits who can join the room.

## Postconditions

- `streams.status` ∈ {`scheduled`, `live`, `ended`}.
- A `channels` row exists for the duration of the live state.
- Audit rows for every transition.

## Realtime events

- `streams.live` query auto-updates on every status change.
- The linked `channels.messages` query receives new chat in realtime.

## AI interactions

None inline. Post-stream summarization is owned by the Discord inbound
pipeline if a Discord channel is mapped (BPMN-014 + Discord module).

## Module mapping

- [M11 — Streaming integration](../modules/M11-streaming-integration.md)
- [M12 — Channels & rooms](../modules/M12-channels-rooms.md)
- [M19 — Notifications & realtime](../modules/M19-notifications-realtime.md)
