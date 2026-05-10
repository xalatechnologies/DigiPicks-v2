'use node';

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

// =============================================================================
// Discord OAuth + signature helpers. All exports are PLAIN HELPERS — none
// register a Convex function. Only Node actions in `convex/discord/*` import
// from this module (it pulls in `node:crypto`).
//
// Required env vars (every one is documented; missing crypto key throws):
//   - DISCORD_CLIENT_ID         OAuth app client id (public)
//   - DISCORD_CLIENT_SECRET     OAuth app client secret (server-side)
//   - DISCORD_PUBLIC_KEY        Ed25519 public key from the Discord app
//   - DISCORD_OAUTH_ENC_KEY     32-byte hex (or 64 hex chars) — symmetric key
//                               for AES-256-GCM token encryption at rest
//
// All token blobs we persist on `discordIntegrations.oauthAccessTokenEnc` /
// `oauthRefreshTokenEnc` are produced by `encrypt` here and read back via
// `decrypt`. We never read these tokens from a Convex query — only from
// Node actions, where this file is `"use node";`-imported.
// =============================================================================

const DISCORD_OAUTH_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const TOKEN_ENC_VERSION = 'v1';

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface ExchangedTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
}

function getEncKey(): Buffer {
  const raw = process.env.DISCORD_OAUTH_ENC_KEY;
  if (!raw) {
    throw new Error(
      'DISCORD_OAUTH_ENC_KEY not configured — Discord token encryption is unavailable.',
    );
  }
  // Accept hex (preferred, 64 chars = 32 bytes) or base64.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) {
    throw new Error('DISCORD_OAUTH_ENC_KEY must decode to exactly 32 bytes (hex or base64).');
  }
  return buf;
}

/**
 * Encrypt a plaintext token with AES-256-GCM. Output format:
 *   `${version}:${iv_b64}:${tag_b64}:${ct_b64}`
 * IV is 12 bytes (GCM standard); tag is 16 bytes.
 */
export function encrypt(plaintext: string): string {
  const key = getEncKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    TOKEN_ENC_VERSION,
    iv.toString('base64'),
    tag.toString('base64'),
    ct.toString('base64'),
  ].join(':');
}

/** Decrypt a value produced by `encrypt`. Throws on tampering / wrong key. */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 4 || parts[0] !== TOKEN_ENC_VERSION) {
    throw new Error('discord oauth token: unknown ciphertext format');
  }
  const [, ivB64, tagB64, ctB64] = parts;
  const key = getEncKey();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString('utf8');
}

/** Stable sha-256 hex (full 64 chars). */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

// ─── OAuth flow helpers ─────────────────────────────────────────────────────

function requireOAuthCreds(): { clientId: string; clientSecret: string } {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'Discord OAuth not configured — set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.',
    );
  }
  return { clientId, clientSecret };
}

/** Exchange an authorization code for access+refresh tokens. */
export async function exchangeAuthCode(
  code: string,
  redirectUri: string,
): Promise<ExchangedTokens> {
  const { clientId, clientSecret } = requireOAuthCreds();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(DISCORD_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord token exchange failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as DiscordTokenResponse;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
    scopes: json.scope ? json.scope.split(' ') : [],
  };
}

/** Refresh an access token using the stored refresh token. */
export async function refreshTokens(refreshToken: string): Promise<ExchangedTokens> {
  const { clientId, clientSecret } = requireOAuthCreds();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const res = await fetch(DISCORD_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord token refresh failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as DiscordTokenResponse;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
    scopes: json.scope ? json.scope.split(' ') : [],
  };
}

// ─── Signature verification (Ed25519) ──────────────────────────────────────

function hexToUint8Array(hex: string): Uint8Array<ArrayBuffer> {
  if (hex.length % 2 !== 0) throw new Error('odd-length hex');
  const buf = new ArrayBuffer(hex.length / 2);
  const out = new Uint8Array(buf);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

/**
 * Verify a Discord interaction signature using Ed25519. We use the WebCrypto
 * subtle API which is available in the Node runtime since Node 18. Returns
 * `true` only on a valid signature; never throws on a malformed signature
 * (returns false instead — keeps the http handler simple).
 */
export async function verifyDiscordSignature(
  signatureHex: string,
  timestamp: string,
  rawBody: string,
  publicKeyHex: string,
): Promise<boolean> {
  try {
    const sig = hexToUint8Array(signatureHex);
    const pub = hexToUint8Array(publicKeyHex);
    const msg = new TextEncoder().encode(timestamp + rawBody);

    // Try WebCrypto Ed25519 first (Node 20+ + modern runtimes).
    const subtle = (globalThis.crypto as Crypto | undefined)?.subtle;
    if (subtle && typeof subtle.importKey === 'function') {
      try {
        const key = await subtle.importKey('raw', pub, { name: 'Ed25519' }, false, ['verify']);
        return await subtle.verify({ name: 'Ed25519' }, key, sig, msg);
      } catch {
        // Fall through to node:crypto.verify below.
      }
    }

    // Fallback: node:crypto direct verify with a SubjectPublicKeyInfo
    // wrapper around the raw 32-byte public key. The DER prefix below is
    // the fixed Ed25519 SPKI header — concat with the raw key bytes.
    const { createPublicKey, verify } = await import('node:crypto');
    const spkiPrefix = Buffer.from('302a300506032b6570032100', 'hex');
    const der = Buffer.concat([spkiPrefix, Buffer.from(pub)]);
    const keyObj = createPublicKey({ key: der, format: 'der', type: 'spki' });
    return verify(null, Buffer.from(msg), keyObj, Buffer.from(sig));
  } catch (err) {
    console.warn('verifyDiscordSignature: failed', err instanceof Error ? err.message : err);
    return false;
  }
}
