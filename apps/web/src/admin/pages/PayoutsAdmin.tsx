import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  StudioPageHeader,
  AdminMetricStrip,
  AdminPayoutsFilterBar,
  AdminPayoutsTable,
  AdminPayoutDetailDrawer,
  Button,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ADMIN } from '../lib/adminRoutes';
import {
  CONNECT_FILTERS,
  connectStatusLabel,
  connectStatusTone,
  formatPayoutAmount,
  formatPayoutCompact,
  formatUpcomingLabel,
  matchesPayoutFilters,
  parseConnectFilter,
  payoutMethodLabel,
  payoutStatusLabel,
  payoutStatusTone,
  type ConnectFilter,
  type PayoutCreatorRow,
} from '../lib/payoutAdmin';

function usePayoutParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const connect = parseConnectFilter(searchParams.get('connect'));
  const issuesOnly = searchParams.get('issues') === '1';
  const activeId = searchParams.get('id') as Id<'creators'> | null;

  const setConnect = (next: ConnectFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('connect');
    else params.set('connect', next);
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setIssuesOnly = (on: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (on) params.set('issues', '1');
    else params.delete('issues');
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setActiveId = (id: Id<'creators'> | null) => {
    const params = new URLSearchParams(searchParams);
    if (id) params.set('id', id);
    else params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  return { connect, issuesOnly, activeId, setConnect, setIssuesOnly, setActiveId, clearFilters };
}

export function PayoutsAdmin() {
  const navigate = useNavigate();
  const { connect, issuesOnly, activeId, setConnect, setIssuesOnly, setActiveId, clearFilters } =
    usePayoutParams();
  const [search, setSearch] = useState('');

  const summary = useQuery(api.admin.payoutsSummary, {});
  const rows = useQuery(api.admin.payoutsCreatorsList, { limit: 200 });
  const active = useQuery(api.admin.payoutCreatorGet, activeId ? { creatorId: activeId } : 'skip');

  const filtered = useMemo(() => {
    if (!rows) return undefined;
    return rows.filter((row) =>
      matchesPayoutFilters(row as PayoutCreatorRow, search, connect, issuesOnly),
    );
  }, [rows, search, connect, issuesOnly]);

  const issuesCount = useMemo(() => {
    if (!rows) return 0;
    return rows.filter((r) => r.failedCount > 0 || r.connectStatus === 'restricted').length;
  }, [rows]);

  const tableRows = useMemo(() => {
    if (!filtered) return [];
    return filtered.map((row) => {
      const payoutRow = row as PayoutCreatorRow;
      return {
        id: row.creatorId,
        monogram: row.monogram,
        creatorName: row.name,
        nicheLine: row.nicheLine,
        paidLabel: formatPayoutAmount(row.paidTotal),
        upcomingAmountLabel: row.pendingTotal > 0 ? formatPayoutAmount(row.pendingTotal) : '—',
        upcomingDateLabel: formatUpcomingLabel(row.nextPendingAt),
        statusLabel: payoutStatusLabel(payoutRow),
        statusTone: payoutStatusTone(payoutRow),
        methodLabel: payoutMethodLabel(row.stripeConnectAccountId),
      };
    });
  }, [filtered]);

  const kpiItems = useMemo(() => {
    if (!summary) {
      return [
        { label: 'Total paid', value: '—' },
        { label: 'Pending', value: '—' },
        { label: 'Failed', value: '—' },
        { label: 'Platform revenue', value: '—' },
        { label: 'Creator earnings', value: '—' },
      ];
    }
    return [
      {
        label: 'Total paid',
        value: formatPayoutCompact(summary.totalPaid),
        delta: { text: `${summary.creatorCount} creators`, dir: 'flat' as const },
      },
      {
        label: 'Pending',
        value: String(summary.pendingCount),
        delta: { text: 'Payout records', dir: 'flat' as const },
        onClick: () => setConnect('active'),
      },
      {
        label: 'Failed',
        value: String(summary.failedCount),
        badge:
          summary.failedCount > 0
            ? { text: 'Review', tone: 'urgent' as const }
            : { text: 'Clear', tone: 'muted' as const },
        onClick: () => setIssuesOnly(true),
      },
      {
        label: 'Platform revenue',
        value: formatPayoutCompact(summary.platformRevenue),
        delta: {
          text: `${Math.round(summary.feeRate * 100)}% fee`,
          dir: 'flat' as const,
        },
      },
      {
        label: 'Creator earnings',
        value: formatPayoutCompact(summary.creatorEarnings),
        delta: {
          text: `${summary.connectActive} Connect active`,
          dir: 'flat' as const,
        },
        onClick: () => setConnect('active'),
      },
    ];
  }, [summary, setConnect, setIssuesOnly]);

  const headerSub = useMemo(() => {
    if (!summary) {
      return 'Creator Connect status and disbursement records across the platform.';
    }
    return `${summary.connectActive} Connect active · ${formatPayoutCompact(summary.totalPaid)} paid · ${summary.pendingCount} pending`;
  }, [summary]);

  const footerLabel =
    filtered === undefined
      ? undefined
      : `Showing ${filtered.length} creator${filtered.length === 1 ? '' : 's'}`;

  const history = useMemo(() => {
    if (!active?.history) return [];
    return active.history.map((h) => ({
      id: h.id,
      periodLabel: h.periodLabel,
      amountLabel: formatPayoutAmount(h.amount),
      status: h.status,
      paidLabel: h.paidLabel,
    }));
  }, [active]);

  return (
    <Container size="2xl">
      <Stack gap={10}>
        <StudioPageHeader
          eyebrow="Operational hub"
          title="Payouts & finance"
          sub={headerSub}
          actions={
            <Row gap={2} wrap>
              <Button variant="secondary" onClick={() => navigate(ADMIN.billing)}>
                Billing
              </Button>
              <Button variant="outline" onClick={() => navigate(ADMIN.creators)}>
                Creators
              </Button>
            </Row>
          }
        />

        <AdminMetricStrip columns={5} items={kpiItems} />

        <Stack gap={6}>
          <AdminPayoutsFilterBar
            connectOptions={CONNECT_FILTERS}
            connect={connect}
            onConnectChange={(v) => setConnect(v as ConnectFilter)}
            search={search}
            onSearchChange={setSearch}
            issuesCount={issuesCount}
            issuesOnly={issuesOnly}
            onIssuesChange={setIssuesOnly}
            onClearFilters={clearFilters}
          />

          <AdminPayoutsTable
            rows={tableRows}
            selectedId={activeId}
            loading={rows === undefined}
            footerLabel={footerLabel}
            emptyTitle="No creators match"
            emptySubtitle="Clear filters or search to see the full payout directory."
            onSelect={(id) => setActiveId(id as Id<'creators'>)}
          />
        </Stack>
      </Stack>

      <AdminPayoutDetailDrawer
        open={Boolean(activeId)}
        onClose={() => setActiveId(null)}
        loading={Boolean(activeId) && active === undefined}
        creatorName={active?.name}
        handleLine={active ? `@${active.handle}` : undefined}
        nicheLine={active?.nicheLine}
        connectLabel={active ? connectStatusLabel(active.connectStatus) : undefined}
        connectTone={active ? connectStatusTone(active.connectStatus) : undefined}
        accountTail={active?.stripeConnectAccountId?.slice(-8)}
        paidLabel={active ? formatPayoutAmount(active.paidTotal) : undefined}
        pendingLabel={active ? formatPayoutAmount(active.pendingTotal) : undefined}
        failedCount={active?.failedCount}
        history={history}
        onOpenCreator={activeId ? () => navigate(`${ADMIN.creators}?id=${activeId}`) : undefined}
        onOpenBilling={() => navigate(ADMIN.billing)}
      />
    </Container>
  );
}
