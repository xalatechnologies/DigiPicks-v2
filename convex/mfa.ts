import { v } from 'convex/values';
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { requireUser } from './shared/permissions';

// =============================================================================
// MFA / TOTP (PRD §11, NFR-003).
//
// Standard RFC 6238 TOTP — HMAC-SHA1 over the 30s time-counter, truncated to
// 6 digits. Compatible with Google Authenticator, 1Password, Authy, etc.
//
// Verification refreshes `mfaLastVerifiedAt` on the user. Sensitive
// mutations (creator publish, admin moderation) call `requireMfaFresh`
// to assert that the user verified within MFA_FRESHNESS_MS. A failed
// freshness check redirects the UI to re-verify before retrying.
//
// Recovery codes are one-shot strings the user copies at enrollment.
// =============================================================================

const TOTP_PERIOD_S = 30;
const TOTP_DIGITS = 6;
const MFA_FRESHNESS_MS = 15 * 60 * 1000; // 15 minutes
const RECOVERY_CODE_COUNT = 10;
const ISSUER = 'DigiPicks';

// ─── Public actions / mutations ─────────────────────────────────────────────

/**
 * Begin MFA enrollment. Generates a TOTP secret + 10 single-use recovery
 * codes, stashes the secret on the user (but not yet `mfaEnrolledAt` —
 * enrollment isn't complete until verifySetup confirms the user can
 * generate a valid code from the secret).
 */
export const enrollStart = action({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    secret: string;
    otpauthUri: string;
    recoveryCodes: string[];
  }> => {
    const me: Doc<'users'> | null = await ctx.runQuery(internal.mfa._meSafe, {});
    if (!me) throw new Error('Unauthorized');

    const secret = generateBase32Secret(20);
    const recoveryCodes = Array.from({ length: RECOVERY_CODE_COUNT }, () =>
      generateRecoveryCode(),
    );

    await ctx.runMutation(internal.mfa._stashEnrollment, {
      userId: me._id,
      secret,
      recoveryCodes,
    });

    const label = encodeURIComponent(me.email ?? me.name ?? 'user');
    const otpauthUri = `otpauth://totp/${ISSUER}:${label}?secret=${secret}&issuer=${ISSUER}&period=${TOTP_PERIOD_S}&digits=${TOTP_DIGITS}`;
    return { secret, otpauthUri, recoveryCodes };
  },
});

/** Confirm enrollment by submitting a fresh TOTP code from the user's app. */
export const verifySetup = action({
  args: { code: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    const me: Doc<'users'> | null = await ctx.runQuery(internal.mfa._meSafe, {});
    if (!me) throw new Error('Unauthorized');
    if (!me.mfaSecret) throw new Error('No MFA enrollment in progress');

    const ok = await verifyTotp(me.mfaSecret, args.code);
    if (!ok) return { ok: false };

    await ctx.runMutation(internal.mfa._completeEnrollment, { userId: me._id });
    return { ok: true };
  },
});

/** Verify a TOTP (or recovery) code. Refreshes mfaLastVerifiedAt. */
export const verify = action({
  args: { code: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean; usedRecovery?: boolean }> => {
    const me: Doc<'users'> | null = await ctx.runQuery(internal.mfa._meSafe, {});
    if (!me) throw new Error('Unauthorized');
    if (!me.mfaSecret || !me.mfaEnrolledAt) {
      throw new Error('MFA not enrolled');
    }

    const trimmed = args.code.trim().replace(/\s/g, '');

    // Recovery codes are single-use — bypass the TOTP check + consume.
    const recovery = me.mfaRecoveryCodes ?? [];
    if (recovery.includes(trimmed)) {
      await ctx.runMutation(internal.mfa._consumeRecoveryCode, {
        userId: me._id,
        code: trimmed,
      });
      return { ok: true, usedRecovery: true };
    }

    const ok = await verifyTotp(me.mfaSecret, trimmed);
    if (!ok) return { ok: false };

    await ctx.runMutation(internal.mfa._touchVerified, { userId: me._id });
    return { ok: true };
  },
});

/** Disable MFA. Requires a fresh code to prevent lockout-bypass attacks. */
export const disable = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!user.mfaEnrolledAt) return { ok: true };
    if (
      !user.mfaLastVerifiedAt ||
      Date.now() - user.mfaLastVerifiedAt > MFA_FRESHNESS_MS
    ) {
      throw new Error('Re-verify your MFA code before disabling');
    }
    void args.code; // Verification was a separate step; this is the consent step.

    await ctx.db.patch(user._id, {
      mfaSecret: undefined,
      mfaEnrolledAt: undefined,
      mfaLastVerifiedAt: undefined,
      mfaRecoveryCodes: undefined,
    });
    return { ok: true };
  },
});

