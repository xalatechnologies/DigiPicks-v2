import { httpRouter } from 'convex/server';
import { httpAction, ActionCtx } from './_generated/server';
import { internal } from './_generated/api';
import { auth } from './auth';
import type { Id } from './_generated/dataModel';

// =============================================================================
// Discord OAuth + Interactions routes (M20).
//
// These three endpoints together cover the inbound surface:
//   - GET  /discord/oauth/start    bot install + identify scope redirect
//   - POST /discord/oauth/callback exchange code → connectGuild action
//   - POST /discord/interactions   verify Ed25519, queue event, ack ≤3s
// =============================================================================

/** sha-256 → hex; uses Web Crypto so this works in the V8 httpAction runtime. */
async function sha256HexHttp(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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
          await ctx.runMutation(internal.subscriptions._cancelSubscriptionFromStripe, {
            stripeSubscriptionId,
          });
        }
      } else if (eventType === 'invoice.paid' && obj) {
        await dispatchPayout(ctx, obj);
      } else if (
        (eventType === 'charge.refunded' ||
          eventType === 'invoice.refunded' ||
          eventType === 'invoice.voided') &&
        obj
      ) {
        // Phase 14e — refund handling. Stripe surfaces the original
        // subscription via different paths depending on the event type;
        // we accept either subscription or invoice.subscription as the
        // reference and flip our local row to 'refunded'.
        await dispatchRefund(ctx, obj);
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

async function dispatchSubscriptionUpsert(ctx: ActionCtx, obj: Record<string, unknown>) {
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

  await ctx.runMutation(internal.subscriptions._recordSubscriptionFromStripe, {
    subscriberId: metadata.userId as Id<'users'>,
    creatorId: metadata.creatorId as Id<'creators'>,
    plan,
    stripeSubscriptionId,
    stripeCustomerId,
    status: dpStatus,
    renewsAt,
  });
}

async function dispatchRefund(ctx: ActionCtx, obj: Record<string, unknown>) {
  const stripeSubscriptionId =
    (obj.subscription as string | undefined) ??
    ((obj.lines as { data?: Array<{ subscription?: string }> } | undefined)?.data?.[0]
      ?.subscription as string | undefined);
  if (!stripeSubscriptionId) return;

  await ctx.runMutation(internal.subscriptions._updateSubscriptionStatusFromStripe, {
    stripeSubscriptionId,
    status: 'refunded',
  });
}

async function dispatchPayout(ctx: ActionCtx, obj: Record<string, unknown>) {
  const stripePayoutId = obj.id as string | undefined;
  const amountPaid = obj.amount_paid as number | undefined;
  const currency = (obj.currency as string | undefined) ?? 'usd';
  const periodStart = (obj.period_start as number | undefined) ?? Math.floor(Date.now() / 1000);
  const periodEnd = (obj.period_end as number | undefined) ?? Math.floor(Date.now() / 1000);
  const subscriptionMetadata =
    ((obj.subscription_details as Record<string, unknown> | undefined)?.metadata as
      | Record<string, string>
      | undefined) ?? {};

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

  // Phase 16d — bump the coupon redemption counter so admin-issued
  // promo caps fire. Stripe is the source of truth for the actual
  // discount; this mirror tracks platform-side issuance against caps.
  const couponCode = subscriptionMetadata.couponCode;
  if (couponCode) {
    await ctx.runMutation(internal.coupons._incrementRedemption, {
      code: couponCode,
    });
  }
}

// ─── Discord — OAuth start (302) ────────────────────────────────────────────
//
// GET /discord/oauth/start?creatorId=<creatorId>
//
// Builds the Discord authorize URL (scopes: bot, applications.commands,
// identify, guilds), sets a CSRF state cookie, and 302s. We embed the
// creatorId in the state so the callback knows which profile is connecting.

http.route({
  path: '/discord/oauth/start',
  method: 'GET',
  handler: httpAction(async (_ctx, req) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      return new Response('DISCORD_CLIENT_ID not configured', { status: 500 });
    }
    const url = new URL(req.url);
    const creatorId = url.searchParams.get('creatorId') ?? '';
    if (!creatorId) {
      return new Response('creatorId is required', { status: 400 });
    }

    const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';
    const redirectUri =
      process.env.DISCORD_OAUTH_REDIRECT_URI ??
      `${process.env.CONVEX_SITE_URL ?? baseUrl}/discord/oauth/callback`;

    // 16 random bytes hex → state token
    const stateBytes = new Uint8Array(16);
    crypto.getRandomValues(stateBytes);
    const stateNonce = Array.from(stateBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const statePayload = `${stateNonce}.${creatorId}`;

    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'bot applications.commands identify guilds');
    authUrl.searchParams.set('state', statePayload);
    // permissions=274877959168 is "View Channels + Send Messages + Manage
    // Webhooks" — minimum for outbound posting + thread reads.
    authUrl.searchParams.set('permissions', '274877959168');

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
        'Set-Cookie': `dp_discord_state=${statePayload}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax; Secure`,
      },
    });
  }),
});

