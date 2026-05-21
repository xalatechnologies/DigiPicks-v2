import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthActions, useMutation } from './convexAuth';
import { Container, EmptyState, Section, Button, Stack, Row } from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';
import { AuthGate, type AuthGateProps } from './AuthGate';
import {
  canDevAutoSignInAdmin,
  useDevAdminAutoSignIn,
  useClaimDevAdminRole,
} from '../lib/devAdminLogin';
import { DEV_ADMIN_LOCAL, isDevAdminEmail } from '../lib/devAdminDefaults';
import { enableDevAdminPreview, hasDevAdminPreview } from '../lib/devAdminPreview';
import { formatAuthError } from '../lib/formatAuthError';
import { resetConvexAuthSession } from '../lib/clearStaleConvexAuth';
import { markDevAdminSignedOut } from '../lib/devAdminSession';
import { useAuthSession } from './useAuthSession';

/**
 * Admin route guard with optional dev auto sign-in (no manual registration).
 */
const ADMIN_ROLES = new Set(['super_admin', 'tenant_admin', 'admin']);

/** Server RBAC uses `users.role` — email-only bypass must not mount admin queries. */
function hasAdminRole(me: { role?: string } | null | undefined): boolean {
  return Boolean(me?.role && ADMIN_ROLES.has(me.role));
}

