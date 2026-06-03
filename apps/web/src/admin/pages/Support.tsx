import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  StudioPageHeader,
  AdminMetricStrip,
  AdminSupportFilterBar,
  AdminSupportTable,
  AdminDisputeDetailDrawer,
  AdminBillingCaseDetailDrawer,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import {
  SUPPORT_QUEUE_FILTERS,
  matchesSupportSearch,
  parseSupportKind,
  parseSupportQueue,
  toSupportTableRows,
  type SupportQueueFilter,
} from '../lib/supportAdmin';
import {
  disputeStatusLabel,
  disputeStatusTone,
  fmtDisputeTime,
  type DisputeStatus,
} from '../lib/disputeAdmin';
import { billingStatusTone, fmtBillingNoteTime } from '../lib/refundAdmin';

export type AdminSupportHubProps = {
  presetQueue?: SupportQueueFilter;
  title?: string;
};

function useSupportParams(presetQueue?: SupportQueueFilter) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queue = parseSupportQueue(searchParams.get('queue'), presetQueue);
  const activeId = searchParams.get('id');
  const activeKind = parseSupportKind(searchParams.get('kind'));
  const urgentOnly = searchParams.get('urgent') === '1';
  const slaOnly = searchParams.get('sla') === '1';

  const setQueue = (next: SupportQueueFilter) => {
    const params = new URLSearchParams(searchParams);
    if (presetQueue) {
      if (next === presetQueue) params.delete('queue');
      else params.set('queue', next);
    } else if (next === 'all') params.delete('queue');
    else params.set('queue', next);
    params.delete('id');
    params.delete('kind');
    setSearchParams(params, { replace: true });
  };

  const setSelection = (id: string | null, kind: 'pick' | 'billing' | null) => {
    const params = new URLSearchParams(searchParams);
    if (id && kind) {
      params.set('id', id);
      params.set('kind', kind);
    } else {
      params.delete('id');
      params.delete('kind');
    }
    setSearchParams(params, { replace: true });
  };

  const setUrgentOnly = (on: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (on) params.set('urgent', '1');
    else params.delete('urgent');
    setSearchParams(params, { replace: true });
  };

  const setSlaOnly = (on: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (on) params.set('sla', '1');
    else params.delete('sla');
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (presetQueue && presetQueue !== 'all') params.set('queue', presetQueue);
    setSearchParams(params, { replace: true });
  };

  return {
    queue,
    activeId,
    activeKind,
    urgentOnly,
    slaOnly,
    setQueue,
    setSelection,
    setUrgentOnly,
    setSlaOnly,
    clearFilters,
  };
}

