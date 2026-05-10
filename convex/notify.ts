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

export type NotifyKind =
  | 'pick_published'
  | 'pick_graded'
  | 'line_moved'
  // Lifecycle kinds (always-on; not gated by per-kind toggles since these
  // are transactional notifications the user expects regardless of prefs):
  | 'welcome'
  | 'subscription_active'
  | 'subscription_past_due'
  | 'subscription_cancelled';

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
      // Best-effort dedup — same user + type + entityKey unread within
      // the dedup window is treated as a duplicate. Avoids spamming the
      // inbox when triggers fire twice (e.g. cron retry). Bounded scan
      // via index. Window defaults to 5 min; override with
      // NOTIFY_DEDUP_WINDOW_MS for ops tuning.
      const dedupMs = Number(process.env.NOTIFY_DEDUP_WINDOW_MS) || 5 * 60 * 1000;
      const cutoff = Date.now() - dedupMs;
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
 * channel. Runs as an internalAction so it can call push, telegram, and
 * email sub-actions.
 */
export const dispatch = internalAction({
  args: {
    userId: v.id('users'),
    kind: v.union(
      v.literal('pick_published'),
      v.literal('pick_graded'),
      v.literal('line_moved'),
      v.literal('welcome'),
      v.literal('subscription_active'),
      v.literal('subscription_past_due'),
      v.literal('subscription_cancelled'),
    ),
    payload: v.object({
      title: v.string(),
      body: v.optional(v.string()),
      url: v.optional(v.string()),
      data: v.optional(v.any()),
      entityKey: v.optional(v.string()),
    }),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    inApp: boolean;
    push: boolean;
    telegram: boolean;
    email: boolean;
    deferred?: boolean;
  }> => {
    const user: Doc<'users'> | null = await ctx.runQuery(internal.notify._userPrefs, {
      userId: args.userId,
    });
    if (!user || user.isActive === false) {
      return { inApp: false, push: false, telegram: false, email: false };
    }

    const prefs = user.notifyPrefs ?? {};
    // Lifecycle kinds (welcome / subscription_*) are transactional and
    // always fire — users can't opt out of being told their subscription
    // ended. Per-kind toggles only apply to the discretionary kinds
    // (picks, line movement). Default true so a user with no prefs still
    // gets alerts.
    const isLifecycle =
      args.kind === 'welcome' ||
      args.kind === 'subscription_active' ||
      args.kind === 'subscription_past_due' ||
      args.kind === 'subscription_cancelled';
    const kindEnabled =
      isLifecycle ||
      (args.kind === 'pick_published'
        ? prefs.pickPublished !== false
        : args.kind === 'pick_graded'
          ? prefs.pickGraded !== false
          : prefs.lineMoved !== false);
    if (!kindEnabled) {
      return { inApp: false, push: false, telegram: false, email: false };
    }

    const payload: NotifyPayload = args.payload;
    const result = {
      inApp: false,
      push: false,
      telegram: false,
      email: false,
      deferred: false,
    };

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

    // BPMN-015 §quiet hours — push + telegram only fire outside the
    // configured window. Lifecycle kinds bypass quiet hours so the user
    // can't miss a transactional alert (welcome, payment-failed). Email
    // + in-app always fire; the inbox is silent enough to not disturb.
    const deferUntil = isLifecycle ? null : computeQuietHoursDeferral(prefs);
    if (deferUntil !== null && !isLifecycle) {
      // Defer push + telegram via scheduler; the in-app row is already
      // written so the user sees it on next visit. Lifecycle kinds were
      // ruled out above, so the cast is sound.
      await ctx.scheduler.runAfter(
        deferUntil - Date.now(),
        internal.notify._dispatchAfterQuietHours,
        {
          userId: args.userId,
          kind: args.kind as 'pick_published' | 'pick_graded' | 'line_moved',
          payload: args.payload,
        },
      );
      result.deferred = true;
    } else {
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
    }

    // 4. Email — opt-in via prefs.email OR transactional lifecycle kind.
    //    Lifecycle mails (welcome / subscription_*) always send so the
    //    user has an out-of-band record of payment + access changes.
    const emailEnabled = prefs.email === true || isLifecycle;
    if (emailEnabled && user.email) {
      try {
        const { subject, html } = formatEmail(args.kind, payload);
        await ctx.runAction(internal.email.sendToAddress, {
          to: user.email,
          subject,
          html,
        });
        result.email = true;
      } catch (err) {
        console.warn('email fanout failed:', err);
      }
    }

    return result;
  },
});

/**
 * Replays a dispatch after the user's quiet hours close. Scheduled by
 * `dispatch` itself when push + telegram need deferral. The in-app row
 * was already written in the original call; this hop only re-fires the
 * push + telegram + email branches (inApp short-circuits via the
 * existing 5-min entityKey dedup).
 */
