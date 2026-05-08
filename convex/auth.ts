import { convexAuth } from '@convex-dev/auth/server';
import { Password } from '@convex-dev/auth/providers/Password';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        // Updating existing user — return as-is
        return args.existingUserId;
      }
      // Creating a new user — set DigiPicks defaults
      return ctx.db.insert('users', {
        ...args.profile,
        role: 'user',
        isActive: true,
        locale: 'nb',
      });
    },
  },
});
