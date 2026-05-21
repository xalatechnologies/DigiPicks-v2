/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL?: string;
  /** With local dev or `VITE_SHOW_DEMO_AUTH`, plus this true → relax `/dashboard` RBAC */
  readonly VITE_DEV_UNLOCK_DASHBOARD?: string;
  /** Optional — one-click studio entry from `/apply` signs in as this creator (dev only). */
  readonly VITE_DEV_CREATOR_EMAIL?: string;
  readonly VITE_DEV_CREATOR_PASSWORD?: string;
  /** Dev admin auto sign-in at /admin (must match Convex DEV_ADMIN_*). */
  readonly VITE_DEV_ADMIN_EMAIL?: string;
  readonly VITE_DEV_ADMIN_PASSWORD?: string;
  /** Hosted preview/staging only — paired with unlock above for QA; not used on `/auth` */
  readonly VITE_SHOW_DEMO_AUTH?: string;
}
