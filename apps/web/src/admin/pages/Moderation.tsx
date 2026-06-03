import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  StudioPageHeader,
  AdminMetricStrip,
  AdminModerationFilterBar,
  AdminModerationTable,
  AdminModerationDetailDrawer,
  Button,
  Muted,
  type IconName,
  type AdminModerationStatusTone,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ADMIN } from '../lib/adminRoutes';
import {
  MODERATION_TYPE_FILTERS,
  formatFlaggedAt,
  itemTypeLabel,
  matchesModerationSearch,
  parseModerationType,
  type ModerationQueueItem,
  type ModerationTypeFilter,
} from '../lib/moderationAdmin';

function typeIcon(type: ModerationQueueItem['itemType']): IconName {
  switch (type) {
    case 'event':
      return 'calendar';
    case 'application':
      return 'user';
    case 'dispute':
      return 'flag';
    case 'billing':
      return 'dollar';
    default:
      return 'shield';
  }
}

function statusTone(status: string): AdminModerationStatusTone {
  const lower = status.toLowerCase();
  if (lower.includes('open') || lower.includes('flagged') || lower.includes('submitted')) {
    return 'amber';
  }
  if (lower.includes('review')) return 'blue';
  return 'mute';
}

function severityLabel(severity: ModerationQueueItem['severity']): string {
  if (severity === 'critical') return 'Critical';
  if (severity === 'high') return 'High';
  return 'Normal';
}

function useModerationParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = parseModerationType(searchParams.get('type'));
  const activeKey = searchParams.get('item');

  const setType = (next: ModerationTypeFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('type');
    else params.set('type', next);
    params.delete('item');
    setSearchParams(params, { replace: true });
  };

  const setActiveKey = (key: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (key) params.set('item', key);
    else params.delete('item');
    setSearchParams(params, { replace: true });
  };

  return { type, activeKey, setType, setActiveKey };
}

