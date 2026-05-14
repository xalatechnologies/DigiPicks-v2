/**
 * Temporary local-dev shortcut — remove when real onboarding ships.
 * Enable via `VITE_DEV_UNLOCK_DASHBOARD=true` (see `.env.local`).
 *
 * Production builds always have `import.meta.env.DEV === false`, so the
 * dashboard RBAC bypass cannot activate in a Vite production bundle.
 */
export const DEV_DEMO_UNLOCK =
  import.meta.env.DEV && import.meta.env.VITE_DEV_UNLOCK_DASHBOARD === 'true';

export const DEV_DEMO_EMAIL = 'demo@digipicks.local';
export const DEV_DEMO_PASSWORD = 'DemoDashboard123!';
