import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Button,
  EmptyState,
  StudioPageHeader,
  AdminApplicationsFilterBar,
  AdminApplicationsTable,
  ApplicationReviewDrawer,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ADMIN } from '../lib/adminRoutes';
import {
  APPLICATION_STATUS_FILTERS,
  auditToHistory,
  formatSubmittedLabel,
  matchesApplicationSearch,
  nicheChip,
  parseApplicationStatus,
  statusDisplay,
  tableStatusTone,
  toDrawerApplicant,
  type ApplicationStatus,
} from '../lib/applicationReview';

function useApplicationParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = parseApplicationStatus(searchParams.get('status'));
  const activeId = searchParams.get('id') as Id<'applications'> | null;

  const setStatus = (next: ApplicationStatus) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', next);
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setActiveId = (id: Id<'applications'> | null) => {
    const params = new URLSearchParams(searchParams);
    if (id) {
      params.set('id', id);
    } else {
      params.delete('id');
    }
    setSearchParams(params, { replace: true });
  };

  return { status, activeId, setStatus, setActiveId };
}

export function Applications() {
  const navigate = useNavigate();
  const { status, activeId, setStatus, setActiveId } = useApplicationParams();
  const [search, setSearch] = useState('');
  const [niche, setNiche] = useState('all');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const queueCounts = useQuery(api.applications.queueCounts, {});
  const apps = useQuery(api.applications.listByStatus, { status });
  const activeApp = useQuery(api.applications.get, activeId ? { id: activeId } : 'skip');
  const auditRows = useQuery(
    api.audit.listByEntity,
    activeId ? { entityType: 'application', entityId: activeId, limit: 20 } : 'skip',
  );

  const review = useMutation(api.applications.review);
  const appendNote = useMutation(api.applications.appendAdminNote);

  const nicheOptions = useMemo(() => {
    const sports = new Set<string>();
    for (const app of apps ?? []) {
      if (app.sport) sports.add(app.sport);
    }
    return [
      { value: 'all', label: 'All sports' },
      ...[...sports].sort().map((sport) => ({ value: sport, label: sport })),
    ];
  }, [apps]);

  const filteredApps = useMemo(() => {
    if (!apps) return undefined;
    return apps.filter((app) => matchesApplicationSearch(app, search, niche));
  }, [apps, search, niche]);

  const tableRows = useMemo(() => {
    if (!filteredApps) return [];
    return filteredApps.map((app) => {
      const display = statusDisplay(app.status as ApplicationStatus);
      return {
        id: app._id,
        name: app.name,
        handle: app.handle,
        email: app.email,
        nicheLabel: nicheChip(app.sport, app.niche),
        submittedLabel: formatSubmittedLabel(app.submittedAt),
        statusLabel: display.label,
        statusTone: tableStatusTone(display.tone),
        proofCount: app.proofCount,
        hasWinClaim: Boolean(app.winClaim),
      };
    });
  }, [filteredApps]);

  const drawerApplicant = useMemo(() => {
    if (!activeApp) return null;
    return toDrawerApplicant(activeApp);
  }, [activeApp]);

  const history = useMemo(() => auditToHistory(auditRows ?? []), [auditRows]);

  const filterSummary =
    filteredApps === undefined
      ? 'Loading…'
      : `${filteredApps.length} in ${APPLICATION_STATUS_FILTERS.find((f) => f.value === status)?.label ?? status}`;

  function closeDrawer() {
    setActiveId(null);
    setNotes('');
    setActionError(null);
  }

  async function runReview(next: ApplicationStatus, withNotes = true) {
    if (!activeId) return;
    setBusy(true);
    setActionError(null);
    try {
      await review({
        id: activeId,
        status: next,
        reviewNotes: withNotes ? notes.trim() || undefined : undefined,
      });
      if (next === 'approved') {
        navigate(ADMIN.creators);
        return;
      }
      closeDrawer();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddNote() {
    if (!activeId || !notes.trim()) return;
    setBusy(true);
    setActionError(null);
    try {
      await appendNote({ id: activeId, body: notes.trim() });
      setNotes('');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Could not save note');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container size="2xl">
      <Stack gap={8}>
        <StudioPageHeader
          eyebrow="Operational hub"
          title="Creator applications"
          actions={undefined}
        />

        <AdminApplicationsFilterBar
          statusOptions={APPLICATION_STATUS_FILTERS}
          status={status}
          onStatusChange={(value) => setStatus(value as ApplicationStatus)}
          search={search}
          onSearchChange={setSearch}
          nicheOptions={nicheOptions}
          niche={niche}
          onNicheChange={setNiche}
          summary={filterSummary}
        />

        <AdminApplicationsTable
          rows={tableRows}
          selectedId={activeId}
          loading={apps === undefined}
          emptyTitle="No applications in this queue"
          emptySubtitle={
            status === 'submitted'
              ? 'New submissions will appear here after creators apply.'
              : 'Try another status filter or clear search.'
          }
          onSelect={(id) => {
            setActiveId(id as Id<'applications'>);
            setNotes('');
            setActionError(null);
          }}
        />

        {activeId && apps && !apps.some((a) => a._id === activeId) ? (
          <EmptyState
            icon="user"
            title="Application not in this queue"
            subtitle="It may have moved to another status. Clear the selection or switch filters."
            action={
              <Button variant="secondary" onClick={closeDrawer}>
                Close review
              </Button>
            }
          />
        ) : null}
      </Stack>

      <ApplicationReviewDrawer
        open={Boolean(activeId)}
        onClose={closeDrawer}
        applicant={drawerApplicant}
        loading={activeId !== null && activeApp === undefined}
        history={history}
        note={notes}
        onNoteChange={setNotes}
        busy={busy}
        error={actionError}
        onApprove={() => runReview('approved')}
        onReject={() => runReview('rejected')}
        onRequestInfo={() => runReview('more_info')}
        onMarkInReview={() => runReview('review', false)}
        onFlag={() => runReview('flagged', false)}
        onAddNote={handleAddNote}
      />
    </Container>
  );
}
