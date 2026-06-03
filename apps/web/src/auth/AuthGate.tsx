import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Container, Section, EmptyState, Button } from '@digipicks/ds';
import { DEV_DEMO_UNLOCK, hasDevStudioPreview } from '../lib/devDemoLogin';
import { DEV_ADMIN_LOCAL } from '../lib/devAdminDefaults';
import { hasDevAdminPreview } from '../lib/devAdminPreview';

/**
 * Roles defined in `convex/shared/validators.ts`. Mirrored here as a string
 * union to keep the gate package-agnostic; values are validated against the
 * live `user.role` returned by `api.users.meSafe`.
 */
export type UserRole = 'super_admin' | 'tenant_admin' | 'admin' | 'moderator' | 'user';

export interface AuthGateProps {
  children: React.ReactNode;
  /**
   * If provided, the current user's `role` must be one of these to pass.
   * Combined with `requireCreator` via OR — admin OR creator both pass.
   */
  allowedRoles?: ReadonlyArray<UserRole>;
  /**
   * If true, the current user must have `creatorId` set on their profile
   * (i.e., they are a creator).
   */
  requireCreator?: boolean;
  /**
   * Title shown on the "forbidden" empty-state when authenticated but lacking
   * the required role / creator status.
   */
  forbiddenTitle?: string;
  forbiddenSubtitle?: string;
}

/**
 * Gates a route subtree behind Convex auth + RBAC.
 *
 * States:
 *  1. **Auth or profile resolving** — DS loading panel.
 *  2. **Unauthenticated** — redirect to `/auth?next=<originalPath>`.
 *  3. **Authenticated but unauthorized** — DS "Forbidden" panel with a CTA
 *     back to the public site.
 *
 * If neither `allowedRoles` nor `requireCreator` is set, any authenticated
 * user passes (auth-only gate).
 */
export function AuthGate({
  children,
  allowedRoles,
  requireCreator,
  forbiddenTitle = "You don't have access to this area.",
  forbiddenSubtitle = 'This part of DigiPicks is reserved for verified creators and platform admins. If you think this is a mistake, contact support.',
}: AuthGateProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { pathname, search } = useLocation();

  // Only fetch the profile after Convex auth resolves.
  const user = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');

  // QA: creator apply "Open studio (dev)" — shell without `/auth` redirect.
  if (DEV_DEMO_UNLOCK && hasDevStudioPreview()) {
    return <>{children}</>;
  }

  // QA: local `/admin` when Convex auth is down — UI shell only.
  if (DEV_ADMIN_LOCAL && hasDevAdminPreview()) {
    return <>{children}</>;
  }

  // ── Auth resolving (or profile loading) ──────────────────────────────
  if (isLoading || (isAuthenticated && user === undefined)) {
    const isStudio = pathname.startsWith('/dashboard');
    const isAccount = pathname.startsWith('/account');
    const isAdmin = pathname.startsWith('/admin');
    const loadingTitle = isStudio
      ? 'Loading your studio…'
      : isAccount
        ? 'Loading your account…'
        : isAdmin
          ? 'Loading admin…'
          : 'Signing you in…';
    const loadingSubtitle = isStudio
      ? 'One moment while we verify your creator session.'
      : isAccount
        ? 'One moment while we load your subscriber profile.'
        : 'One moment while we verify your session.';

    return (
      <main>
        <Container size="xl">
          <Section noReveal>
            <EmptyState icon="lock" title={loadingTitle} subtitle={loadingSubtitle} />
          </Section>
        </Container>
      </main>
    );
  }

  // ── Unauthenticated → bounce to /auth, remembering destination ──────
  if (!isAuthenticated || user === null) {
    const next = encodeURIComponent(`${pathname}${search}`);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }

  // ── RBAC check ───────────────────────────────────────────────────────
  if (!user) {
    const next = encodeURIComponent(`${pathname}${search}`);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }
  const noConstraints = !allowedRoles && !requireCreator;
  const roleOk = allowedRoles
    ? Boolean(user.role && allowedRoles.includes(user.role as UserRole))
    : false;
  const creatorOk = requireCreator ? Boolean(user.creatorId) : false;
  const allowed = noConstraints || roleOk || creatorOk;

  if (!allowed) {
    return (
      <main>
        <Container size="xl">
          <Section noReveal>
            <EmptyState
              icon="shield"
              title={forbiddenTitle}
              subtitle={forbiddenSubtitle}
              action={
                <Button variant="primary" iconLeft="arrow-left" onClick={() => navigate('/')}>
                  Back to home
                </Button>
              }
            />
          </Section>
        </Container>
      </main>
    );
  }

  return <>{children}</>;
}
