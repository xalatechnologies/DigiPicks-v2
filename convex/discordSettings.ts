import { v } from 'convex/values';
import { mutation, action, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { requireCreatorOwnership } from './shared/permissions';

// =============================================================================
// Discord Settings — creator webhook URL management (dashboard)
// =============================================================================

const DISCORD_BLURPLE = 0x5865f2;

/** Internal: fetch creator for the test action. */
export const _getCreator = internalQuery({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.creatorId);
  },
});

/** Save a Discord webhook URL on the creator profile. */
export const setWebhookUrl = mutation({
  args: {
    creatorId: v.id('creators'),
    webhookUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);

    // Basic validation — Discord webhooks always start with this prefix.
    if (
      args.webhookUrl &&
      !args.webhookUrl.startsWith('https://discord.com/api/webhooks/')
    ) {
      throw new Error(
        'Invalid Discord webhook URL. It should start with https://discord.com/api/webhooks/',
      );
    }

    await ctx.db.patch(args.creatorId, {
      discordWebhookUrl: args.webhookUrl ?? undefined,
    });
    return args.creatorId;
  },
});

/**
 * Send a test embed to verify the creator's Discord webhook URL.
 * This is an action because it makes an outbound HTTP call.
 */
export const testWebhook = action({
  args: {
    creatorId: v.id('creators'),
    webhookUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.runQuery(
      internal.discordSettings._getCreator,
      { creatorId: args.creatorId },
    );
    if (!creator) throw new Error('Creator not found');

    const embed = {
      title: '\u2705 DigiPicks Webhook Test',
      description:
        'Your Discord webhook is connected! Picks will appear here when you publish.',
      color: DISCORD_BLURPLE,
      fields: [
        { name: 'Creator', value: creator.name, inline: true },
        { name: 'Status', value: 'Connected', inline: true },
      ],
      footer: { text: 'DigiPicks · Webhook Integration' },
      timestamp: new Date().toISOString(),
    };

    const body = {
      username: `${creator.name} · DigiPicks`,
      embeds: [embed],
    };

    const res = await fetch(args.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(
        `Discord webhook test failed: ${res.status} ${res.statusText}`,
      );
    }
    return { ok: true };
  },
});
