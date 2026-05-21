import { getAuthUserId } from '@convex-dev/auth/server';
import { internalMutation, mutation } from './_generated/server';
import { ConvexError } from 'convex/values';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireUser } from './shared/permissions';
import { isProductionDeployment, resolveDevAdminEmail } from './shared/devAdminDefaults';
import type {
  AlreadyApprovedResult,
  ApproveApplicationResult,
  ApproveCreatorResult,
} from './devProvisionTypes';

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
): Promise<ApproveApplicationResult> {
  const email = normalizeEmail(app.email);

  await ctx.db.patch(app._id, {
    status: 'approved',
    reviewNotes: 'Dev provision: auto-approved for local QA',
    reviewedAt: Date.now(),
  });

  const creatorId: Id<'creators'> = await ctx.runMutation(internal.creators.create, {
    handle: app.handle,
    name: app.name,
    avatarColor: '#1c9cf0',
    avatarMono: app.name
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    niche: app.niche,
    sports: app.sport
      .split(',')
      .map((s: string) => s.trim())
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
    status: 'approved',
  };
}

export const approveCreatorByEmailInternal = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<ApproveCreatorResult> => {
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
        const result: AlreadyApprovedResult = {
          applicationId: app._id,
          creatorId: existingUser.creatorId,
          status: 'already_approved',
        };
        return result;
      }
    }

    return approveApplicationRecord(ctx, app);
  },
});

/**
 * Dev/staging helper: approve the latest creator application for an email
 * and link the user account (same outcome as `applications.review` approved).
 */
export const approveCreatorByEmail = mutation({
  args: {
    token: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args): Promise<ApproveCreatorResult> => {
    assertDevToken(args.token);
    return ctx.runMutation(internal.devProvision.approveCreatorByEmailInternal, {
      email: args.email,
    });
  },
});

async function ensureAdminUserRecord(ctx: MutationCtx, email: string): Promise<Id<'users'>> {
  const normalized = normalizeEmail(email);
  const existing = await ctx.db
    .query('users')
    .withIndex('email', (q) => q.eq('email', normalized))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      role: 'admin',
      isActive: true,
      name: existing.name ?? 'Platform Admin',
    });
    return existing._id;
  }

  // Single legacy `users` row (no email, role `user`) — upgrade in place instead of
  // creating a second profile that fights the password auth account for admin email.
  const allUsers = await ctx.db.query('users').collect();
  if (allUsers.length === 1 && !allUsers[0].email) {
    const legacy = allUsers[0];
    await ctx.db.patch(legacy._id, {
      email: normalized,
      role: 'admin',
      isActive: true,
      name: legacy.name ?? 'Platform Admin',
      locale: legacy.locale ?? 'en',
    });
    return legacy._id;
  }

  return await ctx.db.insert('users', {
    email: normalized,
    name: 'Platform Admin',
    role: 'admin',
    isActive: true,
    locale: 'en',
  });
}

export const ensureAdminUserInternal = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<Id<'users'>> => {
    return await ensureAdminUserRecord(ctx, args.email);
  },
});

/**
 * Dev: remove duplicate `users` rows sharing the dev admin email so password auth
 * and `claimDevAdminSession` target one profile (authAccounts.userId wins).
 */
export const dedupeDevAdminUsers = mutation({
  args: {},
  handler: async (ctx) => {
    if (isProductionDeployment()) {
      throw new ConvexError({ message: 'dedupeDevAdminUsers is disabled in production' });
    }

    const email = resolveDevAdminEmail();
    const passwordAccount = await ctx.db
      .query('authAccounts')
      .filter((q) =>
        q.and(q.eq(q.field('provider'), 'password'), q.eq(q.field('providerAccountId'), email)),
      )
      .first();

    const keeperId = passwordAccount?.userId;
    const rows = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', email))
      .collect();

    let cleared = 0;
    for (const row of rows) {
      if (keeperId && row._id === keeperId) continue;
      if (row.creatorId) {
        throw new ConvexError({
          message: `Cannot dedupe: user ${row._id} has creatorId and shares ${email}.`,
        });
      }
      await ctx.db.patch(row._id, { email: undefined });
      cleared += 1;
    }

    if (keeperId) {
      await ctx.db.patch(keeperId, {
        email,
        role: 'admin',
        isActive: true,
        name: (await ctx.db.get(keeperId))?.name ?? 'Platform Admin',
      });
    }

    return { email, keeperId: keeperId ?? null, cleared, total: rows.length };
  },
});

