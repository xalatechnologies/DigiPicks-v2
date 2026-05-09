'use node';

import webpush from 'web-push';
import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { internal } from './_generated/api';

// =============================================================================
// Web Push delivery (VAPID) — node-only action.
//
// Required env vars:
//   - VAPID_PUBLIC_KEY    URL-safe base64 public key
//   - VAPID_PRIVATE_KEY   URL-safe base64 private key
//   - VAPID_SUBJECT       mailto: or https:// origin (e.g. mailto:ops@digipicks.com)
//
// Generate locally with: `npx web-push generate-vapid-keys`
// =============================================================================

function configureVapid() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new Error('VAPID_* env vars not configured');
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

/**
 * Send a push notification to every endpoint registered for the user.
 * Endpoints that return 404/410 are auto-unsubscribed via
 * `internal.pushSubscriptions._removeEndpoint`. Other failures are logged.
 *
 * Quiet no-op when VAPID env is missing — keeps dev environments clean.
 */
export const sendToUser = internalAction({
  args: {
    userId: v.id('users'),
    payload: v.object({
      title: v.string(),
      body: v.optional(v.string()),
      url: v.optional(v.string()),
      tag: v.optional(v.string()),
      data: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args): Promise<{ sent: number; removed: number }> => {
    if (!process.env.VAPID_SUBJECT) {
      return { sent: 0, removed: 0 };
    }
    configureVapid();

    const subs = await ctx.runQuery(
      internal.pushSubscriptions._subscriptionsForUser,
      { userId: args.userId },
    );
    if (subs.length === 0) return { sent: 0, removed: 0 };

    const body = JSON.stringify(args.payload);
    let sent = 0;
    let removed = 0;

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await ctx.runMutation(
            internal.pushSubscriptions._removeEndpoint,
            { endpoint: sub.endpoint },
          );
          removed++;
        } else {
          console.warn(
            `web-push delivery failed for user ${args.userId} (status ${status ?? '?'}):`,
            err instanceof Error ? err.message : err,
          );
        }
      }
    }

    return { sent, removed };
  },
});
