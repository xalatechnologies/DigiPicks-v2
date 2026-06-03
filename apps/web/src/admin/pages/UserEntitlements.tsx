import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  StudioPageHeader,
  Button,
  EmptyState,
  AdminMetricStrip,
  AdminUserEntitlementsPanel,
  type AdminUserEntitlementsGrantForm,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ADMIN } from '../lib/adminRoutes';
import {
  accountStatus,
  displayUserName,
  formatAdminDateTime,
  formatJoinedLabel,
  monogram,
  userTypeLabel,
} from '../lib/userAdmin';

const DEFAULT_GRANT: AdminUserEntitlementsGrantForm = {
  creatorId: '',
  resourceType: 'pick_feed',
  resourceId: '',
  reason: 'Admin manual override',
};

export function UserEntitlements() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const data = useQuery(
    api.entitlements.adminByUser,
    userId ? { userId: userId as Id<'users'> } : 'skip',
  );
  const creators = useQuery(api.creators.list, {});
  const grantMutation = useMutation(api.entitlements.grantOverride);
  const revokeMutation = useMutation(api.entitlements.revokeOverride);

  const [grant, setGrant] = useState<AdminUserEntitlementsGrantForm>(DEFAULT_GRANT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creatorOptions = useMemo(
    () =>
      (creators ?? [])
        .map((c) => ({
          id: c._id,
          name: c.name,
          handle: c.handle,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [creators],
  );

  const profile = useMemo(() => {
    if (!data?.user) {
      return {
        name: 'User entitlements',
        email: '—',
        monogram: '?',
        typeLabel: 'Subscriber',
        statusLabel: '—',
        statusTone: 'mute' as const,
      };
    }
    const u = data.user;
    const status = accountStatus({
      isActive: u.isActive,
      pastDueCount: 0,
    });
    return {
      name: displayUserName(u.name, u.email),
      email: u.email ?? '—',
      monogram: monogram(u.name, u.email),
      typeLabel: userTypeLabel(u.role, u.creatorId),
      statusLabel: status.label,
      statusTone: status.tone,
    };
  }, [data]);

  const kpiItems = useMemo(() => {
    if (!data) {
      return [
        { label: 'Subscriptions', value: '—' },
        { label: 'Active subs', value: '—' },
        { label: 'Overrides', value: '—' },
        { label: 'Access logs', value: '—' },
      ];
    }
    return [
      { label: 'Subscriptions', value: String(data.subscriptionCount) },
      { label: 'Active subs', value: String(data.activeSubscriptionCount) },
      { label: 'Overrides', value: String(data.activeOverrideCount) },
      { label: 'Access logs', value: String(data.accessLogs.length) },
    ];
  }, [data]);

  async function handleGrant() {
    if (!userId || !grant.creatorId || !grant.resourceId.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await grantMutation({
        userId: userId as Id<'users'>,
        creatorId: grant.creatorId as Id<'creators'>,
        resourceType: grant.resourceType,
        resourceId: grant.resourceId.trim(),
        reason: grant.reason.trim() || 'Admin manual override',
      });
      setGrant(DEFAULT_GRANT);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not grant access.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(entitlementId: string) {
    setBusy(true);
    setError(null);
    try {
      await revokeMutation({ entitlementId: entitlementId as Id<'entitlements'> });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not revoke entitlement.');
    } finally {
      setBusy(false);
    }
  }

  if (!userId) {
    return (
      <Container size="2xl">
        <EmptyState icon="user" title="User not specified" />
      </Container>
    );
  }

  if (data === null) {
    return (
      <Container size="2xl">
        <Stack gap={8}>
          <StudioPageHeader
            eyebrow="Entitlements"
            title="User not found"
            actions={
              <Button variant="outline" onClick={() => navigate(ADMIN.users)}>
                Back to users
              </Button>
            }
          />
          <EmptyState
            icon="user"
            title="User not found"
            subtitle="This account may have been removed."
            action={
              <Button variant="secondary" onClick={() => navigate(ADMIN.users)}>
                Return to users
              </Button>
            }
          />
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="2xl">
      <Stack gap={8}>
        <StudioPageHeader
          eyebrow="Entitlements"
          title={profile.name}
          sub="Full-page access overrides for this user. From Users, the lock icon opens this page (not a drawer)."
          actions={
            <Button
              variant="outline"
              iconLeft="arrow-left"
              onClick={() => navigate(`${ADMIN.users}?id=${userId}`)}
            >
              Back to user
            </Button>
          }
        />

        <AdminMetricStrip columns={5} items={kpiItems} />

        <AdminUserEntitlementsPanel
          loading={data === undefined}
          profile={profile}
          subscriptions={data?.subscriptions ?? []}
          entitlements={data?.entitlements ?? []}
          accessLogs={data?.accessLogs ?? []}
          creators={creatorOptions}
          grant={grant}
          onGrantChange={(patch) => setGrant((prev) => ({ ...prev, ...patch }))}
          onGrant={handleGrant}
          onRevoke={handleRevoke}
          busy={busy}
          error={error}
          formatDate={(ms) => (ms > 1e12 ? formatAdminDateTime(ms) : formatJoinedLabel(ms))}
        />
      </Stack>
    </Container>
  );
}
