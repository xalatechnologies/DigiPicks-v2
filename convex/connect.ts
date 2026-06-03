import { v } from 'convex/values';
import { action, internalMutation, internalQuery, query } from './_generated/server';
import { internal } from './_generated/api';
import { requireCreatorOwnership } from './shared/permissions';
const STRIPE_API = 'https://api.stripe.com/v1';

async function stripeFetch(
  path: string,
  body: URLSearchParams,
  secret: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (json.error as { message?: string } | undefined)?.message ??
      `Stripe ${path} failed (${res.status})`;
    throw new Error(msg);
  }
  return json;
}

export const statusByCreator = query({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) return null;
    return {
      connectStatus: creator.connectStatus ?? 'not_started',
      stripeConnectAccountId: creator.stripeConnectAccountId,
    };
  },
});

export const _setConnectAccount = internalMutation({
  args: {
    creatorId: v.id('creators'),
    stripeConnectAccountId: v.string(),
    connectStatus: v.union(
      v.literal('not_started'),
      v.literal('pending'),
      v.literal('restricted'),
      v.literal('active'),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.creatorId, {
      stripeConnectAccountId: args.stripeConnectAccountId,
      connectStatus: args.connectStatus,
    });
  },
});

/** Start or resume Stripe Connect Express onboarding for the creator. */
export const createOnboardingLink = action({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error('STRIPE_SECRET_KEY not configured');

    await ctx.runMutation(internal.connect._assertCreatorOwner, {
      creatorId: args.creatorId,
    });

    const creator = await ctx.runQuery(internal.connect._creatorForLink, {
      creatorId: args.creatorId,
    });
    if (!creator) throw new Error('Creator not found');

    const baseUrl = process.env.WEB_BASE_URL ?? 'http://localhost:5173';
    let accountId = creator.stripeConnectAccountId;

    if (!accountId) {
      const params = new URLSearchParams();
      params.set('type', 'express');
      params.set('metadata[creatorId]', args.creatorId);
      const account = await stripeFetch('/accounts', params, secret);
      accountId = account.id as string;
      await ctx.runMutation(internal.connect._setConnectAccount, {
        creatorId: args.creatorId,
        stripeConnectAccountId: accountId,
        connectStatus: 'pending',
      });
    }

    const linkParams = new URLSearchParams();
    linkParams.set('account', accountId);
    linkParams.set('refresh_url', `${baseUrl}/dashboard/earnings/onboarding?refresh=1`);
    linkParams.set('return_url', `${baseUrl}/dashboard/earnings?connect=1`);
    linkParams.set('type', 'account_onboarding');

    const link = await stripeFetch('/account_links', linkParams, secret);
    const url = link.url as string | undefined;
    if (!url) throw new Error('Stripe did not return an onboarding URL.');
    return { url };
  },
});

export const _assertCreatorOwner = internalMutation({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    await requireCreatorOwnership(ctx, args.creatorId);
  },
});

export const _creatorForLink = internalQuery({
  args: { creatorId: v.id('creators') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.creatorId);
  },
});
