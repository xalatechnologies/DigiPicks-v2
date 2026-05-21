import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  StudioPageHeader,
  AdminMetricStrip,
  AdminCreatorsFilterBar,
  AdminCreatorsTable,
  AdminCreatorInspectorDrawer,
  Button,
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ADMIN } from '../lib/adminRoutes';
import {
  CREATOR_STATUS_FILTERS,
  CREATOR_VERIFIED_FILTERS,
  auditToHistory,
  formatJoinedLabel,
  formatRevenue,
  formatSubscriberCount,
  formatTrustScore,
  matchesCreatorSearch,
  nicheLabel,
  parseCreatorStatus,
  parseVerifiedFilter,
  statusDisplay,
  type CreatorStatusFilter,
  type CreatorVerifiedFilter,
} from '../lib/creatorAdmin';

function useCreatorParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = parseCreatorStatus(searchParams.get('status'));
  const verified = parseVerifiedFilter(searchParams.get('verified'));
  const sport = searchParams.get('sport') ?? 'all';
  const activeId = searchParams.get('id') as Id<'creators'> | null;

  const setStatus = (next: CreatorStatusFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('status');
    else params.set('status', next);
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setVerified = (next: CreatorVerifiedFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('verified');
    else params.set('verified', next);
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setSport = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('sport');
    else params.set('sport', next);
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setActiveId = (id: Id<'creators'> | null) => {
    const params = new URLSearchParams(searchParams);
    if (id) params.set('id', id);
    else params.delete('id');
    setSearchParams(params, { replace: true });
  };

  return { status, verified, sport, activeId, setStatus, setVerified, setSport, setActiveId };
}

export function CreatorsAdmin() {
  const navigate = useNavigate();
  const { status, verified, sport, activeId, setStatus, setVerified, setSport, setActiveId } =
    useCreatorParams();
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const summary = useQuery(api.admin.creatorsSummary, {});
  const creators = useQuery(api.admin.creatorsList, {});
  const activeCreator = useQuery(api.admin.creatorGet, activeId ? { creatorId: activeId } : 'skip');
  const auditRows = useQuery(
    api.audit.listByEntity,
    activeId ? { entityType: 'creator', entityId: activeId, limit: 12 } : 'skip',
  );

  const setStatusMutation = useMutation(api.admin.setCreatorStatus);
  const setVerifiedMutation = useMutation(api.admin.setCreatorVerified);

  const sportOptions = useMemo(() => {
    const sports = new Set<string>();
    for (const c of creators ?? []) {
      for (const s of c.sports) sports.add(s);
    }
    return [
      { value: 'all', label: 'All sports' },
      ...[...sports].sort().map((s) => ({ value: s, label: s })),
    ];
  }, [creators]);

  const filteredCreators = useMemo(() => {
    if (!creators) return undefined;
    return creators.filter((c) => matchesCreatorSearch(c, search, status, sport, verified));
  }, [creators, search, status, sport, verified]);

  const tableRows = useMemo(() => {
    if (!filteredCreators) return [];
    return filteredCreators.map((c) => {
      const display = statusDisplay(c.status);
      const subs = c.activeSubscriptions ?? c.subscriberCount;
      return {
        id: c._id,
        name: c.name,
        handle: c.handle,
        avatarMono: c.avatarMono,
        avatarColor: c.avatarColor,
        verified: c.verified,
        subscribersLabel: formatSubscriberCount(subs),
        revenueLabel: formatRevenue(c.estMonthlyRevenue ?? 0),
        statusLabel: display.label,
        statusTone: display.tone,
        joinedLabel: formatJoinedLabel(c.createdAt),
      };
    });
  }, [filteredCreators]);

  const kpiItems = useMemo(() => {
    if (summary === undefined) {
      return [
        { label: 'Total creators', value: '—' },
        { label: 'Active', value: '—' },
        { label: 'Suspended', value: '—' },
        { label: 'Top performers', value: '—' },
        { label: 'At-risk', value: '—' },
      ];
    }
    const activePct = summary.total > 0 ? Math.round((summary.active / summary.total) * 100) : 0;
    return [
      { label: 'Total creators', value: summary.total.toLocaleString() },
      {
        label: 'Active',
        value: summary.active.toLocaleString(),
        badge: { text: `${activePct}% of network`, tone: 'primary' as const },
        onClick: () => setStatus('active'),
      },
      {
        label: 'Suspended',
        value: summary.suspended.toLocaleString(),
        badge:
          summary.suspended > 0
            ? { text: 'Review queue', tone: 'urgent' as const }
            : { text: 'Clear', tone: 'muted' as const },
        onClick: () => setStatus('suspended'),
      },
      {
        label: 'Top performers',
        value: summary.performers.toLocaleString(),
        badge: { text: 'Trust 75+', tone: 'primary' as const },
      },
      {
        label: 'At-risk',
        value: summary.atRisk.toLocaleString(),
        badge:
          summary.atRisk > 0
            ? { text: 'Needs review', tone: 'urgent' as const }
            : { text: 'Healthy', tone: 'muted' as const },
      },
    ];
  }, [summary, setStatus]);

  const headerSub = useMemo(() => {
    if (summary === undefined) {
      return 'Verify, suspend, and monitor creator accounts across the network.';
    }
    return `Managing ${summary.total.toLocaleString()} creator${summary.total === 1 ? '' : 's'} — ${summary.active.toLocaleString()} active on platform`;
  }, [summary]);

  const footerLabel =
    filteredCreators === undefined
      ? undefined
      : `Showing ${filteredCreators.length} creator${filteredCreators.length === 1 ? '' : 's'}`;

  const detailData = useMemo(() => {
    if (!activeCreator) return null;
    return {
      id: activeCreator._id,
      name: activeCreator.name,
      handle: activeCreator.handle,
      avatarMono: activeCreator.avatarMono,
      avatarColor: activeCreator.avatarColor,
      nicheLine: nicheLabel(activeCreator),
      statusLabel: statusDisplay(activeCreator.status).label,
      verified: activeCreator.verified,
      trustScoreLabel: formatTrustScore(activeCreator.trustScore),
      winRateLabel: `${Math.round(activeCreator.winRate)}%`,
      record: activeCreator.record,
      subscribersLabel: formatSubscriberCount(
        activeCreator.activeSubscriptions ?? activeCreator.subscriberCount,
      ),
      revenueLabel: formatRevenue(activeCreator.estMonthlyRevenue ?? 0),
      joinedLabel: formatJoinedLabel(activeCreator.createdAt),
    };
  }, [activeCreator]);

  const history = useMemo(() => auditToHistory(auditRows ?? []), [auditRows]);

  async function runAction(fn: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  function closeDrawer() {
    setActiveId(null);
    setActionError(null);
  }

  return (
    <Container size="2xl">
      <Stack gap={10}>
        <StudioPageHeader
          eyebrow="Operational hub"
          title="Creators management"
          sub={headerSub}
          actions={
            <Button variant="outline" iconLeft="user" onClick={() => navigate(ADMIN.applications)}>
              Applications
            </Button>
          }
        />

        <AdminMetricStrip items={kpiItems} columns={5} />

        <Stack gap={6}>
          <AdminCreatorsFilterBar
            statusOptions={CREATOR_STATUS_FILTERS}
            status={status}
            onStatusChange={(v) => setStatus(v as CreatorStatusFilter)}
            sportOptions={sportOptions}
            sport={sport}
            onSportChange={setSport}
            verifiedOptions={CREATOR_VERIFIED_FILTERS}
            verified={verified}
            onVerifiedChange={(v) => setVerified(v as CreatorVerifiedFilter)}
            search={search}
            onSearchChange={setSearch}
          />

          <AdminCreatorsTable
            rows={tableRows}
            selectedId={activeId}
            loading={creators === undefined}
            footerLabel={footerLabel}
            emptyTitle="No creators match filters"
            emptySubtitle="Clear search or try another status, sport, or verification filter."
            onSelect={(id) => {
              setActiveId(id as Id<'creators'>);
              setActionError(null);
            }}
            onViewProfile={(id) => {
              const row = creators?.find((c) => c._id === id);
              if (row) navigate(`/creators/${row.handle}`);
            }}
            onModeration={() => navigate(ADMIN.moderation)}
          />

          {activeId && creators && !creators.some((c) => c._id === activeId) ? (
            <EmptyState
              icon="verified"
              title="Creator not in current list"
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

      <AdminCreatorInspectorDrawer
        open={Boolean(activeId)}
        onClose={closeDrawer}
        creator={detailData}
        loading={Boolean(activeId) && activeCreator === undefined}
        history={history}
        busy={busy}
        error={actionError}
        onViewProfile={
          activeCreator ? () => navigate(`/creators/${activeCreator.handle}`) : undefined
        }
        onModeration={() => navigate(ADMIN.moderation)}
        onToggleVerified={
          activeId
            ? () =>
                runAction(() =>
                  setVerifiedMutation({
                    creatorId: activeId,
                    verified: !activeCreator?.verified,
                  }),
                )
            : undefined
        }
        onSuspend={
          activeId
            ? () => runAction(() => setStatusMutation({ creatorId: activeId, status: 'suspended' }))
            : undefined
        }
        onActivate={
          activeId
            ? () => runAction(() => setStatusMutation({ creatorId: activeId, status: 'active' }))
            : undefined
        }
      />
    </Container>
  );
}
