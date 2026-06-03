import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  StudioPageHeader,
  StudioSubNav,
  Button,
  EmptyState,
  Card,
  StudioSummaryGrid,
  StudioFilterBar,
  StudioMetaChip,
  StudioPicksTable,
  type StudioPickRowData,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { useStudioContext } from '../useStudioContext';
import { demoPickRows } from '../picksDemo';
import { STUDIO, studioCreatePickUrl } from '../../lib/studioRoutes';

const FILTER_OPTIONS = [
  { label: 'All picks', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Premium', value: 'premium' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
];

const VIEW_TABS = [
  { label: 'All activity', value: 'activity' },
  { label: 'Archive', value: 'archive' },
];

function formatEventTime(value: string | number | undefined): string {
  if (value === undefined || value === '') return '—';
  const ms = typeof value === 'number' ? value : Date.parse(value);
  if (Number.isNaN(ms)) return String(value);
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function eventSortKey(row: StudioPickRowData): number {
  const ms = Date.parse(row.eventTime);
  return Number.isNaN(ms) ? 0 : ms;
}

function toRow(
  p: {
    _id: string;
    sport: string;
    eventName: string;
    eventTime: string;
    selection: string;
    title: string;
    odds: string;
    access: 'free' | 'premium' | 'vip';
    status: string;
    grade?: string | null;
  },
  navigate: ReturnType<typeof useNavigate>,
): StudioPickRowData {
  const status =
    p.status === 'published' ||
    p.status === 'draft' ||
    p.status === 'scheduled' ||
    p.status === 'archived'
      ? p.status === 'archived'
        ? 'published'
        : p.status
      : 'published';

  const result =
    p.grade === 'win' || p.grade === 'loss' || p.grade === 'push'
      ? p.grade
      : p.grade === 'pending' || !p.grade
        ? 'pending'
        : null;

  return {
    id: p._id,
    sport: p.sport,
    eventName: p.eventName,
    eventTime: formatEventTime(p.eventTime),
    pickTitle: p.selection || p.title,
    odds: p.odds,
    access: p.access,
    status: status as StudioPickRowData['status'],
    result,
    onEdit: () => navigate(studioCreatePickUrl(p._id)),
    onDuplicate: () => navigate(STUDIO.createPick),
  };
}

function matchesSearch(row: StudioPickRowData, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    row.eventName.toLowerCase().includes(q) ||
    row.pickTitle.toLowerCase().includes(q) ||
    row.sport.toLowerCase().includes(q)
  );
}

export function Picks() {
  const navigate = useNavigate();
  const ctx = useStudioContext();
  const [view, setView] = useState('activity');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('event');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const picks = useQuery(
    api.picks.byCreator,
    ctx.creatorId ? { creatorId: ctx.creatorId, limit: 200 } : 'skip',
  );

  const allRows = useMemo(() => {
    if (picks && picks.length > 0) return picks.map((p) => toRow(p, navigate));
    if (ctx.devPreview && !ctx.isLive) return demoPickRows(navigate);
    return [];
  }, [picks, ctx.devPreview, navigate]);

  const rows = useMemo(() => {
    let list = [...allRows];

    if (view === 'archive') {
      list = list.filter((r) => r.result === 'win' || r.result === 'loss' || r.result === 'push');
    }

    if (filter === 'free' || filter === 'premium') {
      list = list.filter(
        (r) => r.access === filter || (filter === 'premium' && r.access === 'vip'),
      );
    } else if (filter === 'draft' || filter === 'scheduled') {
      list = list.filter((r) => r.status === filter);
    }

    list = list.filter((r) => matchesSearch(r, search));

    if (sort === 'access') {
      list.sort((a, b) => a.access.localeCompare(b.access));
    } else if (sort === 'result') {
      list.sort((a, b) => (a.result ?? '').localeCompare(b.result ?? ''));
    } else {
      list.sort((a, b) => eventSortKey(b) - eventSortKey(a));
    }

    return list;
  }, [allRows, view, filter, sort, search]);

  const stats = useMemo(() => {
    const published = allRows.filter((r) => r.status === 'published').length;
    const drafts = allRows.filter((r) => r.status === 'draft').length;
    const scheduled = allRows.filter((r) => r.status === 'scheduled').length;
    const graded = allRows.filter(
      (r) => r.result === 'win' || r.result === 'loss' || r.result === 'push',
    );
    const wins = graded.filter((r) => r.result === 'win').length;
    const winRate = graded.length > 0 ? `${((wins / graded.length) * 100).toFixed(1)}%` : '—';

    return {
      total: allRows.length,
      published,
      drafts,
      scheduled,
      winRate,
      gradedCount: graded.length,
    };
  }, [allRows]);

  const loading = picks === undefined && !ctx.devPreview && Boolean(ctx.creatorId);

  React.useEffect(() => {
    setPage(1);
  }, [view, filter, sort, search]);

  const sortLabel =
    sort === 'event' ? 'Sort: Event date' : sort === 'result' ? 'Sort: Result' : 'Sort: Access';

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Posts & picks"
          title="Posts & picks"
          sub="Publish picks, manage drafts, and track results across your slate."
          actions={
            <Button variant="primary" iconLeft="plus" onClick={() => navigate(STUDIO.createPick)}>
              New pick
            </Button>
          }
        />

        <StudioSubNav items={VIEW_TABS} value={view} onChange={setView} />

        <StudioSummaryGrid
          items={[
            {
              id: 'total',
              icon: 'feed',
              iconTone: 'primary',
              label: 'Total picks',
              value: stats.total.toLocaleString(),
              active: filter === 'all' && view === 'activity',
              onClick: () => {
                setView('activity');
                setFilter('all');
              },
            },
            {
              id: 'pub',
              icon: 'card',
              iconTone: 'violet',
              label: 'Published',
              value: stats.published.toLocaleString(),
              active: filter === 'all' && view === 'activity',
              onClick: () => {
                setView('activity');
                setFilter('all');
              },
            },
            {
              id: 'drafts',
              icon: 'edit',
              iconTone: 'amber',
              label: 'Drafts',
              value: stats.drafts.toLocaleString(),
              delta:
                stats.scheduled > 0
                  ? { value: `${stats.scheduled} scheduled`, dir: 'flat' as const }
                  : undefined,
              active: filter === 'draft',
              onClick: () => {
                setView('activity');
                setFilter('draft');
              },
            },
            {
              id: 'wr',
              icon: 'chart',
              iconTone: 'danger',
              label: 'Win rate',
              value: stats.winRate,
              delta:
                stats.gradedCount > 0
                  ? { value: `${stats.gradedCount} graded`, dir: 'up' as const }
                  : undefined,
              active: view === 'archive',
              onClick: () => setView('archive'),
            },
          ]}
        />

        <StudioFilterBar
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
          search={{
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: 'Search picks…',
            'aria-label': 'Search picks',
          }}
          trailing={
            <StudioMetaChip
              icon="sort"
              label={sortLabel}
              onClick={() =>
                setSort((s) => (s === 'event' ? 'result' : s === 'result' ? 'access' : 'event'))
              }
            />
          }
        />

        {loading ? (
          <Card pad="lg" elev>
            <EmptyState icon="inbox" title="Loading picks…" />
          </Card>
        ) : rows.length === 0 ? (
          <Card pad="lg" elev>
            <EmptyState
              icon="inbox"
              title={search ? 'No picks match your search' : 'Create your first pick'}
              subtitle={
                search
                  ? 'Try a different query or clear filters.'
                  : 'Publish a pick to start building your track record and subscriber base.'
              }
              action={
                search ? (
                  <Button variant="secondary" onClick={() => setSearch('')}>
                    Clear search
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    iconLeft="plus"
                    onClick={() => navigate(STUDIO.createPick)}
                  >
                    Get started
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <StudioPicksTable
            rows={rows}
            page={page}
            pageSize={10}
            totalCount={rows.length}
            onPageChange={setPage}
          />
        )}
      </Stack>
    </Container>
  );
}
