import { convexAuth } from '@convex-dev/auth/server';
import { Password } from '@convex-dev/auth/providers/Password';
import { Email } from '@convex-dev/auth/providers/Email';
import Discord from '@auth/core/providers/discord';
import { internal } from './_generated/api';
import { resolveDevAdminEmail } from './shared/devAdminDefaults';

function devAdminEmailForAuth(): string | undefined {
  try {
    return resolveDevAdminEmail();
  } catch {
    return process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase();
  }
}

function profileEmail(
  profile: Record<string, unknown> | undefined,
  fallback?: string | null,
): string | undefined {
  const fromProfile = (profile?.email as string | undefined)?.trim().toLowerCase();
  if (fromProfile) return fromProfile;
  // Password provider uses account id as the email address on sign-in.
  const accountId = (profile?.id as string | undefined)?.trim().toLowerCase();
  if (accountId?.includes('@')) return accountId;
  const fromFallback = fallback?.trim().toLowerCase();
  return fromFallback || undefined;
}

function isDevAdminEmail(email: string | undefined): boolean {
  const devAdminEmail = devAdminEmailForAuth();
  return Boolean(devAdminEmail && email && email === devAdminEmail);
}

// Magic-link email provider — saved-email click on the auth page sends a
// one-click sign-in URL via Resend. Token verification is handled by
// Convex Auth; we only need to ship the link to the user. Quiet no-op
// when RESEND_API_KEY is unset (signIn just throws and the UI surfaces
// the error).
const MagicLink = Email({
  id: 'magic-link',
  // Skipping the email-equality check unlocks "magic link behavior" —
  // clicking the link signs the user in without re-entering the email.
  authorize: undefined,
  async sendVerificationRequest({ identifier: email, url }) {
    const subject = 'Your DigiPicks sign-in link';
    const safeUrl = encodeURI(url);
    const html = [
      `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;line-height:1.5;">`,
      `<h2 style="margin:0 0 12px 0;font-size:18px;">Sign in to DigiPicks</h2>`,
      `<p style="margin:0 0 16px 0;color:#334155;">Tap the button below to sign in as <strong>${email}</strong>. The link expires in 24 hours.</p>`,
      `<p><a href="${safeUrl}" style="display:inline-block;padding:10px 18px;background:#1c9cf0;color:#fff;text-decoration:none;border-radius:6px;font-weight:500;">Sign in</a></p>`,
      `<p style="font-size:12px;color:#64748b;margin-top:24px;">If the button doesn't work, paste this URL into your browser:<br><code style="word-break:break-all;">${safeUrl}</code></p>`,
      `<hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/>`,
      `<p style="font-size:12px;color:#64748b;">If you didn't request this email, you can ignore it — the link will expire on its own.</p>`,
      `</div>`,
    ].join('');
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) {
      console.warn('Magic-link email skipped — RESEND_API_KEY / RESEND_FROM_EMAIL not configured');
      throw new Error('Email sign-in is not enabled in this environment.');
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ from, to: email, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => `${res.status}`);
      console.warn(`Magic-link send failed for ${email}: ${err}`);
      throw new Error('Could not send sign-in email. Please try again.');
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password,
    MagicLink,
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      authorization: { params: { scope: 'identify email' } },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        const existing = await ctx.db.get(args.existingUserId);
        const email = profileEmail(
          args.profile as Record<string, unknown> | undefined,
          existing?.email,
        );
        const patch: Record<string, unknown> = {};
        if (args.profile?.discordId) {
          patch.discordId = args.profile.discordId as string;
          patch.discordUsername = args.profile.discordUsername as string | undefined;
        }
        if (email && !existing?.email) {
          patch.email = email;
        }
        if (isDevAdminEmail(email)) {
          patch.role = 'admin';
          patch.name = existing?.name ?? 'Platform Admin';
          patch.isActive = true;
          if (!existing?.email) {
            patch.email = devAdminEmailForAuth();
          }
        }
        if (Object.keys(patch).length > 0) {
          await ctx.db.patch(args.existingUserId, patch);
        }
        return args.existingUserId;
      }
      const email = profileEmail(args.profile as Record<string, unknown> | undefined);
      const role = isDevAdminEmail(email) ? 'admin' : 'user';
      const devAdmin = isDevAdminEmail(email);
      const profile = args.profile as Record<string, unknown> | undefined;

      // Reuse an existing profile for this email (dev bootstrap, migrations).
      if (email) {
        const holder = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('email'), email))
          .first();
        if (holder) {
          const patch: Record<string, unknown> = { isActive: true };
          if (devAdmin) {
            patch.role = 'admin';
            patch.name = holder.name ?? 'Platform Admin';
          }
          if (Object.keys(patch).length > 0) {
            await ctx.db.patch(holder._id, patch);
          }
          return holder._id;
        }
      }

      // Creating a new user — set DigiPicks defaults + Discord fields (no legacy spread).
      const userId = await ctx.db.insert('users', {
        name: (profile?.name as string | undefined) ?? (devAdmin ? 'Platform Admin' : undefined),
        image: profile?.image as string | undefined,
        ...(email ? { email } : {}),
        emailVerificationTime: profile?.emailVerificationTime as number | undefined,
        phone: profile?.phone as string | undefined,
        phoneVerificationTime: profile?.phoneVerificationTime as number | undefined,
        isAnonymous: profile?.isAnonymous as boolean | undefined,
        role,
        isActive: true,
        locale: devAdmin ? 'en' : 'nb',
        ...(profile?.discordId
          ? {
              discordId: profile.discordId as string,
              discordUsername: profile.discordUsername as string | undefined,
            }
          : {}),
      });
      // Audit-log the signup inside the same transaction (BPMN-001
      // §postconditions). Direct insert keeps this self-contained — we
      // can't ctx.runMutation from the auth callback.
      await ctx.db.insert('auditLogs', {
        actorUserId: userId,
        entityType: 'user',
        entityId: String(userId),
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
      // BPMN-001 — Password signups send an email-verification link.
      // Discord OAuth signups skip this; Discord vouches for the email.
      // Fire-and-forget; quiet no-op when RESEND_API_KEY is unset.
      if (!args.profile?.discordId && args.profile?.email) {
        await ctx.scheduler.runAfter(0, internal.emailVerification._initiate, {
          userId,
        });
      }
      return userId;
    },
  },
});
