// =============================================================================
// @digipicks/sdk — Convex Hooks
// Stub implementations until Convex schema is deployed and _generated exists
// =============================================================================

// These will be replaced with real `useQuery(api.creators.list)` calls
// once the Convex backend is deployed and _generated types are available.

/**
 * Placeholder hook — returns empty array until Convex is wired
 */
export function useCreators() {
  return { creators: [], isLoading: false };
}

export function useEvents() {
  return { events: [], isLoading: false };
}

export function usePicks() {
  return { picks: [], isLoading: false };
}

export function useCreatorProfile(_id: string) {
  return { creator: null, isLoading: false };
}
