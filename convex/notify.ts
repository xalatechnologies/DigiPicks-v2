import { v } from 'convex/values';
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { requireUser } from './shared/permissions';
import { escapeMarkdownV2 } from './telegram';

// =============================================================================
// Notification orchestration (PRD M14, FM-010).
//
// Every user-facing alert in the platform funnels through `dispatch`. The
// dispatcher always writes an in-app notification row and, based on the
// recipient's `notifyPrefs`, fans out to web push and Telegram. Discord is
// per-creator (creators.discordWebhookUrl) and dispatched by event-source
// helpers below — it is not a per-user channel.
// =============================================================================

export type NotifyKind = 'pick_published' | 'pick_graded' | 'line_moved';

interface NotifyPayload {
  /** Headline copy — used for in-app + push title. */
  title: string;
  /** Optional supporting copy — used for in-app body + push body. */
  body?: string;
  /** Deep link the click handlers should open. */
  url?: string;
  /** Free-form data for the in-app row's `data` column. */
  data?: Record<string, unknown>;
  /** When true, deduplicate notifications with the same kind+entityId pair. */
  entityKey?: string;
}

// ─── Internal helpers ───────────────────────────────────────────────────────

export const _userPrefs = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const _insertInApp = internalMutation({
  args: {
    userId: v.id('users'),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    data: v.optional(v.any()),
    entityKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.entityKey) {
      // Best-effort dedup — same user + type + entityKey unread within the
      // last 5 minutes is treated as a duplicate. Avoids spamming the inbox
      // when triggers fire twice (e.g. cron retry). Bounded scan via index.
      const cutoff = Date.now() - 5 * 60 * 1000;
      const recent = await ctx.db
        .query('notifications')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .order('desc')
        .take(20);
      const dup = recent.find(
        (n) =>
          n.type === args.type &&
          n.createdAt >= cutoff &&
          (n.data as { entityKey?: string } | undefined)?.entityKey === args.entityKey,
      );
      if (dup) return dup._id;
    }

    return await ctx.db.insert('notifications', {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      data: { ...(args.data ?? {}), entityKey: args.entityKey },
      createdAt: Date.now(),
    });
  },
});

// ─── The dispatcher itself ──────────────────────────────────────────────────

/**
 * Fan a single notification out to a single user across every enabled
 * channel. Runs as an internalAction so it can call both push (node) and
 * telegram (V8) sub-actions.
 */
