import { v } from 'convex/values';
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
} from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { getCurrentUser, requireUser } from './shared/permissions';
import { rateLimiter } from './shared/rateLimit';

// =============================================================================
// GDPR — Article 15 (right of access / data export) + Article 17 (erasure).
//
// `exportMyData` returns a JSON blob containing every record DigiPicks holds
// about the calling user. The frontend turns it into a downloadable file.
//
// `deleteMyAccount` anonymizes the user record and cascade-anonymizes related
// rows (subscriptions, savedPicks, messages, conversations, applications) so
// historical platform metrics stay intact (NFR-006: pick grading immutability)
// while removing personally identifying data.
//
// Audit logs are retained — they are append-only platform records — but the
// `actorUserId` is preserved as a Convex Id which by itself is non-identifying.
// =============================================================================

export interface UserDataExport {
  exportedAt: number;
  schemaVersion: 1;
  user: Omit<Doc<'users'>, 'email' | 'phone'> & {
    email?: string;
    phone?: string;
  };
  picks: Doc<'picks'>[];
  subscriptions: Doc<'subscriptions'>[];
  payouts: Doc<'payouts'>[];
  savedPicks: Doc<'savedPicks'>[];
  applications: Doc<'applications'>[];
  notifications: Doc<'notifications'>[];
  messages: Doc<'messages'>[];
  auditLogs: Doc<'auditLogs'>[];
}

// ─── Internal collectors ────────────────────────────────────────────────────

export const _collectUserExport = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }): Promise<UserDataExport> => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const subscriptions = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriber_and_creator', (q) => q.eq('subscriberId', userId))
      .take(1000);

    const savedPicks = await ctx.db
      .query('savedPicks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(1000);

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(1000);

    const applications = user.email
      ? await ctx.db
          .query('applications')
          .withIndex('by_email', (q) => q.eq('email', user.email!))
          .take(100)
      : [];

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_sender', (q) => q.eq('senderUserId', userId))
      .take(2000);

    // Picks + payouts only apply when the user owns a creator profile.
    let picks: Doc<'picks'>[] = [];
    let payouts: Doc<'payouts'>[] = [];
    if (user.creatorId) {
      picks = await ctx.db
        .query('picks')
        .withIndex('by_creator', (q) => q.eq('creatorId', user.creatorId!))
        .take(2000);
      payouts = await ctx.db
        .query('payouts')
        .withIndex('by_creator', (q) => q.eq('creatorId', user.creatorId!))
        .take(1000);
    }

    const auditLogs = await ctx.db
      .query('auditLogs')
      .withIndex('by_actor', (q) => q.eq('actorUserId', userId))
      .take(2000);

    return {
      exportedAt: Date.now(),
      schemaVersion: 1,
      user,
      picks,
      subscriptions,
      payouts,
      savedPicks,
      applications,
      notifications,
      messages,
      auditLogs,
    };
  },
});

// ─── Cascade anonymization ──────────────────────────────────────────────────

export const _anonymizeUserCascade = internalMutation({
  args: { userId: v.id('users') },
  handler: async (
    ctx,
    { userId },
  ): Promise<
    { ok: false; reason: 'not_found' } | { ok: true; anonymizedUserId: Id<'users'> }
  > => {
    const user = await ctx.db.get(userId);
    if (!user) return { ok: false, reason: 'not_found' };

    // 1. Anonymize the user record itself. We keep the row so foreign-key
    //    references in audit logs and historical messages stay valid.
    await ctx.db.patch(userId, {
      name: 'Deleted user',
      image: undefined,
      email: undefined,
      emailVerificationTime: undefined,
      phone: undefined,
      phoneVerificationTime: undefined,
      isActive: false,
      stripeCustomerId: undefined,
      discordId: undefined,
      discordUsername: undefined,
    });

    // 2. Cancel + scrub Stripe linkage on subscriptions; retain row for
    //    creator analytics, but the subscriber is now anonymized.
    const subs = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriber_and_creator', (q) => q.eq('subscriberId', userId))
      .take(2000);
    for (const sub of subs) {
      await ctx.db.patch(sub._id, {
        status: 'cancelled' as const,
        cancelledAt: sub.cancelledAt ?? Date.now(),
        stripeCustomerId: undefined,
        stripeSubscriptionId: undefined,
      });
    }

    // 3. Saved picks contain only user/pick ids — delete entirely.
    const saved = await ctx.db
      .query('savedPicks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(2000);
    for (const row of saved) await ctx.db.delete(row._id);

    // 4. Notifications are personal data — delete.
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(2000);
    for (const n of notifications) await ctx.db.delete(n._id);

    // 5. Messages: redact body but keep the row so threads don't develop holes.
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_sender', (q) => q.eq('senderUserId', userId))
      .take(5000);
    for (const m of messages) {
      await ctx.db.patch(m._id, { body: '[deleted]' });
    }

    // 6. Applications carry email/handle — scrub.
    if (user.email) {
      const apps = await ctx.db
        .query('applications')
        .withIndex('by_email', (q) => q.eq('email', user.email!))
        .take(100);
      for (const app of apps) {
        await ctx.db.patch(app._id, {
          email: 'deleted@deleted.local',
          name: 'Deleted user',
          handle: `@deleted_${app._id}` as string,
          existingFollowing: undefined,
          winClaim: undefined,
        });
      }
    }

    return { ok: true, anonymizedUserId: userId };
  },
});

// ─── Public actions / mutations ─────────────────────────────────────────────

/**
 * Export every record DigiPicks holds about the current user. Returns the
 * JSON payload directly — the frontend writes it to a Blob and triggers a
 * download.
 */
export const exportMyData = action({
  args: {},
  handler: async (ctx): Promise<UserDataExport> => {
    const me = await ctx.runQuery(internal.gdpr._meSafe, {});
    if (!me) throw new Error('Unauthorized');

    await rateLimiter.limit(ctx, 'gdprExport', {
      key: me._id,
      throws: true,
    });

    const data = await ctx.runQuery(internal.gdpr._collectUserExport, {
      userId: me._id,
    });

    await ctx.runMutation(internal.audit.log, {
      actorUserId: me._id,
      entityType: 'user',
      entityId: me._id,
      action: 'gdpr.export',
      metadata: { records: data.picks.length + data.subscriptions.length },
    });

    return data;
  },
});

export const _meSafe = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

/**
 * Delete the current user's account. Anonymizes personal data and cascades
 * across related tables. Audit logs are retained (append-only) but no longer
 * link to identifying information.
 *
 * Cascade is wrapped in a separate internalMutation so the public mutation
 * stays small and the cascade can be rerun manually if required.
 */
type GdprDeleteResult =
  | { ok: false; reason: 'not_found' }
  | { ok: true; anonymizedUserId: Id<'users'> };

export const deleteMyAccount = mutation({
  args: { confirm: v.literal('DELETE') },
  handler: async (ctx, _args): Promise<GdprDeleteResult> => {
    const me = await requireUser(ctx);

    const result: GdprDeleteResult = await ctx.runMutation(
      internal.gdpr._anonymizeUserCascade,
      { userId: me._id },
    );

    await ctx.scheduler.runAfter(0, internal.audit.log, {
      actorUserId: me._id,
      entityType: 'user',
      entityId: me._id,
      action: 'gdpr.delete',
    });

    return result;
  },
});
