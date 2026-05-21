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