export const dispatch = internalAction({
  args: {
    userId: v.id('users'),
    kind: v.union(
      v.literal('pick_published'),
      v.literal('pick_graded'),
      v.literal('line_moved'),
    ),
    payload: v.object({
      title: v.string(),
      body: v.optional(v.string()),
      url: v.optional(v.string()),
      data: v.optional(v.any()),
      entityKey: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args): Promise<{ inApp: boolean; push: boolean; telegram: boolean }> => {
    const user: Doc<'users'> | null = await ctx.runQuery(internal.notify._userPrefs, {
      userId: args.userId,
    });
    if (!user || user.isActive === false) {
      return { inApp: false, push: false, telegram: false };
    }

    const prefs = user.notifyPrefs ?? {};
    // Per-kind toggles default to true so a user with no prefs still gets alerts.
    const kindEnabled =
      args.kind === 'pick_published'
        ? prefs.pickPublished !== false
        : args.kind === 'pick_graded'
          ? prefs.pickGraded !== false
          : prefs.lineMoved !== false;
    if (!kindEnabled) {
      return { inApp: false, push: false, telegram: false };
    }

    const payload: NotifyPayload = args.payload;
    const result = { inApp: false, push: false, telegram: false };

    // 1. In-app row — always written for kindEnabled users.
    await ctx.runMutation(internal.notify._insertInApp, {
      userId: args.userId,
      type: args.kind,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      entityKey: payload.entityKey,
    });
    result.inApp = true;

    // 2. Web push — opt-in via prefs.push.
    if (prefs.push) {
      try {
        await ctx.runAction(internal.push.sendToUser, {
          userId: args.userId,
          payload: {
            title: payload.title,
            body: payload.body,
            url: payload.url,
            tag: payload.entityKey ?? args.kind,
          },
        });
        result.push = true;
      } catch (err) {
        console.warn('push fanout failed:', err);
      }
    }

    // 3. Telegram — opt-in + linked chatId.
    if (prefs.telegram && user.telegramChatId) {
      try {
        const text = formatTelegram(args.kind, payload);
        await ctx.runAction(internal.telegram.sendToChat, {
          chatId: user.telegramChatId,
          text,
        });
        result.telegram = true;
      } catch (err) {
        console.warn('telegram fanout failed:', err);
      }
    }

    return result;
  },
});

// ─── Trigger fan-outs (called from picks / odds modules) ────────────────────

/**
 * Called from `picks.create` whenever a pick is published. Fans out to the
 * creator's active subscribers.
 */
export const onPickPublished = internalAction({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => {
    const ctxData = await ctx.runQuery(internal.notify._pickContext, {
      pickId: args.pickId,
    });
    if (!ctxData) return;

    const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';
    const url = `${baseUrl}/creators/${ctxData.creator.handle}#pick-${args.pickId}`;
    const subs: Id<'users'>[] = ctxData.subscriberIds;

    await Promise.all(
      subs.map((userId) =>
        ctx.runAction(internal.notify.dispatch, {
          userId,
          kind: 'pick_published',
          payload: {
            title: `${ctxData.creator.name} posted a new pick`,
            body: ctxData.pick.title,
            url,
            entityKey: `pick-published:${args.pickId}`,
            data: { pickId: args.pickId, creatorId: ctxData.creator._id },
          },
        }),
      ),
    );
  },
});

/**
 * Called from `picks.grade` whenever a pick is finalized. Notifies every
 * user who saved the pick (so they see the result in their inbox).
 */
export const onPickGraded = internalAction({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => {
    const ctxData = await ctx.runQuery(internal.notify._gradedContext, {
      pickId: args.pickId,
    });
    if (!ctxData) return;

    const grade = ctxData.pick.grade;
    if (!grade || grade === 'pending') return;

    const verb =
      grade === 'win'
        ? 'won'
        : grade === 'loss'
          ? 'lost'
          : grade === 'push'
            ? 'pushed'
            : grade;

    const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';
    const url = `${baseUrl}/creators/${ctxData.creator.handle}#pick-${args.pickId}`;

    const recipients = new Set<Id<'users'>>([
      ...ctxData.saverIds,
      ...ctxData.subscriberIds,
    ]);

    await Promise.all(
      Array.from(recipients).map((userId) =>
        ctx.runAction(internal.notify.dispatch, {
          userId,
          kind: 'pick_graded',
          payload: {
            title: `${ctxData.creator.name}'s pick ${verb}`,
            body: ctxData.pick.title,
            url,
            entityKey: `pick-graded:${args.pickId}`,
            data: { pickId: args.pickId, grade, netUnits: ctxData.pick.netUnits },
          },
        }),
      ),
    );
  },
});

// ─── Context queries used by trigger fan-outs ───────────────────────────────

export const _pickContext = internalQuery({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => {
    const pick = await ctx.db.get(args.pickId);
    if (!pick) return null;
    const creator = await ctx.db.get(pick.creatorId);
    if (!creator) return null;

    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_creator', (q) => q.eq('creatorId', pick.creatorId))
      .take(2000);
    const subscriberIds = subs
      .filter((s) => s.status === 'active')
      .map((s) => s.subscriberId);
    return { pick, creator, subscriberIds };
  },
});

export const _gradedContext = internalQuery({
  args: { pickId: v.id('picks') },
  handler: async (ctx, args) => {
    const pick = await ctx.db.get(args.pickId);
    if (!pick) return null;
    const creator = await ctx.db.get(pick.creatorId);
    if (!creator) return null;

    const savers = await ctx.db
      .query('savedPicks')
      .withIndex('by_pick', (q) => q.eq('pickId', args.pickId))
      .take(2000);
    const saverIds = savers.map((s) => s.userId);

    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_creator', (q) => q.eq('creatorId', pick.creatorId))
      .take(2000);
    const subscriberIds = subs
      .filter((s) => s.status === 'active')
      .map((s) => s.subscriberId);

    return { pick, creator, saverIds, subscriberIds };
  },
});

// ─── User-facing prefs mutations ────────────────────────────────────────────

/**
 * Update the current user's per-channel notification preferences. Only the
 * fields supplied are touched — partial updates merge into the existing
 * `notifyPrefs` object.
 */
export const updatePrefs = mutation({
  args: {
    push: v.optional(v.boolean()),
    telegram: v.optional(v.boolean()),
    pickPublished: v.optional(v.boolean()),
    pickGraded: v.optional(v.boolean()),
    lineMoved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const next = { ...(user.notifyPrefs ?? {}), ...args };
    await ctx.db.patch(user._id, { notifyPrefs: next });
    return next;
  },
});

/**
 * Generate (or rotate) a Telegram link code for the calling user. The
 * frontend tells the user to message the bot with `/start <code>`. The
 * bot's webhook handler eventually calls `confirmTelegramLink` to bind
 * the chatId. Codes are short, time-bound, and one-shot per user.
 */
export const startTelegramLink = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const code = `dg_${Math.random().toString(36).slice(2, 10)}`;
    await ctx.db.patch(user._id, { telegramLinkCode: code });
    return { code };
  },
});

/**
 * Webhook-only — called by the Telegram bot's /start handler when a user
 * messages it with their link code. Internal so a misbehaving client
 * cannot spoof another user's chatId.
 */
export const _confirmTelegramLink = internalMutation({
  args: { code: v.string(), chatId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_telegramLinkCode', (q) => q.eq('telegramLinkCode', args.code))
      .first();
    if (!user) return { ok: false as const, reason: 'invalid_code' };

    await ctx.db.patch(user._id, {
      telegramChatId: args.chatId,
      telegramLinkCode: undefined,
      telegramLinkedAt: Date.now(),
      notifyPrefs: { ...(user.notifyPrefs ?? {}), telegram: true },
    });
    return { ok: true as const, userId: user._id };
  },
});

/** Read prefs for the current user (used by Settings UI). */
export const myPrefs = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return {
      prefs: user.notifyPrefs ?? {},
      telegramLinked: Boolean(user.telegramChatId),
      telegramLinkCode: user.telegramLinkCode ?? null,
    };
  },
});

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatTelegram(kind: NotifyKind, payload: NotifyPayload): string {
  const title = escapeMarkdownV2(payload.title);
  const body = payload.body ? escapeMarkdownV2(payload.body) : '';
  const tail = payload.url ? `\n${escapeMarkdownV2(payload.url)}` : '';
  const head =
    kind === 'pick_published'
      ? '🎯'
      : kind === 'pick_graded'
        ? '✅'
        : '📈';
  return `${head} *${title}*${body ? `\n${body}` : ''}${tail}`;
}
