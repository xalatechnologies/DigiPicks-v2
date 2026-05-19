import { action, internalMutation, mutation } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { modifyAccountCredentials } from '@convex-dev/auth/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

function assertDevToken(token: string) {
  const expected = process.env.DEV_PROVISION_TOKEN;
  if (!expected || token !== expected) {
    throw new Error('Forbidden: invalid or missing DEV_PROVISION_TOKEN');
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function findApplicationByEmail(ctx: MutationCtx, email: string) {
  const normalized = normalizeEmail(email);
  const exact = await ctx.db
    .query('applications')
    .withIndex('by_email', (q) => q.eq('email', normalized))
    .order('desc')
    .first();
  if (exact) return exact;

  const apps = await ctx.db.query('applications').collect();
  return (
    apps
      .filter((a) => a.email.trim().toLowerCase() === normalized)
      .sort((a, b) => b.submittedAt - a.submittedAt)[0] ?? null
  );
}

async function approveApplicationRecord(
  ctx: MutationCtx,
  app: {
    _id: Id<'applications'>;
    handle: string;
    name: string;
    niche: string;
    sport: string;
    email: string;
  },
) {
  const email = normalizeEmail(app.email);

  await ctx.db.patch(app._id, {
    status: 'approved',
    reviewNotes: 'Dev provision: auto-approved for local QA',
    reviewedAt: Date.now(),
  });

  const creatorId = await ctx.runMutation(internal.creators.create, {
    handle: app.handle,
    name: app.name,
    avatarColor: '#1c9cf0',
    avatarMono: app.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    niche: app.niche,
    sports: app.sport
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    bio: `${app.niche} creator`,
    startingPrice: 29,
    tags: [app.sport, app.niche],
    status: 'active',
  });

  const applicant = await ctx.db
    .query('users')
    .withIndex('email', (q) => q.eq('email', email))
    .first();

  if (applicant) {
    await ctx.db.patch(applicant._id, {
      creatorId,
      role: 'user',
    });
  }

  return {
    applicationId: app._id,
    creatorId,
    userId: applicant?._id ?? null,
    status: 'approved' as const,
  };
}

export const approveCreatorByEmailInternal = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const app = await findApplicationByEmail(ctx, email);

    if (!app) {
      throw new Error(
        `No application for ${email}. Complete /apply in the app first (account + form).`,
      );
    }

    if (app.status === 'approved') {
      const existingUser = await ctx.db
        .query('users')
        .withIndex('email', (q) => q.eq('email', email))
        .first();
      if (existingUser?.creatorId) {
        return {
          applicationId: app._id,
          creatorId: existingUser.creatorId,
          status: 'already_approved' as const,
        };
      }
    }

    return approveApplicationRecord(ctx, app);
  },
});

/**
 * Dev/staging helper: approve the latest creator application for an email
 * and link the user account (same outcome as `applications.review` approved).
 *
 * Set Convex env `DEV_PROVISION_TOKEN`, then:
 *   npx convex run devProvision:approveCreatorByEmail \
 *     '{"token":"…","email":"wahid@xala.no"}'
 */
export const approveCreatorByEmail = mutation({
  args: {
    token: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    assertDevToken(args.token);
    return ctx.runMutation(internal.devProvision.approveCreatorByEmailInternal, {
      email: args.email,
    });
  },
});

/**
 * Dev/staging: set password, approve application, link creatorId — one step.
 *
 *   npx convex env set DEV_PROVISION_TOKEN "<secret>"
 *   npx convex run devProvision:setupCreatorForDev \
 *     '{"token":"<secret>","email":"wahid@xala.no","password":"WahidDigiPicks2026!"}'
 */
export const setupCreatorForDev = action({
  args: {
    token: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    assertDevToken(args.token);
    const email = normalizeEmail(args.email);

    if (args.password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    await modifyAccountCredentials(ctx, {
      provider: 'password',
      account: { id: email, secret: args.password },
    });

    const approved = await ctx.runMutation(internal.devProvision.approveCreatorByEmailInternal, {
      email,
    });

    return { email, passwordSet: true, ...approved };
  },
});
