import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { query, internalAction, internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import { requireCreatorOwnership } from '../shared/permissions';
import { withDiscordRetry, ensureDiscordOk } from './retry';

// =============================================================================
// Discord outbound delivery (refactored from convex/discord.ts).
//
// Responsibilities:
//   1. `deliverPickNotification` — public surface preserved. Tries enabled
//      outbound `discordChannelSyncs` for the creator first; falls back to
//      `creators.discordWebhookUrl` when no syncs exist.
//   2. `fanoutOutbound` — generic event fanout (new_pick, pick_graded,
//      odds_movement, creator_live, ai_insight). Filters per-channel
//      `alertRules` toggles + minConfidence gate.
//   3. `_logDelivery` / `getDeliveryLogs` / `retryQueue` — the delivery audit
//      surface. Webhook URLs are masked at write time.
//
// All outbound is fire-and-forget — failures are logged to
// `discordDeliveryLogs` but never thrown to the caller.
// =============================================================================

const DISCORD_BLURPLE = 0x5865f2;
const DISCORD_API = 'https://discord.com/api/v10';

const SPORT_EMOJI: Record<string, string> = {
  Soccer: '⚽',
  Cricket: '🏐',
  Tennis: '🎾',
  Football: '🏈',
  Basketball: '🏀',
  Baseball: '⚾',
  Hockey: '🏒',
  MMA: '🥊',
  Rugby: '🏉',
};

const CONFIDENCE_RANK: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
};

export const deliveryEventType = v.union(
  v.literal('new_pick'),
  v.literal('pick_graded'),
  v.literal('odds_movement'),
  v.literal('creator_live'),
  v.literal('ai_insight'),
  v.literal('announcement'),
);

export type DeliveryEventType =
  | 'new_pick'
  | 'pick_graded'
  | 'odds_movement'
  | 'creator_live'
  | 'ai_insight'
  | 'announcement';

interface FanoutPayload {
  title: string;
  description?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  url?: string;
  /** Source entity for audit / cross-link in the delivery log. */
  relatedEntityType?: string;
  relatedEntityId?: string;
  /** Confidence label — used by the per-channel `minConfidence` gate. */
  confidence?: 'Low' | 'Medium' | 'High';
}

const fanoutPayloadValidator = v.object({
  title: v.string(),
  description: v.optional(v.string()),
  fields: v.optional(
    v.array(
      v.object({
        name: v.string(),
        value: v.string(),
        inline: v.optional(v.boolean()),
      }),
    ),
  ),
  url: v.optional(v.string()),
  relatedEntityType: v.optional(v.string()),
  relatedEntityId: v.optional(v.string()),
  confidence: v.optional(v.union(v.literal('Low'), v.literal('Medium'), v.literal('High'))),
});

function maskWebhook(url: string): string {
  if (!url) return '';
  const tail = url.slice(-6);
  return `…${tail}`;
}

function buildEmbed(payload: FanoutPayload, creatorName: string): Record<string, unknown> {
  return {
    title: payload.title,
    description: payload.description,
    color: DISCORD_BLURPLE,
    fields: payload.fields,
    url: payload.url,
    timestamp: new Date().toISOString(),
    footer: { text: `${creatorName} · DigiPicks` },
  };
}

function alertEnabled(
  rules: Doc<'discordChannelSyncs'>['alertRules'],
  eventType: DeliveryEventType,
): boolean {
  if (!rules) return true; // missing object means "all alerts on"
  switch (eventType) {
    case 'new_pick':
      return rules.newPick !== false;
    case 'pick_graded':
      return rules.pickGraded !== false;
    case 'odds_movement':
      return rules.oddsMovement !== false;
    case 'creator_live':
      return rules.creatorLive !== false;
    case 'ai_insight':
      return rules.aiInsight !== false;
    case 'announcement':
      return rules.announcement !== false;
    default:
      return true;
  }
}

function meetsMinConfidence(
  rules: Doc<'discordChannelSyncs'>['alertRules'],
  payloadConfidence: FanoutPayload['confidence'],
): boolean {
  if (!rules?.minConfidence) return true;
  if (!payloadConfidence) return true;
  const min = CONFIDENCE_RANK[rules.minConfidence] ?? 0;
  const got = CONFIDENCE_RANK[payloadConfidence] ?? 0;
  return got >= min;
}

// ─── Internal queries / mutations ───────────────────────────────────────────

export const _pickForDiscord = internalQuery({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => ctx.db.get(args.pickId),
});

