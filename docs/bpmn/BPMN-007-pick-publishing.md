# BPMN-007 — Creator pick publishing

## Purpose

A creator drafts a pick, attaches an event + odds + tier gating, and
publishes it. The system fans out to subscribers via every configured
channel and surfaces the pick in the realtime feed.

## Trigger

Creator clicks **Publish** on `/dashboard/create`.

## Preconditions

- Creator is authenticated, role ∈ {`creator`, `admin`}.
- Creator's `creators.suspended` is false.
- Event exists and is in `scheduled` or `live` state.
- For premium picks: at least one paid `pricingTiers` row exists.
- Rate-limit token available on the `picksPublish` shard.

## Actors / Swimlanes

- **Creator**
- **Convex Backend** — `picks`, `events`, `auditLogs`.
- **AI Engine** — optional `ai.cowrite` for pre-publish suggestion;
  post-publish `ai.analyzePick` runs async to fill `aiSummary` /
  `aiConfidence` / `aiReasoning`.
- **Notify** — per-user fanout: push / telegram / email (BPMN-015).
- **Discord** — per-creator outbound. Two paths:
  `discord.delivery.deliverPickNotification` (legacy single webhook on
  `creators.discordWebhookUrl`) and `discord.delivery.fanoutOutbound`
  (new multi-channel flow keyed off `discordChannelSyncs`). Both fire
  fire-and-forget; failures land in `discordDeliveryLogs` and never
  block publish.
- **Feed** — realtime subscription queries.

## Main flow

```mermaid
flowchart TD
  subgraph CR[Creator]
    cr1[Compose draft]
    cr2[Pick event + odds + tier]
    cr3[Click Publish]
  end
  subgraph K[Convex Backend]
    k1{{rateLimit.consume<br/>shard=picksPublish}}
    k2[(picks<br/>insert status=published)]
    k3{{ai.analyzePick<br/>scheduled async}}
    k4[(picks<br/>patch aiSummary + aiConfidence)]
    k5[(auditLogs<br/>action=pick.published)]
    k6{{notify.onPickPublished}}
  end
  subgraph A[AI]
    a1[/Anthropic Haiku 4.5<br/>cache_control: ephemeral/]
  end
  subgraph N[Notify]
    n1{{notify.dispatch<br/>push + telegram + email}}
  end
  subgraph D[Discord]
    d1{{discord.delivery.deliverPickNotification<br/>legacy webhook}}
    d2{{discord.delivery.fanoutOutbound<br/>eventType=new_pick}}
    d3{{discord.delivery.fanoutOutbound<br/>eventType=ai_insight}}
  end
  subgraph F[Feed]
    f1[feed.list re-runs]
    f2[creators.recent updates]
  end

  cr1 --> cr2 --> cr3 --> k1 --> k2
  k2 -.-> k3 -.-> a1 -.-> k4
  k4 -.-> d3
  k2 -.-> k5
  k2 -.-> k6 -.-> n1
  k2 -.-> d1
  k2 -.-> d2
  k2 -.-> f1
  k2 -.-> f2
```

## Alternative flows

- **Premium pick, no entitlement on the customer side** → fanout still
  fires, but the rendered card shows the upsell variant (BPMN-002).
- **Rate-limit exceeded** → `picks.publish` throws
  `RATE_LIMITED`; UI surfaces a cool-down banner.
- **Watchlist match** (BPMN-005) → `notify.onPickPublished` runs the
  matcher and queues an extra alert.
- **AI co-write fails** → the pick is published without an AI summary;
  the creator can re-run the action manually.
- **Creator suspended mid-publish** → mutation rejects with
  `SUSPENDED`; no row written.

## Postconditions

- `picks` row with `grade='pending'`.
- Async-filled `aiSummary` / `aiConfidence` / `aiReasoning` from
  `ai.analyzePick` (no-op if `ANTHROPIC_API_KEY` is unset).
- Audit row `pick.published`.
- One row in `notifications` per channel × subscriber (push / telegram /
  email path — see BPMN-015).
- For each enabled outbound `discordChannelSyncs` row on the creator,
  one `discordDeliveryLogs` row per Discord post (`new_pick` and, once
  the AI analysis lands, `ai_insight`). Legacy creators on
  `creators.discordWebhookUrl` get a single `deliverPickNotification`
  delivery row instead — the two paths are mutually exclusive: the
  legacy fallback short-circuits when any `discordChannelSyncs` row
  exists for the creator.

## Realtime events

- `feed.list` and `creators.recent` re-run for every entitled customer.
- Creator's `dashboard/picks` table gains the new row.

## AI interactions

- `ai.suggestPick` (pre-publish, optional). Anthropic Haiku 4.5 with the
  shared prompt-cached system block. Returns a draft summary +
  confidence + reasoning the creator can accept; never publishes
  unapproved content.
- `ai.analyzePick` (post-publish, scheduled async). Same Haiku model
  and system prompt — intentionally so that both paths share the
  Anthropic prompt cache. On completion, schedules
  `discord.delivery.fanoutOutbound` with `eventType='ai_insight'` for
  creators with the `aiInsight` alert rule on. Quietly skips when
  `ANTHROPIC_API_KEY` is unset.

## Module mapping

- [M05 — Picks publishing engine](../modules/M05-picks-publishing-engine.md)
- [M12 — AI intelligence engine](../modules/M12-ai-intelligence-engine.md)
- [M13 — Notifications & smart alerts](../modules/M13-notifications-smart-alerts.md)
- [M20 — Discord integration](../modules/M20-discord-integration.md)
- [M25 — Platform settings, compliance & audit](../modules/M25-platform-settings-compliance-audit.md)
