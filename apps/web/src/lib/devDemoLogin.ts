/**
 * Optional QA-only bypass for `/dashboard` RBAC (creator studio).
 *
 * Enable with `VITE_DEV_UNLOCK_DASHBOARD=true` plus either local dev or
 * `VITE_SHOW_DEMO_AUTH=true` on a hosted preview/staging build.
 *
 * Auth page intentionally has no demo shortcuts — real sign-up / sign-in only.
 */
export const DEV_DEMO_UNLOCK =
  import.meta.env.VITE_DEV_UNLOCK_DASHBOARD === 'true' &&
  (import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_AUTH === 'true');
