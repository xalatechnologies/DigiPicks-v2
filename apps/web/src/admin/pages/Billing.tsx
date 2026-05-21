import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  StudioPageHeader,
  AdminMetricStrip,
  AdminBillingFilterBar,
  AdminBillingTable,
  AdminBillingDetailDrawer,
  Button,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ADMIN } from '../lib/adminRoutes';
import {
  BILLING_STATUS_FILTERS,
  formatMrr,
  formatMoneyCents,
  matchesBillingFilters,
  parseBillingStatus,
  planLabel,
  subscriptionStatusLabel,
  subscriptionStatusTone,
  type BillingRow,
  type BillingStatusFilter,
} from '../lib/billingAdmin';

function useBillingParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = parseBillingStatus(searchParams.get('status'));
  const paymentIssue = searchParams.get('payment') === '1';
  const activeId = searchParams.get('id') as Id<'subscriptions'> | null;

  const setStatus = (next: BillingStatusFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('status');
    else params.set('status', next);
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setPaymentIssue = (on: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (on) params.set('payment', '1');
    else params.delete('payment');
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setActiveId = (id: Id<'subscriptions'> | null) => {
    const params = new URLSearchParams(searchParams);
    if (id) params.set('id', id);
    else params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  return {
    status,
    paymentIssue,
    activeId,
    setStatus,
    setPaymentIssue,
    setActiveId,
    clearFilters,
  };
}

export function Billing() {
  const navigate = useNavigate();
  const { status, paymentIssue, activeId, setStatus, setPaymentIssue, setActiveId, clearFilters } =
    useBillingParams();
  const [search, setSearch] = useState('');

  const summary = useQuery(api.admin.billingSummary, {});
  const rows = useQuery(api.admin.subscriptionsList, { limit: 200 });
  const activeSub = useQuery(
    api.admin.subscriptionGet,
    activeId ? { subscriptionId: activeId } : 'skip',
  );

  const filtered = useMemo(() => {
    if (!rows) return undefined;
    return rows.filter((row) =>
      matchesBillingFilters(row as BillingRow, search, status, paymentIssue),
    );
  }, [rows, search, status, paymentIssue]);

  const tableRows = useMemo(() => {
    if (!filtered) return [];
    return filtered.map((row) => ({
      id: row.sub._id,
      monogram: row.monogram,
      subscriberName: row.subscriberName,
      subscriberEmail: row.subscriberEmail,
      creatorLabel: row.creatorName,
      planLabel: planLabel(row.sub.plan),
      priceLabel: row.priceLabel,
      statusLabel: subscriptionStatusLabel(row.sub.status),
      statusTone: subscriptionStatusTone(row.sub.status),
      renewalLabel: row.renewsLabel,
      healthLabel: row.healthLabel,
      healthTone: row.healthTone,
    }));
  }, [filtered]);

  const kpiItems = useMemo(() => {
    if (!summary) {
      return [
        { label: 'Active subs', value: '—' },
        { label: 'MRR', value: '—' },
        { label: 'Past due', value: '—' },
        { label: 'Cancellations', value: '—' },
        { label: 'Refunds', value: '—' },
      ];
    }
    return [
      {
        label: 'Active subs',
        value: summary.activeCount.toLocaleString(),
        delta: { text: `${summary.totalCount} total`, dir: 'flat' as const },
      },
      {
        label: 'MRR',
        value: formatMrr(summary.mrrCents),
        delta: { text: 'Estimated from tiers', dir: 'flat' as const },
      },
      {
        label: 'Past due',
        value: String(summary.pastDueCount),
        badge:
          summary.pastDueCount > 0
            ? { text: 'Payment issues', tone: 'urgent' as const }
            : { text: 'Clear', tone: 'muted' as const },
        onClick: () => {
          setStatus('past_due');
          setPaymentIssue(true);
        },
      },
      {
        label: 'Cancellations',
        value: String(summary.cancelledLast30Days),
        delta: { text: 'Past 30 days', dir: 'flat' as const },
        onClick: () => setStatus('cancelled'),
      },
      {
        label: 'Refunds',
        value: formatMoneyCents(summary.refundsMonthCents),
        delta: { text: `${summary.openBillingCases} open cases`, dir: 'flat' as const },
        onClick: () => navigate(ADMIN.refunds),
      },
    ];
  }, [summary, setStatus, setPaymentIssue, navigate]);

  const headerSub = useMemo(() => {
    if (!summary) return 'Platform subscription health and MRR signals.';
    return `${summary.activeCount.toLocaleString()} active · ${formatMrr(summary.mrrCents)} MRR · ${summary.pastDueCount} past due`;
  }, [summary]);

  const footerLabel =
    filtered === undefined
      ? undefined
      : `Showing ${filtered.length} subscription${filtered.length === 1 ? '' : 's'}`;

  const entitlementLabel = activeSub
    ? activeSub.accessActive
      ? 'Full access'
      : activeSub.sub.status === 'past_due'
        ? 'Degraded — grace ended'
        : 'No active access'
    : undefined;

  const entitlementMeta = activeSub
    ? activeSub.accessActive
      ? 'Entitlement active'
      : 'Review billing before restoring'
    : undefined;

  const incidents = useMemo(() => {
    if (!activeSub?.incidents) return [];
    return activeSub.incidents.map((inc) => ({
      id: inc.id,
      title: `${inc.issueType}: ${inc.caseNumber}`,
      amountLabel: inc.amountLabel,
      meta: `${inc.status} · ${inc.createdLabel}`,
      urgent: inc.priority === 'urgent' || inc.status === 'open',
    }));
  }, [activeSub]);

  function closeDrawer() {
    setActiveId(null);
  }

  return (
    <Container size="2xl">
      <Stack gap={10}>
        <StudioPageHeader
          eyebrow="Operational hub"
          title="Subscriptions & billing"
          sub={headerSub}
          actions={
            <Row gap={2} wrap>
              <Button variant="secondary" onClick={() => navigate(ADMIN.refunds)}>
                Refunds queue
              </Button>
            </Row>
          }
        />

        <AdminMetricStrip columns={5} items={kpiItems} />

        <Stack gap={6}>
          <AdminBillingFilterBar
            statusOptions={BILLING_STATUS_FILTERS}
            status={status}
            onStatusChange={(v) => setStatus(v as BillingStatusFilter)}
            search={search}
            onSearchChange={setSearch}
            pastDueCount={summary?.pastDueCount ?? 0}
            paymentIssueOnly={paymentIssue}
            onPaymentIssueChange={setPaymentIssue}
            onClearFilters={clearFilters}
          />

          <AdminBillingTable
            rows={tableRows}
            selectedId={activeId}
            loading={rows === undefined}
            footerLabel={footerLabel}
            emptyTitle="No subscriptions match"
            emptySubtitle="Clear filters or search to see the full directory."
            onSelect={(id) => setActiveId(id as Id<'subscriptions'>)}
          />
        </Stack>
      </Stack>

      <AdminBillingDetailDrawer
        open={Boolean(activeId)}
        onClose={closeDrawer}
        loading={Boolean(activeId) && activeSub === undefined}
        subscriberName={activeSub?.subscriberName}
        subscriberEmail={activeSub?.subscriberEmail}
        creatorLabel={activeSub?.creatorName}
        planLabel={activeSub ? planLabel(activeSub.sub.plan) : undefined}
        priceLabel={activeSub?.priceLabel}
        statusLabel={activeSub ? subscriptionStatusLabel(activeSub.sub.status) : undefined}
        statusTone={
          activeSub
            ? subscriptionStatusTone(activeSub.sub.status) === 'green'
              ? 'green'
              : activeSub.sub.status === 'past_due'
                ? 'amber'
                : 'mute'
            : undefined
        }
        healthLabel={activeSub?.healthLabel}
        entitlementLabel={entitlementLabel}
        entitlementMeta={entitlementMeta}
        renewsLabel={activeSub?.renewsLabel}
        startedLabel={activeSub?.startedLabel}
        stripeSubscriptionId={activeSub?.stripeSubscriptionId}
        incidents={incidents}
        onOpenRefunds={() => navigate(ADMIN.refunds)}
        onOpenSubscriber={
          activeSub?.subscriber?._id
            ? () => navigate(`${ADMIN.users}?id=${activeSub.subscriber!._id}`)
            : undefined
        }
        onOpenCreator={
          activeSub?.creator?._id
            ? () => navigate(`${ADMIN.creators}?id=${activeSub.creator!._id}`)
            : undefined
        }
      />
    </Container>
  );
}
