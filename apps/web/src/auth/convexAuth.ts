/**
 * Canonical Convex Auth imports for the web app.
 *
 * - `useConvexAuth` from `convex/react` — true only after the backend accepts the JWT.
 * - `useAuthActions` from `@convex-dev/auth/react` — signIn / signOut.
 *
 * Do not import `useConvexAuth` from `@convex-dev/auth/react` (token-in-storage only).
 */
export { useConvexAuth, useQuery, useMutation, useAction } from 'convex/react';
export { useAuthActions } from '@convex-dev/auth/react';
