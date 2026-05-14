/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL?: string;
  /** With local dev or `VITE_SHOW_DEMO_AUTH`, plus this true → relax `/dashboard` RBAC */
  readonly VITE_DEV_UNLOCK_DASHBOARD?: string;
  /** Hosted preview/staging only — paired with unlock above for QA; not used on `/auth` */
  readonly VITE_SHOW_DEMO_AUTH?: string;
}
