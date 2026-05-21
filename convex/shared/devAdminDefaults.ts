/** Local-dev defaults — override with Convex env `DEV_ADMIN_*` on any deployment. */
export const DEFAULT_DEV_ADMIN_EMAIL = 'admin@digipicks.com';
export const DEFAULT_DEV_ADMIN_PASSWORD = 'AdminDev123!';

/**
 * True only for Convex **prod:** deployments. Cloud *dev* deployments still use
 * `NODE_ENV=production`, so we must not gate on NODE_ENV alone.
 */
export function isProductionDeployment(): boolean {
  const deployment = process.env.CONVEX_DEPLOYMENT ?? '';
  if (deployment.startsWith('prod:')) return true;
  if (deployment.startsWith('dev:')) return false;
  // Local `npx convex dev` — allow defaults unless explicitly prod-named.
  return false;
}

export function resolveDevAdminEmail(): string {
  const fromEnv = process.env.DEV_ADMIN_EMAIL?.trim();
  if (fromEnv) return fromEnv.toLowerCase();
  if (isProductionDeployment()) {
    throw new Error('DEV_ADMIN_EMAIL is required in production');
  }
  return DEFAULT_DEV_ADMIN_EMAIL.toLowerCase();
}

export function resolveDevAdminPassword(): string {
  const fromEnv = process.env.DEV_ADMIN_PASSWORD;
  if (fromEnv) return fromEnv;
  if (isProductionDeployment()) {
    throw new Error('DEV_ADMIN_PASSWORD is required in production');
  }
  return DEFAULT_DEV_ADMIN_PASSWORD;
}
