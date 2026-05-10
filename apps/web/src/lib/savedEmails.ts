// =============================================================================
// Saved emails — local "remember this email for 30 days" cache used by the
// Auth page. Stored in localStorage so it survives across sessions but
// stays scoped to the device/browser. Each entry has a `lastUsedAt` ms
// timestamp; `list()` filters out entries older than TTL_MS so stale
// emails fall off automatically.
//
// Privacy + security:
//   - Emails only. Never store passwords or tokens.
//   - localStorage is per-origin, so a shared device leaks emails to other
//     people who use the same browser profile. The "Forget" affordance in
//     the UI lets a user prune the list.
//   - 30-day TTL keeps stale dev/test addresses from sticking around.
// =============================================================================

const STORAGE_KEY = 'digipicks.savedEmails.v1';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_ENTRIES = 5;

export interface SavedEmail {
  email: string;
  lastUsedAt: number;
}

interface StoredShape {
  v: 1;
  emails: SavedEmail[];
}

function read(): SavedEmail[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredShape;
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.emails)) return [];
    return parsed.emails.filter(
      (e) => typeof e?.email === 'string' && typeof e?.lastUsedAt === 'number',
    );
  } catch {
    return [];
  }
}

function write(emails: SavedEmail[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const payload: StoredShape = { v: 1, emails };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore — quota / privacy mode
  }
}

/** Return saved emails sorted by most-recently-used, dropping anything
 *  older than 30 days. */
export function listSavedEmails(): SavedEmail[] {
  const cutoff = Date.now() - TTL_MS;
  const fresh = read().filter((e) => e.lastUsedAt >= cutoff);
  // Persist the filter so stale entries fall off on next read too.
  if (fresh.length !== read().length) write(fresh);
  return [...fresh].sort((a, b) => b.lastUsedAt - a.lastUsedAt);
}

/** Save an email after a successful sign-in. Updates lastUsedAt if the
 *  email is already saved (so it bubbles to the top). Caps the list at
 *  MAX_ENTRIES so localStorage doesn't grow forever. */
export function rememberEmail(email: string): void {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) return;
  const existing = read().filter((e) => e.email.toLowerCase() !== trimmed);
  const updated: SavedEmail[] = [{ email: trimmed, lastUsedAt: Date.now() }, ...existing].slice(
    0,
    MAX_ENTRIES,
  );
  write(updated);
}

/** Remove a single email from the saved list (the "Forget" affordance). */
export function forgetEmail(email: string): void {
  const target = email.trim().toLowerCase();
  const next = read().filter((e) => e.email.toLowerCase() !== target);
  write(next);
}

/** Wipe every saved email — handy for a "Sign out everywhere" flow. */
export function forgetAllEmails(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