export function AdminSupportHub({
  presetQueue,
  title = 'Support & disputes',
}: AdminSupportHubProps) {
  const {
    queue,
    activeId,
    activeKind,
    urgentOnly,
    slaOnly,
    setQueue,
    setSelection,
    setUrgentOnly,
    setSlaOnly,
    clearFilters,
  } = useSupportParams(presetQueue);
  const [search, setSearch] = useState('');

  const summary = useQuery(api.admin.supportHubSummary, {});
  const queueRows = useQuery(api.admin.supportHubQueue, {
    queue: queue === 'all' ? undefined : queue,
    urgentOnly: urgentOnly || undefined,
    limit: 200,
  });

  const disputeDetail = useQuery(
    api.disputes.get,
    activeId && activeKind === 'pick' ? { disputeId: activeId as Id<'disputes'> } : 'skip',
  );
  const billingDetail = useQuery(
    api.billingCases.billingCaseGet,
    activeId && activeKind === 'billing' ? { caseId: activeId as Id<'billingCases'> } : 'skip',
  );

  const transitionDispute = useMutation(api.disputes.transition);
  const transitionBilling = useMutation(api.billingCases.transition);
  const addBillingNote = useMutation(api.billingCases.addNote);

  const [resolution, setResolution] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setResolution(disputeDetail?.dispute.resolution ?? '');
  }, [disputeDetail?.dispute._id]);

  const filtered = useMemo(() => {
    if (!queueRows) return undefined;
    let rows = queueRows;
    if (slaOnly) rows = rows.filter((r) => r.slaAtRisk);
    if (search.trim()) rows = rows.filter((r) => matchesSupportSearch(r, search));
    return rows;
  }, [queueRows, slaOnly, search]);

  const tableRows = useMemo(() => (filtered ? toSupportTableRows(filtered) : []), [filtered]);

  const kpiItems = useMemo(() => {
    if (!summary) {
      return [
        { label: 'Open tickets', value: '—' },
        { label: 'High priority', value: '—' },
        { label: 'Billing disputes', value: '—' },
        { label: 'Content disputes', value: '—' },
        { label: 'SLA at risk', value: '—' },
      ];
    }
    return [
      {
        label: 'Open tickets',
        value: String(summary.openTickets),
        onClick: () => setQueue('all'),
      },
      {
        label: 'High priority',
        value: String(summary.highPriority),
        badge: summary.highPriority > 0 ? { text: 'Urgent', tone: 'urgent' as const } : undefined,
        onClick: () => setUrgentOnly(true),
      },
      {
        label: 'Billing disputes',
        value: String(summary.billingDisputes),
        onClick: () => setQueue('billing'),
      },
      {
        label: 'Content disputes',
        value: String(summary.contentDisputes),
        onClick: () => setQueue('pick'),
      },
      {
        label: 'SLA at risk',
        value: String(summary.slaAtRisk),
        delta:
          summary.slaAtRisk > 0 ? { text: 'Needs attention', dir: 'flat' as const } : undefined,
        onClick: () => setSlaOnly(true),
      },
    ];
  }, [summary, setQueue, setUrgentOnly, setSlaOnly]);

  const footerLabel =
    filtered === undefined
      ? undefined
      : `Showing ${filtered.length} ticket${filtered.length === 1 ? '' : 's'}`;

  async function handleDisputeTransition(next: DisputeStatus) {
    if (!activeId || activeKind !== 'pick') return;
    setError(null);
    setBusy(true);
    try {
      await transitionDispute({
        disputeId: activeId as Id<'disputes'>,
        status: next,
        resolution: resolution.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update dispute.');
    } finally {
      setBusy(false);
    }
  }

  async function handleBillingTransition(
    status: 'under_review' | 'pending_finance' | 'escalated' | 'refunded' | 'denied' | 'closed',
  ) {
    if (!activeId || activeKind !== 'billing') return;
    setError(null);
    setBusy(true);
    try {
      await transitionBilling({ caseId: activeId as Id<'billingCases'>, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update case.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddBillingNote() {
    if (!activeId || activeKind !== 'billing' || !noteDraft.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await addBillingNote({ caseId: activeId as Id<'billingCases'>, body: noteDraft });
      setNoteDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add note.');
    } finally {
      setBusy(false);
    }
  }

  const disputeStatus = disputeDetail?.dispute.status;
  const billingStatus = billingDetail?.case.status;

  return (
    <Container size="2xl">
      <Stack gap={10}>
        <StudioPageHeader eyebrow="Operational hub" title={title} />

        <AdminMetricStrip columns={5} items={kpiItems} />

        <Stack gap={6}>
          <AdminSupportFilterBar
            queueOptions={[...SUPPORT_QUEUE_FILTERS]}
            queue={queue}
            onQueueChange={(v) => setQueue(v as SupportQueueFilter)}
            search={search}
            onSearchChange={setSearch}
            urgentOnly={urgentOnly}
            onUrgentChange={setUrgentOnly}
            slaAtRiskCount={summary?.slaAtRisk ?? 0}
            slaAtRiskOnly={slaOnly}
            onSlaAtRiskChange={setSlaOnly}
            onClearFilters={clearFilters}
          />

          <AdminSupportTable
            rows={tableRows}
            selectedId={activeId}
            selectedKind={activeKind}
            loading={queueRows === undefined}
            footerLabel={footerLabel}
            emptyTitle="No tickets match"
            emptySubtitle="Clear filters or try another queue type."
            onSelect={(id, kind) => setSelection(id, kind)}
          />
        </Stack>
      </Stack>

      <AdminDisputeDetailDrawer
        open={Boolean(activeId) && activeKind === 'pick'}
        onClose={() => setSelection(null, null)}
        loading={Boolean(activeId) && activeKind === 'pick' && disputeDetail === undefined}
        pickTitle={disputeDetail?.pick?.title}
        creatorLabel={
          disputeDetail?.creator?.handle ? `@${disputeDetail.creator.handle}` : undefined
        }
        openerLabel={disputeDetail?.opener?.email ?? disputeDetail?.opener?.name}
        reason={disputeDetail?.dispute.reason}
        detail={disputeDetail?.dispute.detail}
        statusLabel={disputeStatus ? disputeStatusLabel(disputeStatus) : undefined}
        statusTone={disputeStatus ? disputeStatusTone(disputeStatus) : undefined}
        openedLabel={disputeDetail ? fmtDisputeTime(disputeDetail.dispute.createdAt) : undefined}
        resolution={resolution}
        onResolutionChange={setResolution}
        notes={disputeDetail?.dispute.notes.map((n) => ({
          createdLabel: fmtDisputeTime(n.createdAt),
          body: n.body,
        }))}
        busy={busy}
        error={error}
        canReview={disputeStatus === 'open'}
        canResolve={disputeStatus === 'open' || disputeStatus === 'under_review'}
        canDismiss={disputeStatus === 'open' || disputeStatus === 'under_review'}
        onMarkReviewing={() => handleDisputeTransition('under_review')}
        onResolve={() => handleDisputeTransition('resolved')}
        onDismiss={() => handleDisputeTransition('dismissed')}
      />

      <AdminBillingCaseDetailDrawer
        open={Boolean(activeId) && activeKind === 'billing'}
        onClose={() => setSelection(null, null)}
        loading={Boolean(activeId) && activeKind === 'billing' && billingDetail === undefined}
        caseNumber={billingDetail?.case.caseNumber}
        subscriberLabel={billingDetail?.subscriber?.email ?? billingDetail?.subscriber?.name}
        creatorLabel={
          billingDetail?.creator?.handle ? `@${billingDetail.creator.handle}` : undefined
        }
        issueLabel={billingDetail?.issueLabel}
        amountLabel={billingDetail?.amountLabel}
        statusLabel={billingDetail?.statusLabel}
        statusTone={billingStatus ? billingStatusTone(billingStatus) : undefined}
        createdLabel={billingDetail?.createdLabel}
        updatedLabel={billingDetail?.updatedLabel}
        noteDraft={noteDraft}
        onNoteDraftChange={setNoteDraft}
        notes={billingDetail?.case.internalNotes.map((n) => ({
          createdLabel: fmtBillingNoteTime(n.createdAt),
          body: n.body,
        }))}
        busy={busy}
        error={error}
        onAddNote={handleAddBillingNote}
        onUnderReview={
          billingStatus === 'open' ? () => handleBillingTransition('under_review') : undefined
        }
        onPendingFinance={
          billingStatus === 'under_review'
            ? () => handleBillingTransition('pending_finance')
            : undefined
        }
        onEscalate={
          billingStatus === 'under_review' || billingStatus === 'pending_finance'
            ? () => handleBillingTransition('escalated')
            : undefined
        }
        onRefund={
          billingStatus !== 'refunded' && billingStatus !== 'closed'
            ? () => handleBillingTransition('refunded')
            : undefined
        }
        onDeny={
          billingStatus !== 'denied' && billingStatus !== 'closed'
            ? () => handleBillingTransition('denied')
            : undefined
        }
        onCloseCase={
          billingStatus !== 'closed' ? () => handleBillingTransition('closed') : undefined
        }
      />
    </Container>
  );
}

export function Support() {
  return <AdminSupportHub />;
}