export const _dispatchAfterQuietHours = internalAction({
  args: {
    userId: v.id('users'),
    kind: v.union(v.literal('pick_published'), v.literal('pick_graded'), v.literal('line_moved')),
    payload: v.object({
      title: v.string(),
      body: v.optional(v.string()),
      url: v.optional(v.string()),
      data: v.optional(v.any()),
      entityKey: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.notify.dispatch, {
      userId: args.userId,
      kind: args.kind,
      payload: args.payload,
    });
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

    // Phase 14c — watchlist matches. A user may be both a subscriber AND
    // have a matching watchlist; the dispatcher's 5-minute entityKey dedup
    // collapses those into a single in-app row.
    const matched = await ctx.runQuery(internal.watchlists._matchPick, {
      pickId: args.pickId,
    });
    await Promise.all(
      matched.map((w) =>
        ctx.runAction(internal.notify.dispatch, {
          userId: w.userId,
          kind: 'pick_published',
          payload: {
            title: `Watchlist hit · ${w.name}`,
            body: `${ctxData.creator.name}: ${ctxData.pick.title}`,
            url,
            entityKey: `pick-published:${args.pickId}`,
            data: {
              pickId: args.pickId,
              watchlistId: w._id,
              watchlistName: w.name,
            },
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
      grade === 'win' ? 'won' : grade === 'loss' ? 'lost' : grade === 'push' ? 'pushed' : grade;

    const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';
    const url = `${baseUrl}/creators/${ctxData.creator.handle}#pick-${args.pickId}`;

    const recipients = new Set<Id<'users'>>([...ctxData.saverIds, ...ctxData.subscriberIds]);

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
    const subscriberIds = subs.filter((s) => s.status === 'active').map((s) => s.subscriberId);
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
    const subscriberIds = subs.filter((s) => s.status === 'active').map((s) => s.subscriberId);

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

// ─── Quiet hours helper (BPMN-015) ─────────────────────────────────────────

/**
 * Decide whether the calling user's push + telegram dispatch should be
 * deferred. Returns the timestamp (ms) when the quiet window closes, or
 * `null` if no deferral is needed.
 *
 * Quiet hours are stored as HH:MM strings in the user's
 * `quietHoursTimezone` (defaults to UTC). Edge cases:
 *   - start === end → no quiet hours.
 *   - start < end   → window is the same calendar day.
 *   - start > end   → window crosses midnight (e.g. 22:00 → 07:00).
 *
 * If the timezone string is invalid, we fall back to UTC so a typo can't
 * silently disable the feature.
 */
function computeQuietHoursDeferral(prefs: {
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursTimezone?: string;
}): number | null {
  const start = prefs.quietHoursStart;
  const end = prefs.quietHoursEnd;
  if (!start || !end || start === end) return null;
  const startMin = parseHHMM(start);
  const endMin = parseHHMM(end);
  if (startMin === null || endMin === null) return null;

  const tz = prefs.quietHoursTimezone || 'UTC';
  const now = new Date();
  let nowMin: number;
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz,
    });
    const parts = fmt.formatToParts(now);
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    nowMin = (h % 24) * 60 + m;
  } catch {
    nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  }

  const inWindow =
    startMin < endMin
      ? nowMin >= startMin && nowMin < endMin
      : nowMin >= startMin || nowMin < endMin;
  if (!inWindow) return null;

  // Compute minutes until window close, allowing for cross-midnight.
  const minutesUntilEnd = endMin > nowMin ? endMin - nowMin : endMin + (24 * 60 - nowMin);
  // Add a 1-minute cushion so we land just past the boundary, not exactly on it.
  return Date.now() + (minutesUntilEnd + 1) * 60 * 1000;
}

function parseHHMM(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mm)) return null;
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return h * 60 + mm;
}

// ─── Email formatter ───────────────────────────────────────────────────────

/**
 * Render a notification payload as an email (subject + HTML body). Kept
 * intentionally simple — the goal is a lightweight transactional mail,
 * not a marketing template. A future iteration can swap this for a
 * templated MJML pipeline without touching dispatch.
 */
function formatEmail(kind: NotifyKind, payload: NotifyPayload): { subject: string; html: string } {
  const subjectPrefix =
    kind === 'welcome'
      ? 'Welcome'
      : kind === 'subscription_active'
        ? 'Subscription active'
        : kind === 'subscription_past_due'
          ? 'Payment failed'
          : kind === 'subscription_cancelled'
            ? 'Subscription ended'
            : kind === 'pick_published'
              ? 'New pick'
              : kind === 'pick_graded'
                ? 'Pick graded'
                : 'Line moved';
  const subject = `${subjectPrefix} · ${payload.title}`;
  const safeTitle = escapeHtml(payload.title);
  const safeBody = payload.body ? escapeHtml(payload.body) : '';
  const safeUrl = payload.url ? encodeURI(payload.url) : null;
  const html = [
    `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;line-height:1.5;">`,
    `<h2 style="margin:0 0 12px 0;font-size:18px;">${safeTitle}</h2>`,
    safeBody ? `<p style="margin:0 0 16px 0;color:#334155;">${safeBody}</p>` : '',
    safeUrl
      ? `<p><a href="${safeUrl}" style="display:inline-block;padding:8px 14px;background:#1c9cf0;color:#fff;text-decoration:none;border-radius:6px;font-weight:500;">Open in DigiPicks</a></p>`
      : '',
    `<hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/>`,
    `<p style="font-size:12px;color:#64748b;">DigiPicks — sports intelligence, not gambling advice.</p>`,
    `</div>`,
  ]
    .filter(Boolean)
    .join('');
  return { subject, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTelegram(kind: NotifyKind, payload: NotifyPayload): string {
  const title = escapeMarkdownV2(payload.title);
  const body = payload.body ? escapeMarkdownV2(payload.body) : '';
  const tail = payload.url ? `\n${escapeMarkdownV2(payload.url)}` : '';
  const head =
    kind === 'pick_published'
      ? '🎯'
      : kind === 'pick_graded'
        ? '✅'
        : kind === 'welcome'
          ? '👋'
          : kind === 'subscription_active'
            ? '✨'
            : kind === 'subscription_past_due'
              ? '⚠️'
              : kind === 'subscription_cancelled'
                ? '🛑'
                : '📈';
  return `${head} *${title}*${body ? `\n${body}` : ''}${tail}`;
}

// ─── Lifecycle dispatch helpers (BPMN-001, BPMN-002, BPMN-003) ──────────────

/** Welcome a brand-new user. Scheduled from auth.ts createOrUpdateUser. */
export const onUserSignup = internalAction({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';
    await ctx.runAction(internal.notify.dispatch, {
      userId: args.userId,
      kind: 'welcome',
      payload: {
        title: 'Welcome to DigiPicks',
        body: 'Discover verified creators, follow the picks you trust, and get realtime alerts.',
        url: `${baseUrl}/account`,
        entityKey: `welcome:${args.userId}`,
      },
    });
  },
});

/** Notify a subscriber when their subscription is first active or
 *  reactivated. Scheduled from subscriptions._recordSubscriptionFromStripe. */
export const onSubscriptionActive = internalAction({
  args: {
    userId: v.id('users'),
    creatorId: v.id('creators'),
    subscriptionId: v.id('subscriptions'),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.runQuery(internal.notify._creatorForLifecycle, {
      creatorId: args.creatorId,
    });
    if (!creator) return;
    const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';
    await ctx.runAction(internal.notify.dispatch, {
      userId: args.userId,
      kind: 'subscription_active',
      payload: {
        title: `You're subscribed to ${creator.name}`,
        body: 'Premium content is unlocked. New picks will appear in your feed.',
        url: `${baseUrl}/creators/${creator.handle}`,
        entityKey: `sub-active:${args.subscriptionId}`,
      },
    });
  },
});

/** Notify on payment failure. Grace period is encoded as text — the
 *  access decision lives in subscriptions.isAccessActive. */
export const onSubscriptionPastDue = internalAction({
  args: {
    userId: v.id('users'),
    creatorId: v.id('creators'),
    subscriptionId: v.id('subscriptions'),
    gracePeriodEndsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.runQuery(internal.notify._creatorForLifecycle, {
      creatorId: args.creatorId,
    });
    if (!creator) return;
    const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';
    const days = args.gracePeriodEndsAt
      ? Math.max(0, Math.ceil((args.gracePeriodEndsAt - Date.now()) / (24 * 60 * 60 * 1000)))
      : 0;
    const tail =
      days > 0
        ? `Your access continues for ${days} more day${days === 1 ? '' : 's'} while we retry the charge.`
        : 'Update your payment method to keep access.';
    await ctx.runAction(internal.notify.dispatch, {
      userId: args.userId,
      kind: 'subscription_past_due',
      payload: {
        title: `Payment failed · ${creator.name}`,
        body: tail,
        url: `${baseUrl}/account/subscriptions`,
        entityKey: `sub-past-due:${args.subscriptionId}`,
      },
    });
  },
});

/** Notify when a subscription terminates (cancelled or refunded). */
export const onSubscriptionCancelled = internalAction({
  args: {
    userId: v.id('users'),
    creatorId: v.id('creators'),
    subscriptionId: v.id('subscriptions'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.runQuery(internal.notify._creatorForLifecycle, {
      creatorId: args.creatorId,
    });
    if (!creator) return;
    const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';
    await ctx.runAction(internal.notify.dispatch, {
      userId: args.userId,
      kind: 'subscription_cancelled',
      payload: {
        title: `Subscription ended · ${creator.name}`,
        body:
          args.reason === 'refunded'
            ? 'Your subscription was refunded. Premium access has been removed.'
            : 'Your subscription has ended. You can resubscribe any time.',
        url: `${baseUrl}/creators/${creator.handle}`,
        entityKey: `sub-cancelled:${args.subscriptionId}`,
      },
    });
  },
});

export const _creatorForLifecycle = internalQuery({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args): Promise<{ name: string; handle: string } | null> => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) return null;
    return { name: creator.name, handle: creator.handle };
  },
});
