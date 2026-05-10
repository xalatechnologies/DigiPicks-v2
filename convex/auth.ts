import { convexAuth } from '@convex-dev/auth/server';
import { Password } from '@convex-dev/auth/providers/Password';
import { Email } from '@convex-dev/auth/providers/Email';
import Discord from '@auth/core/providers/discord';
import { internal } from './_generated/api';

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