export function Moderation() {
  const navigate = useNavigate();
  const { type, activeKey, setType, setActiveKey } = useModerationParams();
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = useQuery(api.admin.moderationSummary, {});
  const queue = useQuery(api.admin.moderationQueue, {
    type: type === 'all' ? undefined : type,
    limit: 200,
  });
  const reviewEvent = useMutation(api.events.reviewEvent);

  const filtered = useMemo(() => {
    if (!queue) return undefined;
    return queue.filter((item) => matchesModerationSearch(item, search));
  }, [queue, search]);

  const active = useMemo(
    () => filtered?.find((item) => item.key === activeKey) ?? null,
    [filtered, activeKey],
  );

  const tableRows = useMemo(() => {
    if (!filtered) return [];
    return filtered.map((item) => ({
      key: item.key,
      typeLabel: itemTypeLabel(item.itemType),
      typeIcon: typeIcon(item.itemType),
      subject: item.subject,
      creatorLabel: item.creatorLabel,
      reason: item.reason,
      severity: item.severity,
      severityLabel: severityLabel(item.severity),
      flaggedAtLabel: formatFlaggedAt(item.createdAt),
      statusLabel: item.status,
      statusTone: statusTone(item.status),
    }));
  }, [filtered]);

  const kpiItems = useMemo(() => {
    if (!summary) {
      return [
        { label: 'Pending review', value: '—' },
        { label: 'Events', value: '—' },
        { label: 'Applications', value: '—' },
        { label: 'Disputes', value: '—' },
        { label: 'Billing', value: '—' },
      ];
    }
    return [
      {
        label: 'Pending review',
        value: String(summary.totalPending),
        badge:
          summary.highPriority > 0
            ? { text: `${summary.highPriority} urgent`, tone: 'urgent' as const }
            : { text: 'Clear', tone: 'muted' as const },
      },
      {
        label: 'Events',
        value: String(summary.pendingEvents),
        delta: { text: 'Creator-submitted', dir: 'flat' as const },
        onClick: () => setType('event'),
      },
      {
        label: 'Applications',
        value: String(summary.pendingApplications),
        badge:
          summary.flaggedApplications > 0
            ? { text: `${summary.flaggedApplications} flagged`, tone: 'priority' as const }
            : undefined,
        onClick: () => setType('application'),
      },
      {
        label: 'Disputes',
        value: String(summary.openDisputes + summary.reviewingDisputes),
        delta: { text: `${summary.openDisputes} open`, dir: 'flat' as const },
        onClick: () => setType('dispute'),
      },
      {
        label: 'Billing',
        value: String(summary.openBilling),
        delta: { text: 'Refund cases', dir: 'flat' as const },
        onClick: () => setType('billing'),
      },
    ];
  }, [summary, setType]);

  async function handleEventReview(decision: 'approve' | 'reject') {
    if (!active || active.itemType !== 'event') return;
    setError(null);
    setBusy(true);
    try {
      await reviewEvent({
        eventId: active.entityId as Id<'events'>,
        decision,
      });
      setActiveKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record review.');
    } finally {
      setBusy(false);
    }
  }

  function openDedicatedQueue() {
    if (!active) return;
    switch (active.itemType) {
      case 'application':
        navigate(`${ADMIN.applications}?id=${active.entityId}`);
        break;
      case 'dispute':
        navigate(ADMIN.disputes);
        break;
      case 'billing':
        navigate(ADMIN.refunds);
        break;
      case 'event':
        navigate(ADMIN.eventsReview);
        break;
      default:
        break;
    }
  }

  const drawerPrimary =
    active?.itemType === 'application'
      ? 'Open application'
      : active?.itemType === 'dispute'
        ? 'Open dispute queue'
        : active?.itemType === 'billing'
          ? 'Open refunds'
          : undefined;

  return (
    <Container size="2xl">
      <Stack gap={10}>
        <StudioPageHeader
          eyebrow="Operational hub"
          title="Content moderation"
          actions={
            <Row gap={2} wrap>
              <Button variant="secondary" onClick={() => navigate(ADMIN.eventsReview)}>
                Events queue
              </Button>
              <Button variant="secondary" onClick={() => navigate(ADMIN.disputes)}>
                Disputes
              </Button>
            </Row>
          }
        />

        <AdminMetricStrip columns={5} items={kpiItems} />

        <Stack gap={6}>
          <AdminModerationFilterBar
            typeOptions={MODERATION_TYPE_FILTERS}
            type={type}
            onTypeChange={(v) => setType(v as ModerationTypeFilter)}
            search={search}
            onSearchChange={setSearch}
          />

          <AdminModerationTable
            rows={tableRows}
            selectedKey={activeKey}
            loading={queue === undefined}
            footerLabel={
              filtered
                ? `Showing ${filtered.length} item${filtered.length === 1 ? '' : 's'}`
                : undefined
            }
            emptyTitle="Queue clear"
            emptySubtitle="No moderation items match the current filters."
            onSelect={setActiveKey}
            onInspect={setActiveKey}
          />
        </Stack>

        {error ? <Muted>{error}</Muted> : null}

        <AdminModerationDetailDrawer
          open={Boolean(activeKey)}
          onClose={() => setActiveKey(null)}
          loading={Boolean(activeKey) && !active}
          typeLabel={active ? itemTypeLabel(active.itemType) : undefined}
          subject={active?.subject}
          creatorLabel={active?.creatorLabel}
          reason={active?.reason}
          statusLabel={active?.status}
          flaggedAtLabel={active ? formatFlaggedAt(active.createdAt) : undefined}
          detail={active?.detail}
          severity={active?.severity}
          severityLabel={active ? severityLabel(active.severity) : undefined}
          onApprove={active?.itemType === 'event' ? () => handleEventReview('approve') : undefined}
          onReject={active?.itemType === 'event' ? () => handleEventReview('reject') : undefined}
          primaryActionLabel={drawerPrimary}
          onPrimaryAction={active && active.itemType !== 'event' ? openDedicatedQueue : undefined}
          secondaryActionLabel={active?.itemType === 'event' ? 'Open events queue' : undefined}
          onSecondaryAction={
            active?.itemType === 'event' ? () => navigate(ADMIN.eventsReview) : undefined
          }
          busy={busy}
        />
      </Stack>
    </Container>
  );
}
