import { DEV_DEMO_UNLOCK } from './devDemoLogin';

/** Matches Convex `shared/devAdminDefaults` for local `pnpm dev`. */
export const DEFAULT_DEV_ADMIN_EMAIL = 'admin@digipicks.com';
export const DEFAULT_DEV_ADMIN_PASSWORD = 'AdminDev123!';

/** Local Vite dev server — auto admin at `/admin` without extra env. */
export const DEV_ADMIN_LOCAL = import.meta.env.DEV;

export function resolveDevAdminCredentials(): { email: string; password: string } {
  const email =
    import.meta.env.VITE_DEV_ADMIN_EMAIL?.trim() ||
    (DEV_ADMIN_LOCAL ? DEFAULT_DEV_ADMIN_EMAIL : '');
  const password =
    import.meta.env.VITE_DEV_ADMIN_PASSWORD || (DEV_ADMIN_LOCAL ? DEFAULT_DEV_ADMIN_PASSWORD : '');
  return { email, password };
}

/** True when `/admin` should bootstrap + password sign-in without manual registration. */
export function canDevAutoSignInAdmin(): boolean {
  if (!DEV_ADMIN_LOCAL && !DEV_DEMO_UNLOCK) return false;
  const { email, password } = resolveDevAdminCredentials();
  return Boolean(email && password);
}

export function isDevAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const target = resolveDevAdminCredentials().email.trim().toLowerCase();
  return email.trim().toLowerCase() === target;
}
