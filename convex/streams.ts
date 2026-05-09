import { v } from 'convex/values';
import {
  mutation,
  query,
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { requireCreatorOwnership } from './shared/permissions';
import { withRetry } from './shared/retry';

// =============================================================================
// Streams (PRD M13, Phase 10) — creator-set stream metadata + live status
// detection via Twitch / YouTube / Kick APIs.
//
// Cron `pollStreams` runs every 5 minutes. Each platform check is wrapped
// in withRetry + try/catch so one bad creator never breaks the rest. When
// a creator transitions offline → live, the central notify dispatcher
// fans an alert to subscribers (FM-010).
//
// Required env vars (all optional — missing creds skip that platform):
//   - TWITCH_CLIENT_ID         oauth client id
//   - TWITCH_APP_ACCESS_TOKEN  app access token (server-to-server)
//   - YOUTUBE_API_KEY          public Data API v3 key
//   (Kick public API needs no key.)
// =============================================================================

export const setStream = mutation({
  args: {
    creatorId: v.id('creators'),
    platform: v.optional(
      v.union(v.literal('twitch'), v.literal('youtube'), v.literal('kick')),
    ),
    handle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);

    await ctx.db.patch(args.creatorId, {
      streamPlatform: args.platform,
      streamHandle: args.handle,
      // Reset live state — the next poll cycle will re-detect.
      streamLive: false,
      streamWentLiveAt: undefined,
    });
    return args.creatorId;
  },
});

/** Public — read live state for a creator. Used by HeroLivePanel + CreatorDetail. */
export const getLiveState = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const c = await ctx.db.get(args.creatorId);
    if (!c) return null;
    return {
      platform: c.streamPlatform ?? null,
      handle: c.streamHandle ?? null,
      live: Boolean(c.streamLive),
      wentLiveAt: c.streamWentLiveAt ?? null,
      title: c.streamTitle ?? null,
      viewerCount: c.streamViewerCount ?? null,
      lastCheckedAt: c.streamLastCheckedAt ?? null,
    };
  },
});

/** Public — list of all currently-live creators (HeroLivePanel feed). */
export const liveNow = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query('creators').take(500);
    return rows
      .filter((c) => c.streamLive)
      .slice(0, args.limit ?? 12);
  },
});

// ─── Internal helpers used by the polling cron ─────────────────────────────

export const _creatorsWithStreamHandle = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('creators').take(2000);
    return rows.filter((c) => c.streamPlatform && c.streamHandle);
  },
});

export const _setLiveState = internalMutation({
  args: {
    creatorId: v.id('creators'),
    live: v.boolean(),
    title: v.optional(v.string()),
    viewerCount: v.optional(v.number()),
    wentLive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      streamLive: args.live,
      streamLastCheckedAt: Date.now(),
      streamTitle: args.title,
      streamViewerCount: args.viewerCount,
    };
    if (args.wentLive) patch.streamWentLiveAt = Date.now();
    if (!args.live) {
      patch.streamTitle = undefined;
      patch.streamViewerCount = undefined;
    }
    await ctx.db.patch(args.creatorId, patch);
  },
});

/**
 * Phase 14g — ensure a stream-linked channel exists for the creator and
 * activate it. Idempotent: re-runs are no-ops when the channel is already
 * present + active. Called from fanLiveNotification when a creator
 * transitions offline → live.
 */
export const _ensureStreamRoom = internalMutation({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args): Promise<{ channelId: Id<'channels'> } | null> => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) return null;

    const existing = await ctx.db
      .query('channels')
      .withIndex('by_linkedStream', (q) =>
        q.eq('linkedStreamCreatorId', args.creatorId),
      )
      .first();

    if (existing) {
      if (!existing.isActive) {
        await ctx.db.patch(existing._id, { isActive: true });
      }
      return { channelId: existing._id };
    }

    const slug = `live-${creator.handle.replace(/^@/, '')}`;
    const channelId = await ctx.db.insert('channels', {
      creatorId: args.creatorId,
      slug,
      name: `${creator.name} · Live room`,
      description: 'Open while the creator is live.',
      type: 'public',
      access: 'public',
      isActive: true,
      linkedStreamCreatorId: args.creatorId,
      memberCount: 0,
      createdAt: Date.now(),
    });
    return { channelId };
  },
});

// ─── Polling action ─────────────────────────────────────────────────────────

interface LiveResult {
  live: boolean;
  title?: string;
  viewerCount?: number;
}

