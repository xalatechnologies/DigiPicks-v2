// =============================================================================
// PII scrubbing — pure utility, no Convex deps.
//
// Strips two high-impact patterns from user-supplied copilot prompts before
// they are persisted or shipped to Anthropic:
//   - email addresses        →  [redacted-email]
//   - PAN-shaped digit runs  →  [redacted-pan]   (13-19 contiguous digits)
//
// When anything was redacted, returns a 16-hex-char SHA-256 prefix of the
// ORIGINAL body as `piiHash` so an admin investigating an abuse report can
// correlate without having the cleartext on file.
//
// Pure function — safe from any runtime that exposes `crypto.subtle`
// (Convex V8, edge-runtime, browsers, Node ≥18).
// =============================================================================

const EMAIL_RE = /\S+@\S+\.\S+/g;
const PAN_RE = /\b\d{13,19}\b/g;

export interface ScrubResult {
  body: string;
  piiHash?: string;
}

export async function scrub(body: string): Promise<ScrubResult> {
  let scrubbed = body;
  let touched = false;

  if (EMAIL_RE.test(scrubbed)) {
    scrubbed = scrubbed.replace(EMAIL_RE, '[redacted-email]');
    touched = true;
  }
  // Reset lastIndex on the global regex since we just consumed it via .test().
  EMAIL_RE.lastIndex = 0;

  if (PAN_RE.test(scrubbed)) {
    scrubbed = scrubbed.replace(PAN_RE, '[redacted-pan]');
    touched = true;
  }
  PAN_RE.lastIndex = 0;

  if (!touched) {
    return { body: scrubbed };
  }

  const piiHash = await sha256Prefix(body);
  return { body: scrubbed, piiHash };
}

async function sha256Prefix(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < bytes.length && hex.length < 16; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex.slice(0, 16);
}
