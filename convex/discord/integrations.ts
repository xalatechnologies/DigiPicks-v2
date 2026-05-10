'use node';

import { v } from 'convex/values';
import { action, internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
// integrations.ts intentionally only exports actions — V8 mutations and
// queries live in `integrationsDb.ts`.
import { exchangeAuthCode, refreshTokens, encrypt, decrypt } from './oauth';
import { withDiscordRetry, ensureDiscordOk } from './retry';

// =============================================================================
// Discord integrations — Node-side OAuth/refresh actions. The mutations and
// queries that don't need Node modules (read-only listing, pause, revoke,
// internal save) live in `convex/discord/integrationsDb.ts` so the V8 runtime
// can call them without dragging `node:crypto` in.
// =============================================================================

const DISCORD_API = 'https://discord.com/api/v10';

interface GuildChannel {
  id: string;
  name: string;
  type: number;
}

async function fetchGuildChannels(botToken: string, guildId: string): Promise<GuildChannel[]> {
  const res = await withDiscordRetry(
    async () => {
      const r = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
        headers: { Authorization: `Bot ${botToken}` },
      });
      return await ensureDiscordOk(r, `guild-channels ${guildId}`);
    },
    { label: `fetchGuildChannels ${guildId}` },
  );
  return (await res.json()) as GuildChannel[];
}

interface DiscordGuildPartial {
  id: string;
  name: string;
  icon: string | null;
}

/**
 * Fetch the user's accessible guilds via the bearer access token. Used during
 * the OAuth callback to pick the guild the bot was just installed into.
 */
async function fetchUserGuilds(accessToken: string): Promise<DiscordGuildPartial[]> {
  const res = await withDiscordRetry(
    async () => {
      const r = await fetch(`${DISCORD_API}/users/@me/guilds`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return await ensureDiscordOk(r, 'users/@me/guilds');
    },
    { label: 'fetchUserGuilds' },
  );
  return (await res.json()) as DiscordGuildPartial[];
}

/**
 * Internal action: kick off the OAuth code exchange + persist a Discord
 * integration row. Invoked by the `/discord/oauth/callback` http route
 * after CSRF state validation.
 *
 * NOT exposed as a public action — the OAuth callback already verifies
 * the creatorId via the signed state cookie, and we want a single,
 * auditable code path.
 */
export const connectGuild = internalAction({
  args: {
    creatorId: v.id('creators'),
    code: v.string(),
    redirectUri: v.string(),
    /** Optional preferred guildId — if provided, must appear in `users/@me/guilds`. */
    guildId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    integrationId: Id<'discordIntegrations'>;
    guildId: string;
    guildName: string;
  }> => {
    const tokens = await exchangeAuthCode(args.code, args.redirectUri);
    const guilds = await fetchUserGuilds(tokens.accessToken);
    const guild = args.guildId ? guilds.find((g) => g.id === args.guildId) : guilds[0];
    if (!guild) {
      throw new Error(
        'Discord guild not found in token response. Re-install the bot and try again.',
      );
    }

    const integrationId: Id<'discordIntegrations'> = await ctx.runMutation(
      internal.discord.integrationsDb._saveIntegration,
      {
        creatorId: args.creatorId,
        guildId: guild.id,
        guildName: guild.name,
        guildIconHash: guild.icon ?? undefined,
        oauthAccessTokenEnc: encrypt(tokens.accessToken),
        oauthRefreshTokenEnc: encrypt(tokens.refreshToken),
        oauthExpiresAt: tokens.expiresAt,
        scopes: tokens.scopes,
        botInstalled: true,
      },
    );

    // Best-effort channel refresh — failure here doesn't roll back the connect.
    try {
      const botToken = process.env.DISCORD_BOT_TOKEN;
      if (botToken) {
        const channels = await fetchGuildChannels(botToken, guild.id);
        await ctx.runMutation(internal.discord.integrationsDb._saveChannelInventory, {
          integrationId,
          channels: channels.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
          })),
        });
      }
    } catch (err) {
      console.warn(
        'connectGuild: channel refresh failed',
        err instanceof Error ? err.message : err,
      );
    }

    return { integrationId, guildId: guild.id, guildName: guild.name };
  },
});

/**
 * Refresh the cached channel inventory for a guild. Creator-scoped — the
 * integration row's owner (or an admin) can trigger this from the dashboard.
 */
export const refreshGuildChannels = action({
  args: { integrationId: v.id('discordIntegrations') },
  handler: async (ctx, args): Promise<{ refreshed: number }> => {
    // Ownership check + record load happen in one round-trip.
    const integration: Doc<'discordIntegrations'> | null = await ctx.runQuery(
      internal.discord.integrationsDb._getOwnedIntegration,
      { integrationId: args.integrationId },
    );
    if (!integration) {
      throw new Error('Integration not found or you do not own it');
    }
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      console.warn('refreshGuildChannels: DISCORD_BOT_TOKEN missing — skipped');
      return { refreshed: 0 };
    }

    const channels = await fetchGuildChannels(botToken, integration.guildId);
    await ctx.runMutation(internal.discord.integrationsDb._saveChannelInventory, {
      integrationId: args.integrationId,
      channels: channels.map((c) => ({ id: c.id, name: c.name, type: c.type })),
    });
    return { refreshed: channels.length };
  },
});

/**
 * Internal action used by the inbound import + outbound delivery pipelines
 * to obtain a fresh decrypted access token. Refreshes when within 60s of
 * expiry. Returns null if the integration is paused / revoked.
 */
export const _getFreshAccessToken = internalAction({
  args: { integrationId: v.id('discordIntegrations') },
  handler: async (ctx, args): Promise<string | null> => {
    const integration: Doc<'discordIntegrations'> | null = await ctx.runQuery(
      internal.discord.integrationsDb._getIntegrationById,
      { integrationId: args.integrationId },
    );
    if (!integration) return null;
    if (integration.status !== 'connected') return null;
    if (!integration.oauthAccessTokenEnc) return null;

    const expiresAt = integration.oauthExpiresAt ?? 0;
    if (expiresAt - Date.now() > 60_000) {
      return decrypt(integration.oauthAccessTokenEnc);
    }
    if (!integration.oauthRefreshTokenEnc) {
      return decrypt(integration.oauthAccessTokenEnc);
    }
    try {
      const refresh = decrypt(integration.oauthRefreshTokenEnc);
      const fresh = await refreshTokens(refresh);
      await ctx.runMutation(internal.discord.integrationsDb._updateTokens, {
        integrationId: args.integrationId,
        oauthAccessTokenEnc: encrypt(fresh.accessToken),
        oauthRefreshTokenEnc: encrypt(fresh.refreshToken),
        oauthExpiresAt: fresh.expiresAt,
        scopes: fresh.scopes,
      });
      return fresh.accessToken;
    } catch (err) {
      console.warn('discord token refresh failed', err instanceof Error ? err.message : err);
      return decrypt(integration.oauthAccessTokenEnc);
    }
  },
});
