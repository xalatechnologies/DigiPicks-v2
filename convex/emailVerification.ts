import { v } from 'convex/values';
import { internalAction, mutation } from './_generated/server';
import { internal } from './_generated/api';
import { requireUser } from './shared/permissions';
import { rateLimiter } from './shared/rateLimit';

// =============================================================================
// Email verification (BPMN-001 §postconditions).
//
// Flow:
//   1. Signup callback schedules `_initiate` for the new user.
//   2. `_initiate` generates a random token, hashes it (sha-256), patches
//      the user's `emailVerificationTokenHash` + `emailVerificationExpiresAt`,
//      and sends the user a verification link via Resend.
//   3. User clicks the link → frontend calls `confirm({ token })` which
//      validates the hash + expiry and stamps `emailVerificationTime`.
//
// The plaintext token never lives in the database — only its hash. A
// leaked DB row can't be turned into a one-click takeover.
//
// Required env vars (already used by email.ts):
//   - RESEND_API_KEY        re_…
//   - RESEND_FROM_EMAIL     "DigiPicks <hello@…>" (or RESEND_VERIFY_FROM)
//   - WEB_BASE_URL          base URL for the verification deep link
//
// Quiet no-op when RESEND_API_KEY is absent — signup still works; users
// just won't get the verification mail. The schema retains
// `emailVerificationTime` so admins can see the unverified state.
// =============================================================================

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateToken(): string {
  // 32 bytes → 64 hex chars. Web Crypto is available in V8.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Schedule a verification email for the user. Used by the signup
 *  callback and by the public `requestVerification` mutation. */
export const _initiate = internalAction({
  args: { userId: v.id('users') },
  handler: async (ctx, args): Promise<{ ok: boolean; reason?: string }> => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Quiet no-op — signup completes; admins can re-trigger once Resend
      // is configured.
      return { ok: false, reason: 'not-configured' };
    }
    const user = await ctx.runQuery(internal.users.meSafeById, {
      userId: args.userId,
    });
    if (!user || !user.email) {
      return { ok: false, reason: 'no-email' };
    }
    if (user.emailVerificationTime) {
      return { ok: false, reason: 'already-verified' };
    }

    const token = generateToken();
    const tokenHash = await sha256Hex(token);
    const expiresAt = Date.now() + TOKEN_TTL_MS;

    await ctx.runMutation(internal.emailVerification._stampToken, {
      userId: args.userId,
      tokenHash,
      expiresAt,
    });

    const baseUrl = process.env.WEB_BASE_URL ?? 'https://app.digipicks.com';
    const verifyUrl = `${baseUrl}/auth/verify?token=${encodeURIComponent(token)}`;
    const safeUrl = encodeURI(verifyUrl);

    const html = [
      `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;line-height:1.5;">`,
      `<h2 style="margin:0 0 12px 0;font-size:18px;">Confirm your DigiPicks email</h2>`,
      `<p style="margin:0 0 16px 0;color:#334155;">Tap the button below to verify your address. The link expires in 24 hours.</p>`,
      `<p><a href="${safeUrl}" style="display:inline-block;padding:10px 18px;background:#1c9cf0;color:#fff;text-decoration:none;border-radius:6px;font-weight:500;">Verify email</a></p>`,
      `<p style="font-size:12px;color:#64748b;margin-top:24px;">If the button doesn't work, paste this URL into your browser:<br><code style="word-break:break-all;">${safeUrl}</code></p>`,
      `<hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/>`,
      `<p style="font-size:12px;color:#64748b;">If you didn't sign up for DigiPicks, ignore this email — the link will expire on its own.</p>`,
      `</div>`,
    ].join('');

    await ctx.runAction(internal.email.sendToAddress, {
      to: user.email,
      subject: 'Confirm your DigiPicks email',
      html,
      from: process.env.RESEND_VERIFY_FROM,
    });
    return { ok: true };
  },
});

import { internalMutation } from './_generated/server';

export const _stampToken = internalMutation({
  args: {
    userId: v.id('users'),
    tokenHash: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      emailVerificationTokenHash: args.tokenHash,
      emailVerificationSentAt: Date.now(),
      emailVerificationExpiresAt: args.expiresAt,
    });
    return null;
  },
});

/**
 * Public — current user requests a fresh verification email. Rate-
 * limited so an attacker (or an angry user) can't spam Resend.
 */
export const requestVerification = mutation({
  args: {},
  handler: async (ctx): Promise<{ ok: boolean; reason?: string }> => {
    const user = await requireUser(ctx);
    if (!user.email) return { ok: false, reason: 'no-email' };
    if (user.emailVerificationTime) {
      return { ok: false, reason: 'already-verified' };
    }
    // Reuse the application-submit bucket — same shape (3/min), same
    // anti-abuse profile.
    await rateLimiter.limit(ctx, 'applicationsSubmit', {
      key: user._id,
      throws: true,
    });
    await ctx.scheduler.runAfter(0, internal.emailVerification._initiate, {
      userId: user._id,
    });
    return { ok: true };
  },
});

/**
 * Public — user landed on /auth/verify?token=… and we validate it.
 * Idempotent: a re-click after success returns ok without re-stamping.
 */
export const confirm = mutation({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean; reason?: string }> => {
    const trimmed = args.token.trim();
    if (!trimmed) return { ok: false, reason: 'missing-token' };
    const tokenHash = await sha256Hex(trimmed);
    const user = await ctx.db
      .query('users')
      .withIndex('by_emailVerificationTokenHash', (q) =>
        q.eq('emailVerificationTokenHash', tokenHash),
      )
      .first();
    if (!user) return { ok: false, reason: 'invalid-token' };
    if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < Date.now()) {
      return { ok: false, reason: 'expired' };
    }

    await ctx.db.patch(user._id, {
      emailVerificationTime: Date.now(),
      emailVerificationTokenHash: undefined,
      emailVerificationSentAt: undefined,
      emailVerificationExpiresAt: undefined,
    });
    return { ok: true };
  },
});
