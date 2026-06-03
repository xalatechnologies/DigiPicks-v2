import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  StudioPageHeader,
  AdminMetricStrip,
  AdminUsersFilterBar,
  AdminUsersTable,
  AdminUserInspectorDrawer,
  Button,
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ADMIN } from '../lib/adminRoutes';
import {
  USER_TYPE_FILTERS,
  USER_ACCOUNT_FILTERS,
  accountStatus,
  auditToHistory,
  formatJoinedLabel,
  formatRole,
  matchesUserFilters,
  monogram,
  displayUserName,
  parseAccountFilter,
  parseUserType,
  userTypeLabel,
  type UserAccountFilter,
  type UserTypeFilter,
} from '../lib/userAdmin';

function useUserParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const type = parseUserType(searchParams.get('type'));
  const account = parseAccountFilter(searchParams.get('account'));
  const quick = searchParams.get('quick') === 'billing' ? ('billing' as const) : null;
  const activeId = searchParams.get('id') as Id<'users'> | null;

  const setType = (next: UserTypeFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('type');
    else params.set('type', next);
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setAccount = (next: UserAccountFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('account');
    else params.set('account', next);
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setQuick = (next: 'billing' | null) => {
    const params = new URLSearchParams(searchParams);
    if (next) params.set('quick', next);
    else params.delete('quick');
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setActiveId = (id: Id<'users'> | null) => {
    const params = new URLSearchParams(searchParams);
    if (id) params.set('id', id);
    else params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  return {
    type,
    account,
    quick,
    activeId,
    setType,
    setAccount,
    setQuick,
    setActiveId,
    clearFilters,
  };
}

export function Users() {
  const navigate = useNavigate();
  const {
    type,
    account,
    quick,
    activeId,
    setType,
    setAccount,
    setQuick,
    setActiveId,
    clearFilters,
  } = useUserParams();
  const [search, setSearch] = useState('');

  const summary = useQuery(api.admin.usersSummary, {});
  const users = useQuery(api.admin.usersList, {});
  const activeUser = useQuery(api.admin.userGet, activeId ? { userId: activeId } : 'skip');
  const auditRows = useQuery(
    api.audit.listByEntity,
    activeId ? { entityType: 'user', entityId: activeId, limit: 12 } : 'skip',
  );

  const filteredUsers = useMemo(() => {
    if (!users) return undefined;
    return users.filter((u) => matchesUserFilters(u, search, type, account, quick));
  }, [users, search, type, account, quick]);

  const tableRows = useMemo(() => {
    if (!filteredUsers) return [];
    return filteredUsers.map((u) => {
      const status = accountStatus(u);
      const displayName = displayUserName(u.name, u.email);
      const handleLine = u.creatorHandle
        ? `@${u.creatorHandle}`
        : u.role
          ? formatRole(u.role)
          : 'Subscriber account';
      return {
        id: u._id,
        name: displayName,
        handleLine,
        monogram: monogram(u.name, u.email),
        email: u.email ?? '—',
        typeLabel: userTypeLabel(u.role, u.creatorId),
        subscriptionsLabel: String(u.activeSubscriptionCount || u.subscriptionCount),
        statusLabel: status.label,
        statusTone: status.tone,
        joinedLabel: formatJoinedLabel(u.joinedAt ?? u.lastLoginAt),
      };
    });
  }, [filteredUsers]);

  const kpiItems = useMemo(() => {
    if (summary === undefined) {
      return [
        { label: 'Total users', value: '—' },
        { label: 'Active', value: '—' },
        { label: 'Subscribers', value: '—' },
        { label: 'Creators', value: '—' },
        { label: 'Billing issues', value: '—' },
      ];
    }
    return [
      { label: 'Total users', value: summary.total.toLocaleString() },
      {
        label: 'Active',
        value: summary.active.toLocaleString(),
        badge: { text: 'Accounts', tone: 'primary' as const },
        onClick: () => setAccount('active'),
      },
      {
        label: 'Subscribers',
        value: summary.subscribers.toLocaleString(),
        onClick: () => setType('subscriber'),
      },
      {
        label: 'Creators',
        value: summary.creators.toLocaleString(),
        onClick: () => setType('creator'),
      },
      {
        label: 'Billing issues',
        value: summary.billingIssues.toLocaleString(),
        badge:
          summary.billingIssues > 0
            ? { text: 'Past due', tone: 'urgent' as const }
            : { text: 'Clear', tone: 'muted' as const },
        onClick: () => setQuick('billing'),
      },
    ];
  }, [summary, setAccount, setType, setQuick]);

  const footerLabel =
    filteredUsers === undefined
      ? undefined
      : `Showing ${filteredUsers.length} user${filteredUsers.length === 1 ? '' : 's'}`;

  const detailData = useMemo(() => {
    if (!activeUser) return null;
    const u = activeUser.user;
    const status = accountStatus({
      isActive: u.isActive,
      pastDueCount: activeUser.pastDueCount,
    });
    return {
      id: u._id,
      name: displayUserName(u.name, u.email),
      email: u.email ?? '—',
      monogram: monogram(u.name, u.email),
      typeLabel: userTypeLabel(u.role, u.creatorId),
      statusLabel: status.label,
      subscriptionCount: activeUser.subscriptionCount,
      activeSubscriptionCount: activeUser.activeSubscriptionCount,
      overrideCount: activeUser.overrideCount,
      subscriptions: activeUser.subscriptions.map((sub) => ({
        id: sub._id,
        creatorName: sub.creatorName,
        creatorHandle: sub.creatorHandle,
        plan: sub.plan,
        status: sub.status,
        accessActive: sub.accessActive,
        renewsLabel: sub.renewsAt ? formatJoinedLabel(sub.renewsAt) : '—',
      })),
    };
  }, [activeUser]);

  const history = useMemo(() => auditToHistory(auditRows ?? []), [auditRows]);

  function closeDrawer() {
    setActiveId(null);
  }

  return (
    <Container size="2xl">
      <Stack gap={10}>
        <StudioPageHeader
          eyebrow="Operational hub"
          title="Users"
          actions={
            <Button variant="outline" iconLeft="verified" onClick={() => navigate(ADMIN.creators)}>
              Creators
            </Button>
          }
        />

        <AdminMetricStrip items={kpiItems} columns={5} />

        <Stack gap={6}>
          <AdminUsersFilterBar
            typeOptions={USER_TYPE_FILTERS}
            type={type}
            onTypeChange={(v) => setType(v as UserTypeFilter)}
            accountOptions={USER_ACCOUNT_FILTERS}
            account={account}
            onAccountChange={(v) => setAccount(v as UserAccountFilter)}
            search={search}
            onSearchChange={setSearch}
            billingIssueCount={summary?.billingIssues ?? 0}
            quickFilter={quick}
            onQuickFilterChange={setQuick}
            onClearFilters={clearFilters}
          />

          <AdminUsersTable
            rows={tableRows}
            selectedId={activeId}
            loading={users === undefined}
            footerLabel={footerLabel}
            emptyTitle="No users match filters"
            emptySubtitle="Clear search or try another type, account state, or quick filter."
            onSelect={(id) => setActiveId(id as Id<'users'>)}
            onEntitlements={(id) => navigate(`${ADMIN.users}/${id}/entitlements`)}
          />

          {activeId && users && !users.some((u) => u._id === activeId) ? (
            <EmptyState
              icon="users"
              title="User not in current list"
              subtitle="They may be outside the loaded set. Clear selection or refresh."
              action={
                <Button variant="secondary" onClick={closeDrawer}>
                  Clear selection
                </Button>
              }
            />
          ) : null}
        </Stack>
      </Stack>

      <AdminUserInspectorDrawer
        open={Boolean(activeId)}
        onClose={closeDrawer}
        user={detailData}
        loading={Boolean(activeId) && activeUser === undefined}
        history={history}
        onEntitlements={
          activeId ? () => navigate(`${ADMIN.users}/${activeId}/entitlements`) : undefined
        }
        onCreatorProfile={
          activeUser?.user.creatorHandle
            ? () => navigate(`/creators/${activeUser.user.creatorHandle}`)
            : undefined
        }
      />
    </Container>
  );
}