export const pollStreams = internalAction({
  args: {},
  handler: async (ctx) => {
    const creators: Doc<'creators'>[] = await ctx.runQuery(
      internal.streams._creatorsWithStreamHandle,
      {},
    );
    if (creators.length === 0) return { checked: 0 };

    let wentLive = 0;
    let stillLive = 0;
    let offline = 0;

    for (const c of creators) {
      const handle = c.streamHandle;
      if (!handle) continue;
      let result: LiveResult = { live: false };
      try {
        if (c.streamPlatform === 'twitch') result = await checkTwitch(handle);
        else if (c.streamPlatform === 'youtube') result = await checkYouTube(handle);
        else if (c.streamPlatform === 'kick') result = await checkKick(handle);
      } catch (err) {
        console.warn(`stream poll failed for ${c.handle}:`, err instanceof Error ? err.message : err);
        continue;
      }

      const wasLive = Boolean(c.streamLive);
      const transitionedLive = result.live && !wasLive;

      await ctx.runMutation(internal.streams._setLiveState, {
        creatorId: c._id,
        live: result.live,
        title: result.title,
        viewerCount: result.viewerCount,
        wentLive: transitionedLive,
      });

      if (transitionedLive) {
        wentLive++;
        // Notify subscribers — same dispatcher used for picks.
        await ctx.runAction(internal.streams.fanLiveNotification, {
          creatorId: c._id,
        });
      } else if (result.live) {
        stillLive++;
      } else {
        offline++;
      }
    }

    console.log(
      `pollStreams: ${creators.length} checked · ${wentLive} went live · ${stillLive} still live · ${offline} offline`,
    );
    return { checked: creators.length, wentLive, stillLive, offline };
  },
});

/** Fan a live-start alert to every active subscriber of the creator. */
export const fanLiveNotification = internalAction({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const ctxData = await ctx.runQuery(internal.streams._liveContext, {
      creatorId: args.creatorId,
    });
    if (!ctxData) return;

    // Spin up (or reactivate) the stream-linked community room so the
    // notification deep-link has somewhere to land.
    await ctx.runMutation(internal.streams._ensureStreamRoom, {
      creatorId: args.creatorId,
    });

    const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';
    const url = `${baseUrl}/creators/${ctxData.creator.handle}`;

    await Promise.all(
      ctxData.subscriberIds.map((userId: Id<'users'>) =>
        ctx.runAction(internal.notify.dispatch, {
          userId,
          kind: 'pick_published',
          payload: {
            title: `${ctxData.creator.name} is live now`,
            body: ctxData.creator.streamTitle ?? 'Tap to watch the stream',
            url,
            entityKey: `creator-live:${args.creatorId}:${ctxData.creator.streamWentLiveAt ?? 0}`,
          },
        }),
      ),
    );
  },
});

export const _liveContext = internalQuery({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) return null;
    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_creator', (q) => q.eq('creatorId', args.creatorId))
      .take(2000);
    return {
      creator,
      subscriberIds: subs
        .filter((s) => s.status === 'active')
        .map((s) => s.subscriberId),
    };
  },
});

// ─── Per-platform live checks ───────────────────────────────────────────────

async function checkTwitch(login: string): Promise<LiveResult> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const token = process.env.TWITCH_APP_ACCESS_TOKEN;
  if (!clientId || !token) return { live: false };

  const url = `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(login)}`;
  const res = await withRetry(
    () =>
      fetch(url, {
        headers: {
          'Client-Id': clientId,
          Authorization: `Bearer ${token}`,
        },
      }),
    { label: `twitch ${login}` },
  );
  if (!res.ok) return { live: false };
  const json = (await res.json()) as {
    data?: Array<{ title?: string; viewer_count?: number; type?: string }>;
  };
  const stream = json.data?.[0];
  if (!stream || stream.type !== 'live') return { live: false };
  return {
    live: true,
    title: stream.title,
    viewerCount: stream.viewer_count,
  };
}

async function checkYouTube(handleOrChannelId: string): Promise<LiveResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { live: false };

  // YouTube Data API search?part=snippet&channelId=&eventType=live&type=video
  // The handle stored on creators may be a channel id (UC...) OR a vanity
  // handle (@name). Vanity handles need a separate channels?forHandle lookup
  // which costs +1 quota — skip if we already have a UC id.
  let channelId = handleOrChannelId;
  if (!channelId.startsWith('UC')) {
    const channelLookup = await withRetry(
      () =>
        fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handleOrChannelId)}&key=${apiKey}`,
        ),
      { label: `yt forHandle ${handleOrChannelId}` },
    );
    if (!channelLookup.ok) return { live: false };
    const lookupJson = (await channelLookup.json()) as {
      items?: Array<{ id?: string }>;
    };
    const found = lookupJson.items?.[0]?.id;
    if (!found) return { live: false };
    channelId = found;
  }

  const res = await withRetry(
    () =>
      fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`,
      ),
    { label: `yt search ${channelId}` },
  );
  if (!res.ok) return { live: false };
  const json = (await res.json()) as {
    items?: Array<{ snippet?: { title?: string } }>;
  };
  const item = json.items?.[0];
  if (!item) return { live: false };
  return { live: true, title: item.snippet?.title };
}

async function checkKick(slug: string): Promise<LiveResult> {
  // Kick's public API: GET https://kick.com/api/v2/channels/{slug}
  const url = `https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`;
  const res = await withRetry(() => fetch(url), { label: `kick ${slug}` });
  if (!res.ok) return { live: false };
  const json = (await res.json()) as {
    livestream?: {
      is_live?: boolean;
      session_title?: string;
      viewer_count?: number;
    } | null;
  };
  const ls = json.livestream;
  if (!ls?.is_live) return { live: false };
  return {
    live: true,
    title: ls.session_title,
    viewerCount: ls.viewer_count,
  };
}