/** UI status — drives the Security panel rendering. */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return {
      enrolled: Boolean(user.mfaEnrolledAt),
      enrolledAt: user.mfaEnrolledAt ?? null,
      lastVerifiedAt: user.mfaLastVerifiedAt ?? null,
      remainingRecoveryCodes: (user.mfaRecoveryCodes ?? []).length,
      fresh: isFresh(user),
    };
  },
});

// ─── Internal helpers ───────────────────────────────────────────────────────

export const _meSafe = internalQuery({
  args: {},
  handler: async (ctx): Promise<Doc<'users'> | null> => {
    const { getCurrentUser } = await import('./shared/permissions');
    return await getCurrentUser(ctx);
  },
});

export const _stashEnrollment = internalMutation({
  args: {
    userId: v.id('users'),
    secret: v.string(),
    recoveryCodes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      mfaSecret: args.secret,
      mfaRecoveryCodes: args.recoveryCodes,
      mfaEnrolledAt: undefined,
      mfaLastVerifiedAt: undefined,
    });
  },
});

export const _completeEnrollment = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.userId, {
      mfaEnrolledAt: now,
      mfaLastVerifiedAt: now,
    });
  },
});

export const _touchVerified = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { mfaLastVerifiedAt: Date.now() });
  },
});

export const _consumeRecoveryCode = internalMutation({
  args: { userId: v.id('users'), code: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    const remaining = (user.mfaRecoveryCodes ?? []).filter((c) => c !== args.code);
    await ctx.db.patch(args.userId, {
      mfaRecoveryCodes: remaining,
      mfaLastVerifiedAt: Date.now(),
    });
  },
});

// ─── Server-side gate used by sensitive mutations ───────────────────────────

function isFresh(user: Doc<'users'>): boolean {
  if (!user.mfaEnrolledAt) return false;
  if (!user.mfaLastVerifiedAt) return false;
  return Date.now() - user.mfaLastVerifiedAt <= MFA_FRESHNESS_MS;
}

/**
 * Throw unless the calling user has MFA enrolled AND verified a code in
 * the last MFA_FRESHNESS_MS. Used by creator + admin sensitive mutations.
 *
 * Safe to call from queries too (read-only).
 */
export async function requireMfaFresh(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
): Promise<void> {
  const user = await ctx.db.get(userId);
  if (!user) throw new Error('User not found');
  if (!user.mfaEnrolledAt) {
    throw new Error('MFA enrollment required');
  }
  if (!isFresh(user)) {
    throw new Error('MFA verification required — re-enter your code');
  }
}

/**
 * Soft variant — gate ONLY when the user has already enrolled in MFA. Lets
 * non-enrolled creators continue to publish; once they enroll, the gate
 * kicks in transparently. The right default for sensitive mutations
 * during the gradual MFA rollout.
 */
export async function gateOnMfaIfEnrolled(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
): Promise<void> {
  const user = await ctx.db.get(userId);
  if (!user) return;
  if (!user.mfaEnrolledAt) return;
  if (!isFresh(user)) {
    throw new Error('MFA verification required — re-enter your code');
  }
}

// ─── TOTP primitives ────────────────────────────────────────────────────────

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateBase32Secret(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i += 5) {
    const slice = bytes.slice(i, i + 5);
    let bits = 0n;
    for (let j = 0; j < slice.length; j++) {
      bits = (bits << 8n) | BigInt(slice[j]);
    }
    bits = bits << BigInt((5 - slice.length) * 8);
    for (let k = 0; k < 8; k++) {
      const idx = Number((bits >> BigInt(35 - k * 5)) & 31n);
      out += BASE32_ALPHABET[idx];
    }
  }
  return out.slice(0, Math.ceil((byteLength * 8) / 5));
}

function generateRecoveryCode(): string {
  // 4-4-4 grouped uppercase alnum, e.g. "AB12-CD34-EF56".
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    if (i === 3 || i === 6) out += '-';
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

function base32Decode(secret: string): Uint8Array {
  const clean = secret.replace(/=+$/, '').toUpperCase();
  const bits: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error('Invalid base32 char');
    for (let i = 4; i >= 0; i--) bits.push((idx >> i) & 1);
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
    bytes[i] = b;
  }
  return bytes;
}

async function totpAt(secret: string, counter: bigint): Promise<string> {
  const key = base32Decode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setBigUint64(0, counter, false);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, buf));
  const offset = sig[sig.length - 1] & 0xf;
  const code =
    ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff);
  return (code % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, '0');
}

async function verifyTotp(secret: string, code: string): Promise<boolean> {
  const trimmed = code.trim();
  if (!/^[0-9]{6}$/.test(trimmed)) return false;
  const t = BigInt(Math.floor(Date.now() / 1000 / TOTP_PERIOD_S));
  // Accept ±1 step drift to forgive clock skew.
  for (const delta of [0n, -1n, 1n]) {
    const expected = await totpAt(secret, t + delta);
    if (expected === trimmed) return true;
  }
  return false;
}