// ─── Discord — OAuth callback ───────────────────────────────────────────────
//
// POST /discord/oauth/callback (Discord redirects here as GET; we accept
// either method). Validates the state cookie, schedules the connect action,
// and 302s back to the dashboard with a status query param.

const oauthCallback = httpAction(async (ctx, req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  if (!code || !stateParam) {
    return new Response('missing code/state', { status: 400 });
  }

  const cookieHeader = req.headers.get('Cookie') ?? '';
  const stateCookie = cookieHeader
    .split(';')
    .map((s) => s.trim())
    .find((c) => c.startsWith('dp_discord_state='))
    ?.slice('dp_discord_state='.length);
  if (!stateCookie || stateCookie !== stateParam) {
    return new Response('state mismatch', { status: 400 });
  }
  const [, creatorId] = stateParam.split('.');
  if (!creatorId) {
    return new Response('state malformed', { status: 400 });
  }

  const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';
  const redirectUri =
    process.env.DISCORD_OAUTH_REDIRECT_URI ??
    `${process.env.CONVEX_SITE_URL ?? baseUrl}/discord/oauth/callback`;

  // Schedule the connect action — don't block the redirect on the token
  // exchange so the UX is snappy. The dashboard polls listForCreator after
  // it lands and will see the new integration row when it's persisted.
  await ctx.scheduler.runAfter(0, internal.discord.integrations.connectGuild, {
    creatorId: creatorId as Id<'creators'>,
    code,
    redirectUri,
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${baseUrl}/dashboard/settings/discord?status=pending`,
      'Set-Cookie': 'dp_discord_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure',
    },
  });
});

http.route({ path: '/discord/oauth/callback', method: 'GET', handler: oauthCallback });
http.route({ path: '/discord/oauth/callback', method: 'POST', handler: oauthCallback });

// ─── Discord — Interactions (signed) ────────────────────────────────────────
//
// POST /discord/interactions — Discord signs every request with Ed25519.
// Reject unsigned/invalid with 401. Respond with `{type:1}` to PING (type=1)
// per Discord spec. For all other interaction types: insert webhook event
// row, schedule processIncomingEvent, respond with deferred-ack `{type:5}`.
// Must complete in ≤3s — do not perform heavy work inline.

http.route({
  path: '/discord/interactions',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const publicKey = process.env.DISCORD_PUBLIC_KEY;
    if (!publicKey) {
      return new Response('DISCORD_PUBLIC_KEY not configured', { status: 500 });
    }

    const signature = req.headers.get('X-Signature-Ed25519') ?? '';
    const timestamp = req.headers.get('X-Signature-Timestamp') ?? '';
    if (!signature || !timestamp) {
      return new Response('missing signature headers', { status: 401 });
    }

    const rawBody = await req.text();

    // Verify Ed25519 in the V8 runtime via Web Crypto.
    const valid = await verifyEd25519FromHttp(signature, timestamp, rawBody, publicKey);
    if (!valid) {
      return new Response('invalid signature', { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return new Response('invalid JSON', { status: 400 });
    }

    // Discord PING — must be answered quickly with type=1.
    if (body.type === 1) {
      return new Response(JSON.stringify({ type: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Queue + schedule processing. Errors here are swallowed so the 3s
    // ack budget is respected — the audit log captures the request.
    try {
      const eventId = (body.id as string | undefined) ?? `${timestamp}-${signature.slice(0, 16)}`;
      const eventType = mapInteractionType(body);
      const guildId = body.guild_id as string | undefined;
      const channelId =
        ((body as { channel_id?: string }).channel_id as string | undefined) ??
        ((body as { channel?: { id?: string } }).channel?.id as string | undefined);
      const payloadHash = await sha256HexHttp(rawBody);

      const recorded = await ctx.runMutation(internal.discord.events._recordWebhookEvent, {
        discordEventId: eventId,
        eventType,
        guildId,
        channelId,
        payloadHash,
      });
      if (recorded.id && !recorded.deduped) {
        // Best-effort scheduling. If processIncomingEvent fails it'll mark
        // the event row with processingError on its own.
        const threadInfo = eventType === 'THREAD_CREATE' ? extractThreadInfo(body) : undefined;
        await ctx.scheduler.runAfter(0, internal.discord.events.processIncomingEvent, {
          eventId: recorded.id,
          payload: threadInfo,
        });
      }
    } catch (err) {
      console.error('discord interactions enqueue failed:', err);
    }

    // Deferred acknowledgement — Discord shows a "thinking" indicator and
    // we have 15min to follow up via the interaction webhook.
    return new Response(JSON.stringify({ type: 5 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
});

function mapInteractionType(body: Record<string, unknown>): string {
  const t = body.type;
  if (t === 2) return 'APPLICATION_COMMAND';
  if (t === 3) return 'MESSAGE_COMPONENT';
  if (t === 5) return 'MODAL_SUBMIT';
  // For non-interaction event payloads (gateway events forwarded), `t` is a
  // string event name (e.g. "MESSAGE_CREATE", "THREAD_CREATE").
  if (typeof t === 'string') return t;
  return 'INTERACTION_UNKNOWN';
}

function extractThreadInfo(body: Record<string, unknown>): {
  threadId?: string;
  threadName?: string;
  channelId?: string;
  guildId?: string;
} {
  const thread =
    (body.thread as Record<string, unknown> | undefined) ??
    (body.data as Record<string, unknown> | undefined);
  return {
    threadId: thread?.id as string | undefined,
    threadName: thread?.name as string | undefined,
    channelId: thread?.parent_id as string | undefined,
    guildId: body.guild_id as string | undefined,
  };
}

/**
 * Ed25519 verify in the V8 runtime via Web Crypto. Returns false on any
 * failure path so the http handler can reply 401 cleanly.
 */
async function verifyEd25519FromHttp(
  signatureHex: string,
  timestamp: string,
  rawBody: string,
  publicKeyHex: string,
): Promise<boolean> {
  try {
    if (signatureHex.length % 2 !== 0 || publicKeyHex.length % 2 !== 0) return false;
    const sig = new Uint8Array(signatureHex.length / 2);
    for (let i = 0; i < sig.length; i++) {
      sig[i] = Number.parseInt(signatureHex.substr(i * 2, 2), 16);
    }
    const pub = new Uint8Array(publicKeyHex.length / 2);
    for (let i = 0; i < pub.length; i++) {
      pub[i] = Number.parseInt(publicKeyHex.substr(i * 2, 2), 16);
    }
    const msg = new TextEncoder().encode(timestamp + rawBody);
    const key = await crypto.subtle.importKey('raw', pub, { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify({ name: 'Ed25519' }, key, sig, msg);
  } catch (err) {
    console.warn('verifyEd25519FromHttp failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

export default http;
