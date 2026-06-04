import { useEffect, useState } from 'react';
import { useConvex } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Doc } from '../../../../convex/_generated/dataModel';

type ApplicationDoc = Doc<'applications'>;

/**
 * Loads `applications.mine` without crashing when the linked Convex deployment
 * has not been updated (missing public function).
 */
export function useApplicationsMine(enabled: boolean): {
  existingApp: ApplicationDoc | null | undefined;
  backendStale: boolean;
} {
  const convex = useConvex();
  const [existingApp, setExistingApp] = useState<ApplicationDoc | null | undefined>(
    enabled ? undefined : null,
  );
  const [backendStale, setBackendStale] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setExistingApp(null);
      setBackendStale(false);
      return;
    }

    let cancelled = false;
    setExistingApp(undefined);
    setBackendStale(false);

    void convex
      .query(api.applications.mine, {})
      .then((row) => {
        if (!cancelled) setExistingApp(row);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Could not find public function')) {
          setBackendStale(true);
          setExistingApp(null);
          return;
        }
        console.error('[useApplicationsMine]', err);
        setExistingApp(null);
      });

    return () => {
      cancelled = true;
    };
  }, [convex, enabled]);

  return { existingApp, backendStale };
}