export const _creatorForDiscord = internalQuery({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => ctx.db.get(args.creatorId),
});

export const _logDelivery = internalMutation({
  args: {
    integrationId: v.optional(v.id('discordIntegrations')),
    creatorId: v.optional(v.id('creators')),
    channelId: v.optional(v.string()),
    webhookUrlMasked: v.optional(v.string()),
    eventType: v.string(),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('sent'),
      v.literal('failed'),
      v.literal('retrying'),
    ),
    attemptCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    discordMessageId: v.optional(v.string()),
    deliveredAt: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<'discordDeliveryLogs'>> => {
    const id = await ctx.db.insert('discordDeliveryLogs', {
      integrationId: args.integrationId,
      creatorId: args.creatorId,
      channelId: args.channelId,
      webhookUrlMasked: args.webhookUrlMasked,
      eventType: args.eventType,
      relatedEntityType: args.relatedEntityType,
      relatedEntityId: args.relatedEntityId,
      status: args.status,
      attemptCount: args.attemptCount,
      errorMessage: args.errorMessage,
      discordMessageId: args.discordMessageId,
      deliveredAt: args.deliveredAt,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const _patchDeliveryLog = internalMutation({
  args: {
    id: v.id('discordDeliveryLogs'),
    status: v.optional(
      v.union(v.literal('pending'), v.literal('sent'), v.literal('failed'), v.literal('retrying')),
    ),
    attemptCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    discordMessageId: v.optional(v.string()),
    deliveredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const _failedDeliveries = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('discordDeliveryLogs')
      .withIndex('by_status', (q) => q.eq('status', 'failed'))
      .order('desc')
      .take(args.limit ?? 50);
    return rows.filter((r) => (r.attemptCount ?? 0) < 3);
  },
});

// ─── Fanout helpers ─────────────────────────────────────────────────────────

interface SendOk {
  ok: true;
  discordMessageId?: string;
}
interface SendErr {
  ok: false;
  error: string;
}

async function postWebhook(url: string, body: unknown): Promise<SendOk | SendErr> {
  try {
    const res = await withDiscordRetry(
      async () => {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return await ensureDiscordOk(r, 'webhook POST');
      },
      { label: 'webhook' },
    );
    // Webhooks return 204 by default; only with ?wait=true do we get a body.
    let discordMessageId: string | undefined;
    if (res.status === 200) {
      try {
        const json = (await res.json()) as { id?: string };
        if (typeof json.id === 'string') discordMessageId = json.id;
      } catch {
        // ignore — body absent or not JSON
      }
    }
    return { ok: true, discordMessageId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function postChannelMessage(
  botToken: string,
  channelId: string,
  body: unknown,
): Promise<SendOk | SendErr> {
  try {
    const res = await withDiscordRetry(
      async () => {
        const r = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        return await ensureDiscordOk(r, `channel ${channelId} message`);
      },
      { label: `channelMessage ${channelId}` },
    );
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, discordMessageId: json.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Public-shape internal action: generic outbound fanout ─────────────────

export const fanoutOutbound = internalAction({
  args: {
    creatorId: v.id('creators'),
    eventType: deliveryEventType,
    payload: fanoutPayloadValidator,
  },
  handler: async (ctx, args): Promise<{ delivered: number; failed: number }> => {
    const creator: Doc<'creators'> | null = await ctx.runQuery(
      internal.discord.delivery._creatorForDiscord,
      { creatorId: args.creatorId },
    );
    if (!creator) return { delivered: 0, failed: 0 };

    const syncs: Doc<'discordChannelSyncs'>[] = await ctx.runQuery(
      internal.discord.channels._listEnabledOutboundForCreator,
      { creatorId: args.creatorId },
    );

    const embed = buildEmbed(args.payload, creator.name);
    const messageBody = {
      username: `${creator.name} · DigiPicks`,
      embeds: [embed],
    };

    let delivered = 0;
    let failed = 0;
    const botToken = process.env.DISCORD_BOT_TOKEN;

    for (const sync of syncs) {
      if (!alertEnabled(sync.alertRules, args.eventType)) continue;
      if (!meetsMinConfidence(sync.alertRules, args.payload.confidence)) continue;

      // Reserve a delivery log row up-front so we can patch the outcome.
      const logId: Id<'discordDeliveryLogs'> = await ctx.runMutation(
        internal.discord.delivery._logDelivery,
        {
          integrationId: sync.integrationId,
          creatorId: args.creatorId,
          channelId: sync.channelId,
          eventType: args.eventType,
          relatedEntityType: args.payload.relatedEntityType,
          relatedEntityId: args.payload.relatedEntityId,
          status: 'pending',
          attemptCount: 1,
        },
      );

      let result: SendOk | SendErr;
      // Legacy stub channel: route through the creator's webhook URL.
      if (sync.channelId === 'legacy' && creator.discordWebhookUrl) {
        result = await postWebhook(creator.discordWebhookUrl, messageBody);
      } else if (botToken) {
        result = await postChannelMessage(botToken, sync.channelId, messageBody);
      } else {
        result = { ok: false, error: 'DISCORD_BOT_TOKEN missing' };
      }

      if (result.ok) {
        delivered++;
        await ctx.runMutation(internal.discord.delivery._patchDeliveryLog, {
          id: logId,
          status: 'sent',
          deliveredAt: Date.now(),
          discordMessageId: result.discordMessageId,
        });
      } else {
        failed++;
        await ctx.runMutation(internal.discord.delivery._patchDeliveryLog, {
          id: logId,
          status: 'failed',
          errorMessage: result.error.slice(0, 500),
        });
      }
    }

    return { delivered, failed };
  },
});

// ─── Pick-published delivery — preserves the legacy public surface ──────────

/**
 * POST a rich embed when a pick is published. Internal action invoked from
 * `picks.create` / `picks._publishDueScheduled`. The behavior is now layered:
 *
 *   1. Walk enabled outbound `discordChannelSyncs` for the creator. For each
 *      hit, fanoutOutbound dispatches via Bot Token (or legacy webhook if the
 *      sync row is the 'legacy' stub).
 *   2. If no syncs exist *and* `creators.discordWebhookUrl` is set, fall back
 *      to the legacy URL — preserves behavior for creators who haven't
 *      migrated yet.
 *
 * Either path writes a `discordDeliveryLogs` row (with masked URL on the
 * legacy path) and the legacy audit log entry. Errors never bubble.
 */
export const deliverPickNotification = internalAction({
  args: {
    pickId: v.id('picks'),
    creatorId: v.id('creators'),
  },
  handler: async (ctx, args) => {
    const creator: Doc<'creators'> | null = await ctx.runQuery(
      internal.discord.delivery._creatorForDiscord,
      { creatorId: args.creatorId },
    );
    if (!creator) return;
    const pick: Doc<'picks'> | null = await ctx.runQuery(
      internal.discord.delivery._pickForDiscord,
      { pickId: args.pickId },
    );
    if (!pick) return;

    const emoji = SPORT_EMOJI[pick.sport] ?? '🎯';
    const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';
    const payload: FanoutPayload = {
      title: `${emoji} ${pick.title}`,
      description: pick.teaser ?? pick.body?.slice(0, 200) ?? '',
      url: `${baseUrl}/creators/${creator.handle}`,
      fields: [
        { name: 'Sport', value: pick.sport, inline: true },
        { name: 'League', value: pick.league ?? '—', inline: true },
        { name: 'Selection', value: pick.selection ?? '—', inline: true },
        { name: 'Odds', value: pick.odds ?? '—', inline: true },
        { name: 'Confidence', value: pick.confidence ?? '—', inline: true },
        { name: 'Access', value: pick.access, inline: true },
      ],
      relatedEntityType: 'pick',
      relatedEntityId: args.pickId,
      confidence:
        pick.confidence === 'Low' || pick.confidence === 'Medium' || pick.confidence === 'High'
          ? pick.confidence
          : undefined,
    };

    // M20: when the creator has any configured outbound channel sync, the
    // parallel `fanoutOutbound` scheduler call (from picks.create) handles
    // delivery — we deliberately skip the legacy webhook to avoid double-
    // posting. This action then becomes a no-op for migrated creators and
    // continues to serve the legacy webhook fallback for everyone else.
    const syncs: Doc<'discordChannelSyncs'>[] = await ctx.runQuery(
      internal.discord.channels._listEnabledOutboundForCreator,
      { creatorId: args.creatorId },
    );
    if (syncs.length > 0) return;

    // Legacy webhook URL fallback.
    if (!creator.discordWebhookUrl) return;
    if (!creator.discordWebhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      console.warn(`deliverPickNotification: refusing non-Discord webhook for ${creator.handle}`);
      return;
    }

    const logId: Id<'discordDeliveryLogs'> = await ctx.runMutation(
      internal.discord.delivery._logDelivery,
      {
        creatorId: args.creatorId,
        webhookUrlMasked: maskWebhook(creator.discordWebhookUrl),
        eventType: 'new_pick',
        relatedEntityType: 'pick',
        relatedEntityId: args.pickId,
        status: 'pending',
        attemptCount: 1,
      },
    );

    const embed = buildEmbed(payload, creator.name);
    const result = await postWebhook(creator.discordWebhookUrl, {
      username: `${creator.name} · DigiPicks`,
      avatar_url: `${baseUrl}/favicon.svg`,
      embeds: [embed],
    });

    if (result.ok) {
      await ctx.runMutation(internal.discord.delivery._patchDeliveryLog, {
        id: logId,
        status: 'sent',
        deliveredAt: Date.now(),
        discordMessageId: result.discordMessageId,
      });
    } else {
      await ctx.runMutation(internal.discord.delivery._patchDeliveryLog, {
        id: logId,
        status: 'failed',
        errorMessage: result.error.slice(0, 500),
      });
      console.warn(`Discord webhook failed for creator ${creator.handle}: ${result.error}`);
    }

    // Preserve legacy audit-log entry (covers tests/migrations expecting it).
    await ctx.runMutation(internal.audit.log, {
      entityType: 'discord_delivery',
      entityId: args.pickId,
      action: result.ok ? 'discord.delivered' : 'discord.failed',
      metadata: { creatorId: args.creatorId, channel: 'legacy_webhook' },
    });
  },
});

/**
 * Test webhook — sends a sample embed to verify a creator's webhook URL.
 * Wraps the Discord call in `withDiscordRetry`. Distinct from the
 * `discordSettings.testWebhook` action that's exposed to the dashboard.
 */
export const testWebhook = internalAction({
  args: { webhookUrl: v.string(), creatorName: v.string() },
  handler: async (_ctx, args): Promise<{ ok: boolean; error?: string }> => {
    if (!args.webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return { ok: false, error: 'Refused: only discord.com webhooks accepted' };
    }
    const embed = {
      title: '✅ DigiPicks Webhook Test',
      description: 'Your Discord webhook is connected! Picks will appear here when you publish.',
      color: DISCORD_BLURPLE,
      fields: [
        { name: 'Creator', value: args.creatorName, inline: true },
        { name: 'Status', value: 'Connected', inline: true },
      ],
      footer: { text: 'DigiPicks · Webhook Integration' },
      timestamp: new Date().toISOString(),
    };
    const result = await postWebhook(args.webhookUrl, {
      username: `${args.creatorName} · DigiPicks`,
      embeds: [embed],
    });
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  },
});

// ─── Public surfaces ────────────────────────────────────────────────────────

/** Creator-scoped paginated delivery log feed. */
export const getDeliveryLogs = query({
  args: {
    creatorId: v.id('creators'),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);
    return await ctx.db
      .query('discordDeliveryLogs')
      .withIndex('by_creator_and_created', (q) => q.eq('creatorId', args.creatorId))
      .order('desc')
      .paginate(args.paginationOpts);
  },
});

/**
 * Retry queue cron entrypoint — finds 'failed' rows with attemptCount < 3
 * and re-fires the matching delivery. Bounded to 50 rows per run.
 */
export const retryQueue = internalAction({
  args: {},
  handler: async (ctx): Promise<{ retried: number }> => {
    const failed: Doc<'discordDeliveryLogs'>[] = await ctx.runQuery(
      internal.discord.delivery._failedDeliveries,
      { limit: 50 },
    );
    let retried = 0;
    for (const row of failed) {
      // Mark retrying first so a parallel cron doesn't duplicate.
      await ctx.runMutation(internal.discord.delivery._patchDeliveryLog, {
        id: row._id,
        status: 'retrying',
        attemptCount: (row.attemptCount ?? 0) + 1,
      });

      // For pick-related rows we can re-run deliverPickNotification.
      // Generic fanout retries are not supported in this pass — we mark
      // the row failed-permanent to avoid infinite churn.
      if (row.relatedEntityType === 'pick' && row.relatedEntityId && row.creatorId) {
        // Schedule (don't ctx.runAction same-runtime) — keeps each retry in
        // its own action invocation and within budget.
        await ctx.scheduler.runAfter(0, internal.discord.delivery.deliverPickNotification, {
          pickId: row.relatedEntityId as Id<'picks'>,
          creatorId: row.creatorId,
        });
        retried++;
      } else {
        await ctx.runMutation(internal.discord.delivery._patchDeliveryLog, {
          id: row._id,
          status: 'failed',
          errorMessage: 'retry not supported for this event type',
        });
      }
    }
    return { retried };
  },
});
