import type { NavigateFunction } from 'react-router-dom';
import { formatAuthError } from './formatAuthError';

const STUDIO_PREVIEW_KEY = 'digipicks_dev_studio_preview';

/**
 * Optional QA-only bypass for `/dashboard` RBAC (creator studio).
 *
 * Enable with `VITE_DEV_UNLOCK_DASHBOARD=true` plus either local dev or
 * `VITE_SHOW_DEMO_AUTH=true` on a hosted preview/staging build.
 */
export const DEV_DEMO_UNLOCK =
  import.meta.env.VITE_DEV_UNLOCK_DASHBOARD === 'true' &&
  (import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_AUTH === 'true');

/** When set, one-click studio entry can sign in without showing `/auth`. */
export function canDevAutoSignInCreator(): boolean {
  return Boolean(
    DEV_DEMO_UNLOCK &&
    import.meta.env.VITE_DEV_CREATOR_EMAIL?.trim() &&
    import.meta.env.VITE_DEV_CREATOR_PASSWORD,
  );
}

export function hasDevStudioPreview(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(STUDIO_PREVIEW_KEY) === '1';
}

export function enableDevStudioPreview(): void {
  sessionStorage.setItem(STUDIO_PREVIEW_KEY, '1');
}

export function clearDevStudioPreview(): void {
  sessionStorage.removeItem(STUDIO_PREVIEW_KEY);
}

type SignInFn = (provider: string, formData: FormData) => Promise<unknown>;

/**
 * QA shortcut from creator apply: open `/dashboard` without visiting `/auth`.
 * Uses env test credentials when configured; otherwise enables a read-only
 * preview shell (empty Convex data, no mutations).
 */
export async function openCreatorStudioForDev(opts: {
  signIn: SignInFn;
  navigate: NavigateFunction;
  setLoading?: (loading: boolean) => void;
  setError?: (message: string) => void;
}): Promise<void> {
  if (!DEV_DEMO_UNLOCK) return;

  opts.setLoading?.(true);
  opts.setError?.('');

  try {
    if (canDevAutoSignInCreator()) {
      const fd = new FormData();
      fd.set('email', import.meta.env.VITE_DEV_CREATOR_EMAIL!.trim());
      fd.set('password', import.meta.env.VITE_DEV_CREATOR_PASSWORD!);
      fd.set('flow', 'signIn');
      await opts.signIn('password', fd);
      clearDevStudioPreview();
    } else {
      enableDevStudioPreview();
    }
    opts.navigate('/dashboard');
  } catch (err: unknown) {
    enableDevStudioPreview();
    opts.navigate('/dashboard');
    opts.setError?.(
      `${formatAuthError(err, 'signIn')} Showing the studio shell in dev preview mode.`,
    );
  } finally {
    opts.setLoading?.(false);
  }
}
