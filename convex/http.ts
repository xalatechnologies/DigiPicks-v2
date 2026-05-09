import { httpRouter } from 'convex/server';
import { httpAction, ActionCtx } from './_generated/server';
import { internal } from './_generated/api';
import { auth } from './auth';
import type { Id } from './_generated/dataModel';

// =============================================================================
// HTTP Endpoints
// Auth routes, webhooks, and health checks
// =============================================================================

const http = httpRouter();

// ─── Convex Auth routes ──────────────────────────────────────────────────────
auth.addHttpRoutes(http);

// ─── Health Check ────────────────────────────────────────────────────────────

http.route({
  path: '/health',
  method: 'GET',
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: 'ok', ts: Date.now() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
});

// ─── Manual events seed trigger ──────────────────────────────────────────────
// POST /seed-events with `Authorization: Bearer ${SEED_TOKEN}` to populate
// the events table on demand. Runs both pollUpcoming and pollActive.
//
//   curl -X POST -H "Authorization: Bearer $SEED_TOKEN" \
//        $CONVEX_SITE_URL/seed-events
//
// Returns 401 if the token is missing or wrong.

http.route({
  path: '/seed-events',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const expected = process.env.SEED_TOKEN;
    if (!expected) {
      console.error('SEED_TOKEN not configured');
      return new Response(JSON.stringify({ error: 'not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const provided = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : '';
    if (!provided || provided !== expected) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await ctx.runAction(internal.oddsApi.pollUpcoming, {});
    await ctx.runAction(internal.liveScores.pollActive, {});

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
});

// ─── Stripe Webhook (payment events) ─────────────────────────────────────────
// Configure in Stripe Dashboard → Webhooks → Endpoint URL:
//   https://<your-site>.convex.site/stripe-webhook

http.route({
  path: '/stripe-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const signature = req.headers.get('Stripe-Signature');
    if (!signature) {
      return new Response('Missing Stripe-Signature header', { status: 400 });
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return new Response(null, { status: 500 });
    }

    // Verify signature (t= timestamp, v1= HMAC)
    const rawBody = await req.text();
    const parts = Object.fromEntries(
      signature.split(',').map((kv) => {
        const [k, v] = kv.split('=');
        return [k, v];
      }),
    );
    const signedPayload = `${parts.t}.${rawBody}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const expected = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (expected !== parts.v1) {
      return new Response('Invalid signature', { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const eventType = body.type as string;
    const obj = body.data?.object as Record<string, unknown> | undefined;

    await ctx.runMutation(internal.audit.log, {
      entityType: 'stripe_webhook',
      entityId: body.id,
      action: eventType,
      metadata: { livemode: body.livemode },
    });

    try {
      if (eventType === 'customer.subscription.created' && obj) {
        await dispatchSubscriptionUpsert(ctx, obj);
      } else if (eventType === 'customer.subscription.updated' && obj) {
        await dispatchSubscriptionUpsert(ctx, obj);
      } else if (eventType === 'customer.subscription.deleted' && obj) {
        const stripeSubscriptionId = obj.id as string | undefined;
        if (stripeSubscriptionId) {
          await ctx.runMutation(
            internal.subscriptions._cancelSubscriptionFromStripe,
            { stripeSubscriptionId },
          );
        }
      } else if (eventType === 'invoice.paid' && obj) {
        await dispatchPayout(ctx, obj);
      }
    } catch (err) {
      console.error(`Stripe webhook ${eventType} dispatch failed:`, err);
      // Still return 200 so Stripe doesn't retry on bad data — the audit
      // log captured the event, and we can replay manually if needed.
    }

    return new Response(null, { status: 200 });
  }),
});

// ─── Stripe webhook dispatch helpers ────────────────────────────────────────

async function dispatchSubscriptionUpsert(
  ctx: ActionCtx,
  obj: Record<string, unknown>,
) {
  const stripeSubscriptionId = obj.id as string | undefined;
  const stripeCustomerId = obj.customer as string | undefined;
  const status = (obj.status as string | undefined) ?? '';
  const metadata = (obj.metadata as Record<string, string> | undefined) ?? {};
  const renewsAt = (obj.current_period_end as number | undefined)
    ? (obj.current_period_end as number) * 1000
    : undefined;

  if (!stripeSubscriptionId || !stripeCustomerId) return;
  if (!metadata.creatorId || !metadata.userId || !metadata.plan) {
    // Subscription created outside our flow (e.g., manual in Stripe
    // dashboard). Skip — the audit log entry is enough trail.
    return;
  }

  const dpStatus: 'active' | 'past_due' | 'cancelled' =
    status === 'active' || status === 'trialing'
      ? 'active'
      : status === 'past_due' || status === 'unpaid'
        ? 'past_due'
        : 'cancelled';

  const plan = metadata.plan;
  if (plan !== 'free' && plan !== 'premium' && plan !== 'vip') return;

  await ctx.runMutation(
    internal.subscriptions._recordSubscriptionFromStripe,
    {
      subscriberId: metadata.userId as Id<'users'>,
      creatorId: metadata.creatorId as Id<'creators'>,
      plan,
      stripeSubscriptionId,
      stripeCustomerId,
      status: dpStatus,
      renewsAt,
    },
  );
}

async function dispatchPayout(
  ctx: ActionCtx,
  obj: Record<string, unknown>,
) {
  const stripePayoutId = obj.id as string | undefined;
  const amountPaid = obj.amount_paid as number | undefined;
  const currency = (obj.currency as string | undefined) ?? 'usd';
  const periodStart = (obj.period_start as number | undefined) ?? Math.floor(Date.now() / 1000);
  const periodEnd = (obj.period_end as number | undefined) ?? Math.floor(Date.now() / 1000);
  const subscriptionMetadata =
    ((obj.subscription_details as Record<string, unknown> | undefined)
      ?.metadata as Record<string, string> | undefined) ?? {};

  if (!stripePayoutId || amountPaid === undefined) return;
  if (!subscriptionMetadata.creatorId) {
    // Invoice not tied to a creator subscription (one-off charge, etc.).
    return;
  }

  await ctx.runMutation(internal.payouts._recordPayoutFromStripe, {
    creatorId: subscriptionMetadata.creatorId as Id<'creators'>,
    amount: amountPaid / 100, // Stripe amounts are in cents.
    currency: currency.toUpperCase(),
    status: 'paid',
    stripePayoutId,
    periodStart: periodStart * 1000,
    periodEnd: periodEnd * 1000,
    paidAt: Date.now(),
    metadata: { plan: subscriptionMetadata.plan },
  });

  // Phase 12 — referral redemption. If the originating Checkout Session
  // attached a referralCode to the subscription metadata, credit the
  // referrer with 10% of this invoice (capped at the first conversion).
  const referralCode = subscriptionMetadata.referralCode;
  if (referralCode && subscriptionMetadata.userId) {
    const payoutCents = Math.floor(amountPaid * 0.1);
    await ctx.runMutation(internal.referrals._redeem, {
      code: referralCode,
      referredUserId: subscriptionMetadata.userId as Id<'users'>,
      payoutCents,
    });
  }
}

export default http;
