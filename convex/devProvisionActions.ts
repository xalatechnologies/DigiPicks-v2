import { action, type ActionCtx } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { modifyAccountCredentials } from '@convex-dev/auth/server';
import type { Id } from './_generated/dataModel';
import {
  isProductionDeployment,
  resolveDevAdminEmail,
  resolveDevAdminPassword,
} from './shared/devAdminDefaults';
import type {
  ApproveCreatorResult,
  BootstrapAdminResult,
  SetupAdminResult,
  SetupCreatorResult,
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

async function setDevAdminPassword(ctx: ActionCtx, email: string, password: string) {
  try {
    await modifyAccountCredentials(ctx, {
      provider: 'password',
      account: { id: email, secret: password },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // First visit: no password account yet — client sign-up will create it.
    if (msg.includes('does not exist')) {
      return { passwordSet: false as const };
    }
    throw err;
  }
  return { passwordSet: true as const };
}

export const setupAdminForDev = action({
  args: {
    token: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<SetupAdminResult> => {
    assertDevToken(args.token);
    const email = normalizeEmail(args.email);

    if (args.password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    const { passwordSet } = await setDevAdminPassword(ctx, email, args.password);

    const userId: Id<'users'> = await ctx.runMutation(
      internal.devProvision.ensureAdminUserInternal,
      {
        email,
      },
    );

    return { email, passwordSet, userId };
  },
});

export const bootstrapDevAdmin = action({
  args: {},
  handler: async (ctx): Promise<BootstrapAdminResult> => {
    if (isProductionDeployment()) {
      throw new Error(
        'bootstrapDevAdmin is disabled on prod: Convex deployments. Use a dev deployment or set DEV_ADMIN_* env vars and sign in manually.',
      );
    }

    const email = resolveDevAdminEmail();
    const password = resolveDevAdminPassword();

    if (password.length < 8) {
      throw new Error('DEV_ADMIN_PASSWORD must be at least 8 characters.');
    }

    const { passwordSet } = await setDevAdminPassword(ctx, email, password);

    const userId: Id<'users'> = await ctx.runMutation(
      internal.devProvision.ensureAdminUserInternal,
      {
        email,
      },
    );

    return { email, userId, passwordSet };
  },
});

export const setupCreatorForDev = action({
  args: {
    token: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<SetupCreatorResult> => {
    assertDevToken(args.token);
    const email = normalizeEmail(args.email);

    if (args.password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    await modifyAccountCredentials(ctx, {
      provider: 'password',
      account: { id: email, secret: args.password },
    });

    const approved: ApproveCreatorResult = await ctx.runMutation(
      internal.devProvision.approveCreatorByEmailInternal,
      { email },
    );

    return { email, passwordSet: true, ...approved };
  },
});
