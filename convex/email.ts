import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { withRetry } from './shared/retry';

// =============================================================================
// Email channel — Resend transactional sender (BPMN-015 §per-user fanout).
//
// V8 runtime, raw fetch. Used by:
//   - notify.dispatch         email branch of the per-user fanout
//   - auth.sendVerificationEmail  Password provider verify hook
//
// Required env vars:
//   - RESEND_API_KEY     re_… (set via `npx convex env set`)
//   - RESEND_FROM_EMAIL  e.g. "DigiPicks <hello@example.com>"
//
// Quiet no-op when either is missing — matches the pattern used by
// oddsApi / streams / push / telegram so missing creds never block the
// dispatch chain.
// =============================================================================

const RESEND_API = 'https://api.resend.com/emails';

interface ResendResponse {
  id?: string;
  error?: { message?: string; name?: string };
}

export const sendToAddress = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    /** HTML body — required. Plain-text fallback is auto-derived if `text` is absent. */
    html: v.string(),
    text: v.optional(v.string()),
    /** Optional override of RESEND_FROM_EMAIL — useful for verification mails
     *  that should originate from a `noreply@` sub-address. */
    from: v.optional(v.string()),
  },
  handler: async (
    _ctx,
    args,
  ): Promise<{ ok: true; id?: string } | { ok: false; reason: string }> => {
    const apiKey = process.env.RESEND_API_KEY;
    const defaultFrom = process.env.RESEND_FROM_EMAIL;
    if (!apiKey) {
      console.log('RESEND_API_KEY not set — skipping email dispatch');
      return { ok: false, reason: 'not-configured' };
    }
    const from = args.from ?? defaultFrom;
    if (!from) {
      console.warn('RESEND_FROM_EMAIL not set and no override provided');
      return { ok: false, reason: 'no-from' };
    }

    // Defensive: do not blast on obviously-bad addresses.
    if (!args.to.includes('@')) {
      return { ok: false, reason: 'bad-to' };
    }

    const text = args.text ?? stripHtml(args.html);

    try {
      const res = await withRetry(
        () =>
          fetch(RESEND_API, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              from,
              to: args.to,
              subject: args.subject,
              html: args.html,
              text,
            }),
          }),
        { label: 'resend send', maxAttempts: 3 },
      );
      const json = (await res.json().catch(() => ({}))) as ResendResponse;
      if (!res.ok) {
        const reason = json.error?.message ?? `resend ${res.status}`;
        console.warn(`Resend send failed for ${args.to}: ${reason}`);
        return { ok: false, reason };
      }
      return { ok: true, id: json.id };
    } catch (err) {
      console.error(
        `Resend dispatch error for ${args.to}:`,
        err instanceof Error ? err.message : err,
      );
      return { ok: false, reason: 'fetch-failed' };
    }
  },
});

/** Strip HTML tags + collapse whitespace for the plain-text fallback. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
