import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { auth } from './auth';

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

    await ctx.runMutation(internal.audit.log, {
      entityType: 'stripe_webhook',
      entityId: body.id,
      action: eventType,
      metadata: { livemode: body.livemode },
    });

    return new Response(null, { status: 200 });
  }),
});

export default http;
