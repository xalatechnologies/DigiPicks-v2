import { convexAuth } from '@convex-dev/auth/server';
import { Password } from '@convex-dev/auth/providers/Password';
import Discord from '@auth/core/providers/discord';
import { internal } from './_generated/api';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password,
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      authorization: { params: { scope: 'identify email' } },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        // Updating existing user — persist Discord profile if available
        if (args.profile?.discordId) {
          await ctx.db.patch(args.existingUserId, {
            discordId: args.profile.discordId as string,
            discordUsername: args.profile.discordUsername as string | undefined,
          });
        }
        return args.existingUserId;
      }
      // Creating a new user — set DigiPicks defaults + Discord fields.
      const userId = await ctx.db.insert('users', {
        ...args.profile,
        role: 'user',
        isActive: true,
        locale: 'nb',
        ...(args.profile?.discordId
          ? {
              discordId: args.profile.discordId as string,
              discordUsername: args.profile.discordUsername as string | undefined,
            }
          : {}),
      });
      // Audit-log the signup inside the same transaction (BPMN-001
      // §postconditions). Direct insert keeps this self-contained — we
      // can't ctx.runMutation from the auth callback.
      await ctx.db.insert('auditLogs', {
        actorUserId: userId,
        entityType: 'user',
        entityId: userId,
        action: 'user.signup',
        metadata: {
          provider: args.profile?.discordId ? 'discord' : 'password',
          email: args.profile?.email ?? null,
        },
        createdAt: Date.now(),
      });
      // BPMN-001 — schedule the welcome dispatch. Fire-and-forget; the
      // signup completes regardless of whether welcome delivery succeeds.
      await ctx.scheduler.runAfter(0, internal.notify.onUserSignup, {
        userId,
      });
      return userId;
    },
  },
});