/**
 * Dev: repoint password auth sessions/accounts to the canonical bootstrap admin user.
 * Use when Convex Auth is signed in but `users.meSafe` is null (orphan session).
 */
export const repairDevAuthLink = mutation({
  args: {},
  handler: async (ctx) => {
    if (isProductionDeployment()) {
      throw new ConvexError({ message: 'repairDevAuthLink is disabled in production' });
    }

    const sessionUserId = await getAuthUserId(ctx);
    if (!sessionUserId) {
      throw new ConvexError({
        message: 'No auth user on this request. Sign out, sign in again, then retry.',
      });
    }

    const email = resolveDevAdminEmail();
    const canonical = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', email))
      .first();
    if (!canonical) {
      throw new ConvexError({
        message: `No profile for ${email}. Run \`npx convex run devProvisionActions:bootstrapDevAdmin\` first.`,
      });
    }

    const passwordAccounts = await ctx.db
      .query('authAccounts')
      .filter((q) =>
        q.and(q.eq(q.field('provider'), 'password'), q.eq(q.field('providerAccountId'), email)),
      )
      .collect();
    for (const account of passwordAccounts) {
      if (account.userId !== canonical._id) {
        await ctx.db.patch(account._id, { userId: canonical._id });
      }
    }

    const sessions = await ctx.db.query('authSessions').collect();
    let sessionsRepointed = 0;
    for (const session of sessions) {
      if (session.userId === sessionUserId && session.userId !== canonical._id) {
        await ctx.db.patch(session._id, { userId: canonical._id });
        sessionsRepointed += 1;
      }
    }

    await ctx.db.patch(canonical._id, {
      email,
      role: 'admin',
      isActive: true,
      name: canonical.name ?? 'Platform Admin',
    });

    const orphanRow = await ctx.db.get(sessionUserId);
    if (orphanRow && sessionUserId !== canonical._id && !orphanRow.creatorId) {
      await ctx.db.patch(orphanRow._id, { email: undefined });
    }

    return {
      email,
      canonicalUserId: canonical._id,
      sessionUserId,
      sessionsRepointed,
    };
  },
});

/**
 * After dev auto sign-in at `/admin`, ensure the session user has admin role + profile.
 */
export const claimDevAdminSession = mutation({
  args: {},
  handler: async (ctx) => {
    if (isProductionDeployment()) {
      throw new ConvexError({ message: 'claimDevAdminSession is disabled in production' });
    }

    const user = await requireUser(ctx);
    const target = resolveDevAdminEmail();
    const currentEmail = user.email?.trim().toLowerCase();

    if (currentEmail && currentEmail !== target) {
      throw new ConvexError({
        message: `Signed in as ${currentEmail}, not the dev admin (${target}). Sign out, then open /admin again.`,
      });
    }

    const holder = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', target))
      .first();
    if (holder && holder._id !== user._id) {
      if (isProductionDeployment()) {
        throw new ConvexError({
          message: `Dev admin email ${target} is already linked to another user.`,
        });
      }
      // Dev: drop email from a duplicate shell row so the signed-in session can claim it.
      if (!holder.creatorId && holder.role !== 'admin') {
        await ctx.db.patch(holder._id, { email: undefined });
      } else {
        throw new ConvexError({
          message: `Dev admin email ${target} is linked to another user (${holder._id}). Remove the duplicate in Convex Data → users.`,
        });
      }
    }

    await ctx.db.patch(user._id, {
      email: target,
      name: user.name ?? 'Platform Admin',
      role: 'admin',
      isActive: true,
    });

    return { userId: user._id, email: target, role: 'admin' as const };
  },
});
