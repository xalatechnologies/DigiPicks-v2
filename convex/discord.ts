import { internalAction, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

// =============================================================================
// Discord Webhook Notifications — outbound pick delivery to creator Discord
// channels. Fire-and-forget: errors are logged, never re-thrown.
//
// The webhook URL is stored per-creator on creators.discordWebhookUrl and
// configured via the creator dashboard Settings page.
// =============================================================================

// Brand color: Discord blurple
const DISCORD_BLURPLE = 0x5865f2;

// Sport emoji map for Discord embeds
const SPORT_EMOJI: Record<string, string> = {
  Soccer: '\u26bd',
  Cricket: '\ud83c\udfd0',
  Tennis: '\ud83c\udfbe',
  Football: '\ud83c\udfc8',
  Basketball: '\ud83c\udfc0',
  Baseball: '\u26be',
  Hockey: '\ud83c\udfd2',
  MMA: '\ud83e\udd4a',
  Rugby: '\ud83c\udfc9',
};

export const _pickForDiscord = internalQuery({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.pickId);
  },
});

export const _creatorForDiscord = internalQuery({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.creatorId);
  },
});

/**
 * POST a rich embed to a creator's Discord webhook URL whenever a pick
 * is published. Called via scheduler from picks.create.
 *
 * Idempotent — safe to retry. Errors are logged, never thrown.
 */
export const deliverPickNotification = internalAction({
  args: {
    pickId: v.id('picks'),
    creatorId: v.id('creators'),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.runQuery(internal.discord._creatorForDiscord, {
      creatorId: args.creatorId,
    });
    if (!creator?.discordWebhookUrl) return;

    const pick = await ctx.runQuery(internal.discord._pickForDiscord, {
      pickId: args.pickId,
    });
    if (!pick) return;

    const emoji = SPORT_EMOJI[pick.sport] ?? '\ud83c\udfaf';
    const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';

    const embed = {
      title: `${emoji} ${pick.title}`,
      description: pick.teaser ?? pick.body?.slice(0, 200) ?? '',
      color: DISCORD_BLURPLE,
      fields: [
        { name: 'Sport', value: pick.sport, inline: true },
        { name: 'League', value: pick.league ?? '—', inline: true },
        { name: 'Selection', value: pick.selection ?? '—', inline: true },
        { name: 'Odds', value: pick.odds ?? '—', inline: true },
        { name: 'Confidence', value: pick.confidence ?? '—', inline: true },
        { name: 'Access', value: pick.access, inline: true },
      ],
      footer: {
        text: `${creator.name} · DigiPicks`,
      },
      timestamp: new Date().toISOString(),
      url: `${baseUrl}/creators/${creator.handle}`,
    };

    const body = {
      username: `${creator.name} · DigiPicks`,
      avatar_url: `${baseUrl}/favicon.svg`,
      embeds: [embed],
    };

    try {
      const res = await fetch(creator.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.warn(
          `Discord webhook failed for creator ${creator.handle}: ${res.status} ${res.statusText}`,
        );
      } else {
        console.log(
          `Discord webhook delivered for pick ${args.pickId} to ${creator.handle}`,
        );
      }
    } catch (err) {
      console.error(
        `Discord webhook error for creator ${creator.handle}:`,
        err,
      );
    }
  },
});

/**
 * Test webhook — sends a sample embed to verify the creator's webhook URL
 * is valid. Called from the dashboard Settings page.
 */
export const testWebhook = internalAction({
  args: {
    webhookUrl: v.string(),
    creatorName: v.string(),
  },
  handler: async (ctx, args) => {
    const embed = {
      title: '\u2705 DigiPicks Webhook Test',
      description:
        'Your Discord webhook is connected! Picks will appear here when you publish.',
      color: DISCORD_BLURPLE,
      fields: [
        { name: 'Creator', value: args.creatorName, inline: true },
        { name: 'Status', value: 'Connected', inline: true },
      ],
      footer: { text: 'DigiPicks · Webhook Integration' },
      timestamp: new Date().toISOString(),
    };

    const body = {
      username: `${args.creatorName} · DigiPicks`,
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