export function AdminAuthGate(props: AuthGateProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { phase, ready, error, retry } = useDevAdminAutoSignIn();
  const { signOut } = useAuthActions();
  const { isAuthenticated, me, status, profileStalled, serverAuthUserId } = useAuthSession();
  const { claiming, claimError, retryClaim } = useClaimDevAdminRole(isAuthenticated, me);
  const repairDevAuthLink = useMutation(api.devProvision.repairDevAuthLink);
  const [repairing, setRepairing] = useState(false);
  const [repairError, setRepairError] = useState<string | null>(null);
  const [clearingSession, setClearingSession] = useState(false);
  const repairStarted = useRef(false);
  const orphanRetryStarted = useRef(false);

  const adminAuthPath = `/auth?next=${encodeURIComponent('/admin')}`;

  const clearSessionAndSignIn = useCallback(async () => {
    setClearingSession(true);
    setRepairError(null);
    markDevAdminSignedOut();
    try {
      await resetConvexAuthSession(signOut);
    } finally {
      window.location.replace(adminAuthPath);
    }
  }, [adminAuthPath, signOut]);

  const runRepair = useCallback(() => {
    if (serverAuthUserId === null) {
      return clearSessionAndSignIn();
    }
    setRepairing(true);
    setRepairError(null);
    return repairDevAuthLink({})
      .then(() => window.location.reload())
      .catch((err: unknown) => {
        setRepairError(formatAuthError(err, 'signIn'));
        setRepairing(false);
        repairStarted.current = false;
        throw err;
      });
  }, [clearSessionAndSignIn, repairDevAuthLink, serverAuthUserId]);

  useEffect(() => {
    const canRepair =
      DEV_ADMIN_LOCAL && serverAuthUserId !== null && !repairStarted.current && status === 'orphan';
    if (!canRepair) return;
    repairStarted.current = true;
    void runRepair();
  }, [runRepair, serverAuthUserId, status]);

  useEffect(() => {
    if (status !== 'orphan' || orphanRetryStarted.current) return;
    const staleToken = serverAuthUserId === null;
    if (!staleToken || !canDevAutoSignInAdmin()) return;
    orphanRetryStarted.current = true;
    retry();
  }, [retry, serverAuthUserId, status]);

  const authNext = encodeURIComponent(`${pathname}${search}`);

  if (DEV_ADMIN_LOCAL && hasDevAdminPreview()) {
    return <>{props.children}</>;
  }

  if (clearingSession) {
    return (
      <main>
        <Container size="xl">
          <Section noReveal>
            <EmptyState
              icon="lock"
              title="Clearing expired session…"
              subtitle="Redirecting to sign in again."
            />
          </Section>
        </Container>
      </main>
    );
  }

  if (status === 'loading' || (status === 'profile-loading' && !profileStalled)) {
    return (
      <main>
        <Container size="xl">
          <Section noReveal>
            <EmptyState
              icon="lock"
              title={status === 'loading' ? 'Checking session…' : 'Loading admin session…'}
              subtitle={
                status === 'loading'
                  ? 'Restoring your sign-in.'
                  : repairing
                    ? 'Linking your session to the dev admin profile…'
                    : 'Verifying your platform role.'
              }
            />
          </Section>
        </Container>
      </main>
    );
  }

  if (status === 'anonymous') {
    return (
      <main>
        <Container size="xl">
          <Section noReveal>
            <Stack gap={4}>
              <EmptyState
                icon="lock"
                title="Sign in required"
                subtitle="Platform admin tools need an authenticated session. Use admin@digipicks.com on the sign-in page (sign out of any subscriber account first if you were already logged in)."
              />
              <Row gap={2}>
                <Button variant="primary" onClick={() => navigate(`/auth?next=${authNext}`)}>
                  Sign in
                </Button>
              </Row>
            </Stack>
          </Section>
        </Container>
      </main>
    );
  }

  if (status === 'orphan') {
    const staleToken = serverAuthUserId === null;
    const subtitle = repairing
      ? 'Linking your Convex Auth session to the dev admin profile…'
      : (repairError ??
        (staleToken
          ? canDevAutoSignInAdmin()
            ? 'Reconnecting with dev admin credentials…'
            : 'Convex does not recognize your session. Clear the session and sign in again.'
          : profileStalled
            ? 'Your sign-in did not load a profile in time. Try repair or sign in again.'
            : 'You are signed in but this session is not linked to a users row. Try repair, or run `npx convex run devProvisionActions:bootstrapDevAdmin` then sign in again.'));
    return (
      <main>
        <Container size="xl">
          <Section noReveal>
            <Stack gap={4}>
              <EmptyState
                icon="shield"
                title={repairing ? 'Repairing session…' : 'No profile for this session'}
                subtitle={subtitle}
              />
              {!repairing && !staleToken ? (
                <Row gap={2}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      repairStarted.current = false;
                      void runRepair();
                    }}
                  >
                    Repair session link
                  </Button>
                  <Button variant="primary" onClick={() => retry()}>
                    Retry dev sign-in
                  </Button>
                  <Button variant="outline" onClick={() => navigate(adminAuthPath)}>
                    Sign in manually
                  </Button>
                </Row>
              ) : !repairing && staleToken ? (
                <Row gap={2}>
                  <Button variant="primary" onClick={() => void clearSessionAndSignIn()}>
                    Clear session & sign in
                  </Button>
                  <Button variant="outline" onClick={() => navigate(adminAuthPath)}>
                    Sign in manually
                  </Button>
                </Row>
              ) : null}
            </Stack>
          </Section>
        </Container>
      </main>
    );
  }

  if (canDevAutoSignInAdmin() && !ready && !error) {
    const subtitle =
      phase === 'waiting_auth'
        ? 'Checking your session…'
        : 'Setting up the local dev admin account…';
    return (
      <main>
        <Container size="xl">
          <Section noReveal>
            <EmptyState icon="lock" title="Signing in as platform admin…" subtitle={subtitle} />
          </Section>
        </Container>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <Container size="xl">
          <Section noReveal>
            <Stack gap={4}>
              <EmptyState icon="shield" title="Dev admin sign-in failed" subtitle={error} />
              <Row gap={2}>
                <Button
                  variant="primary"
                  onClick={() => {
                    retry();
                  }}
                >
                  Try again
                </Button>
                {DEV_ADMIN_LOCAL ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      enableDevAdminPreview();
                      window.location.reload();
                    }}
                  >
                    Open admin UI (offline)
                  </Button>
                ) : null}
                <Button variant="outline" onClick={() => navigate(adminAuthPath)}>
                  Sign in manually
                </Button>
              </Row>
            </Stack>
          </Section>
        </Container>
      </main>
    );
  }

  if (claiming || claimError) {
    return (
      <main>
        <Container size="xl">
          <Section noReveal>
            <Stack gap={4}>
              <EmptyState
                icon="shield"
                title={claimError ? 'Could not grant admin role' : 'Granting admin access…'}
                subtitle={
                  claimError ??
                  'Linking your session to the dev admin profile (role and email only — subscribers/creators unchanged).'
                }
              />
              {claimError ? (
                <Row gap={2}>
                  <Button variant="primary" onClick={() => retryClaim()}>
                    Try again
                  </Button>
                  <Button variant="outline" onClick={() => navigate(adminAuthPath)}>
                    Sign in manually
                  </Button>
                </Row>
              ) : null}
            </Stack>
          </Section>
        </Container>
      </main>
    );
  }

  if (me && hasAdminRole(me)) {
    return <>{props.children}</>;
  }

  if (
    isAuthenticated &&
    me &&
    canDevAutoSignInAdmin() &&
    isDevAdminEmail(me.email) &&
    !hasAdminRole(me)
  ) {
    return (
      <main>
        <Container size="xl">
          <Section noReveal>
            <EmptyState
              icon="lock"
              title="Finishing admin setup…"
              subtitle="Your account is signed in; waiting for platform admin role on this deployment."
            />
          </Section>
        </Container>
      </main>
    );
  }

  return <AuthGate {...props} />;
}
