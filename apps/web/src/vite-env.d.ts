/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL?: string;
  /** When true (and Vite dev), any signed-in user may open /dashboard */
  readonly VITE_DEV_UNLOCK_DASHBOARD?: string;
}
