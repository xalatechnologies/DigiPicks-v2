import { v } from 'convex/values';
import { internalAction, internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import { withDiscordRetry, ensureDiscordOk } from './retry';

// =============================================================================
// Discord inbound — fetch recent messages from configured inbound/two_way
// channels, summarize via Anthropic Haiku, and persist hashed-author rows.
//
// V8 runtime: hashing uses Web Crypto (`crypto.subtle.digest`) so this file
// stays out of the Node bundle (and out of the way of mutations + queries).
//
// Privacy: we NEVER store raw Discord author IDs or raw message content. The
// `authorHash` column is sha-256 of `${authorId}:${DISCORD_AUTHOR_SALT}`,
// truncated to the first 16 hex chars. The `contentSummary` column gets the
// model's 1-sentence neutral abstract; if the AI key is missing we skip the
// summary altogether (rawContentStored stays `false`).
//
// Quiet no-op when DISCORD_BOT_TOKEN is missing — matches oddsApi pattern.
// =============================================================================

const DISCORD_API = 'https://discord.com/api/v10';
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const MESSAGES_PER_RUN = 50;

const SUMMARY_SYSTEM_PROMPT = [
  'You are a privacy-respecting summarizer. Each input is a short Discord message',
  'from a community channel. Output ONE neutral sentence (≤140 chars) that',
  'captures the gist + sentiment. Do NOT quote names, handles, or @-mentions.',
  'Do NOT speculate. Do NOT prefix the output. Just the sentence.',
].join(' ');

interface DiscordMessage {
  id: string;
  content: string;
  author?: { id?: string };
  timestamp: string;
  reactions?: Array<{ count?: number }>;
}

async function authorHashOf(authorId: string): Promise<string> {
  const salt = process.env.DISCORD_AUTHOR_SALT ?? '';
  const data = new TextEncoder().encode(`${authorId}:${salt}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 16);
}

async function fetchRecentMessages(
  botToken: string,
  channelId: string,
  afterId: string | undefined,
): Promise<DiscordMessage[]> {
  const url = new URL(`${DISCORD_API}/channels/${channelId}/messages`);
  url.searchParams.set('limit', String(MESSAGES_PER_RUN));
  if (afterId) url.searchParams.set('after', afterId);

  const res = await withDiscordRetry(
    async () => {
      const r = await fetch(url, {
        headers: { Authorization: `Bot ${botToken}` },
      });
      return await ensureDiscordOk(r, `channel ${channelId} messages`);
    },
    { label: `messages ${channelId}` },
  );
  return (await res.json()) as DiscordMessage[];
}

async function summarize(content: string, apiKey: string): Promise<string | null> {
  const truncated = content.slice(0, 800);
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 80,
      system: [
        {
          type: 'text',
          text: SUMMARY_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: truncated }],
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = json.content?.find((b) => b.type === 'text')?.text?.trim();
  return text && text.length > 0 ? text.slice(0, 280) : null;
}

interface ImportRecord {
  integrationId: Id<'discordIntegrations'>;
  channelSyncId?: Id<'discordChannelSyncs'>;
  channelId: string;
  threadId?: string;
  discordMessageId: string;
  authorHash: string;
  contentSummary?: string;
  reactionCount?: number;
  createdAtDiscord?: number;
  linkedEntityType?: string;
  linkedEntityId?: string;
}

/**
 * Bulk-insert (deduped) Discord message imports. Each row is keyed by
 * `discordMessageId` — duplicates are silently skipped. Patches the parent
 * `discordChannelSyncs` row with `lastImportedAt` so the next cron run can
 * pick a sane "after" cursor.
 */
export const _recordImports = internalMutation({
  args: {
    rows: v.array(
      v.object({
        integrationId: v.id('discordIntegrations'),
        channelSyncId: v.optional(v.id('discordChannelSyncs')),
        channelId: v.string(),
        threadId: v.optional(v.string()),
        discordMessageId: v.string(),
        authorHash: v.string(),
        contentSummary: v.optional(v.string()),
        reactionCount: v.optional(v.number()),
        createdAtDiscord: v.optional(v.number()),
        linkedEntityType: v.optional(v.string()),
        linkedEntityId: v.optional(v.string()),
      }),
    ),
    channelSyncId: v.id('discordChannelSyncs'),
  },
  handler: async (ctx, args): Promise<{ inserted: number }> => {
    const now = Date.now();
    let inserted = 0;
    for (const row of args.rows) {
      const dup = await ctx.db
        .query('discordMessageImports')
        .withIndex('by_messageId', (q) => q.eq('discordMessageId', row.discordMessageId))
        .first();
      if (dup) continue;

      await ctx.db.insert('discordMessageImports', {
        integrationId: row.integrationId,
        channelSyncId: row.channelSyncId,
        channelId: row.channelId,
        threadId: row.threadId,
        discordMessageId: row.discordMessageId,
        authorHash: row.authorHash,
        contentSummary: row.contentSummary,
        rawContentStored: false,
        linkedEntityType: row.linkedEntityType,
        linkedEntityId: row.linkedEntityId,
        reactionCount: row.reactionCount,
        createdAtDiscord: row.createdAtDiscord,
        importedAt: now,
      });
      inserted++;
    }
    await ctx.db.patch(args.channelSyncId, { lastImportedAt: now });
    return { inserted };
  },
});

/**
 * Import recent messages from every enabled inbound (or two_way) channel.
 *
 * Caps each channel at MESSAGES_PER_RUN (50) per invocation so a busy guild
 * never blows the action budget. Quiet no-op without DISCORD_BOT_TOKEN.
 */
export const importEnabledChannels = internalAction({
  args: {},
  handler: async (ctx): Promise<{ skipped?: string; channels?: number; imported?: number }> => {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) return { skipped: 'no_bot_token' };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const syncs: Doc<'discordChannelSyncs'>[] = await ctx.runQuery(
      internal.discord.channels._listEnabledInbound,
      {},
    );
    if (syncs.length === 0) return { channels: 0, imported: 0 };

    let imported = 0;
    for (const sync of syncs) {
      try {
        const messages = await fetchRecentMessages(botToken, sync.channelId, undefined);
        if (messages.length === 0) continue;

        const records: ImportRecord[] = [];
        for (const msg of messages.slice(0, MESSAGES_PER_RUN)) {
          if (!msg.author?.id || !msg.content) continue;
          const reactionCount = (msg.reactions ?? []).reduce((acc, r) => acc + (r.count ?? 0), 0);
          let summary: string | null = null;
          if (apiKey) {
            try {
              summary = await summarize(msg.content, apiKey);
            } catch (err) {
              console.warn('discord summarize failed:', err instanceof Error ? err.message : err);
            }
          }
          records.push({
            integrationId: sync.integrationId,
            channelSyncId: sync._id,
            channelId: sync.channelId,
            discordMessageId: msg.id,
            authorHash: await authorHashOf(msg.author.id),
            contentSummary: summary ?? undefined,
            reactionCount,
            createdAtDiscord: Date.parse(msg.timestamp) || undefined,
            linkedEntityType: sync.linkedEntityType,
            linkedEntityId: sync.linkedEntityId,
          });
        }
        if (records.length === 0) continue;
        const result = await ctx.runMutation(internal.discord.inbound._recordImports, {
          rows: records,
          channelSyncId: sync._id,
        });
        imported += result.inserted;
      } catch (err) {
        console.warn(
          `discord inbound channel ${sync.channelId} failed:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
    return { channels: syncs.length, imported };
  },
});
