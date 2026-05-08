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
    // In production, verify the Stripe webhook signature here.
    const body = await req.json();
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
