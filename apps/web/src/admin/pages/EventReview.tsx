import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Button,
  StudioPageHeader,
  AdminMetricStrip,
  AdminEventReviewTable,
  AdminEventReviewDrawer,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function useEventReviewParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('id') as Id<'events'> | null;

  const setActiveId = (id: Id<'events'> | null) => {
    const params = new URLSearchParams(searchParams);
    if (id) params.set('id', id);
    else params.delete('id');
    setSearchParams(params, { replace: true });
  };

  return { activeId, setActiveId };
}

export function AdminEventReview() {
  const navigate = useNavigate();
  const { activeId, setActiveId } = useEventReviewParams();
  const summary = useQuery(api.events.eventsReviewSummary, {});
  const events = useQuery(api.events.pendingReview, { limit: 100 });
  const reviewEvent = useMutation(api.events.reviewEvent);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(() => events?.find((e) => e._id === activeId) ?? null, [events, activeId]);

  const tableRows = useMemo(() => {
    if (!events) return [];
    return events.map((e) => ({
      id: e._id,
      title: e.title ?? `${e.home} vs ${e.away}`,
      sub: e.time,
      sport: e.sport,
      league: e.league,
      source: e.sourceType ?? 'creator',
      startsLabel: formatDate(e.startsAt),
      visibility: e.visibility ?? 'public',
    }));
  }, [events]);

  const kpiItems = useMemo(() => {
    if (!summary) {
      return [
        { label: 'Pending', value: '—' },
        { label: 'Oldest (hrs)', value: '—' },
      ];
    }
    return [
      { label: 'Pending', value: String(summary.pendingCount) },
      {
        label: 'Oldest (hrs)',
        value: String(summary.oldestAgeHours),
        delta:
          summary.oldestAgeHours >= 24 ? { text: 'SLA watch', dir: 'flat' as const } : undefined,
      },
    ];
  }, [summary]);

  async function review(decision: 'approve' | 'reject') {
    if (!activeId) return;
    setError(null);
    setBusy(true);
    try {
      await reviewEvent({ eventId: activeId, decision });
      setActiveId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record review.');
    } finally {
      setBusy(false);
    }
  }

  const footerLabel =
    events === undefined
      ? undefined
      : `${events.length} event${events.length === 1 ? '' : 's'} awaiting review`;

  return (
    <Container size="2xl">
      <Stack gap={10}>
        <StudioPageHeader
          eyebrow="Operational hub"
          title="Event review"
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate('/events')}>
              Public events
            </Button>
          }
        />

        <AdminMetricStrip columns={5} items={kpiItems} />

        <AdminEventReviewTable
          rows={tableRows}
          selectedId={activeId}
          loading={events === undefined}
          footerLabel={footerLabel}
          onSelect={(id) => setActiveId(id as Id<'events'>)}
        />
      </Stack>

      <AdminEventReviewDrawer
        open={Boolean(activeId)}
        onClose={() => setActiveId(null)}
        loading={Boolean(activeId) && events === undefined}
        title={active?.title ?? (active ? `${active.home} vs ${active.away}` : undefined)}
        sub={active?.time}
        sport={active?.sport}
        league={active?.league}
        source={active?.sourceType ?? 'creator'}
        startsLabel={active ? formatDate(active.startsAt) : undefined}
        visibility={active?.visibility ?? 'public'}
        busy={busy}
        error={error}
        onApprove={() => review('approve')}
        onReject={() => review('reject')}
      />
    </Container>
  );
}
