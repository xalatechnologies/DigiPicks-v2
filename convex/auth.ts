import { convexAuth } from '@convex-dev/auth/server';
import { Password } from '@convex-dev/auth/providers/Password';
import Discord from '@auth/core/providers/discord';

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
      // Creating a new user — set DigiPicks defaults + Discord fields
      return ctx.db.insert('users', {
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
    },
  },
});
