import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Heading,
  Eyebrow,
  Muted,
  Select,
  Button,
  EmptyState,
  Card,
  StudioSubNav,
  StudioFilterPills,
  StudioPicksTable,
  QuickActionGrid,
  type StudioPickRowData,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { hasDevStudioPreview } from '../../lib/devDemoLogin';
import { studioCrossLinks } from '../../lib/studioCrossLinks';
import { STUDIO } from '../../lib/studioRoutes';

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

const DEMO_ROWS: StudioPickRowData[] = [
  {
    id: 'demo-1',
    sport: 'NBA',
    eventName: 'Lakers vs Celtics',
    eventTime: 'Nov 24, 2023 · 7:30 PM EST',
    pickTitle: 'Over 215.5 Points',
    odds: '-110',
    access: 'premium',
    status: 'published',
    result: 'pending',
  },
  {
    id: 'demo-2',
    sport: 'NFL',
    eventName: 'Chiefs vs Eagles',
    eventTime: 'Nov 23, 2023 · 8:15 PM EST',
    pickTitle: 'Chiefs ML',
    odds: '+105',
    access: 'free',
    status: 'draft',
    result: null,
  },
  {
    id: 'demo-3',
    sport: 'Soccer',
    eventName: 'Man City vs Liverpool',
    eventTime: 'Nov 22, 2023 · 12:30 PM EST',
    pickTitle: 'Both teams to score',
    odds: '-140',
    access: 'vip',
    status: 'published',
    result: 'win',
  },
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
    p.status === 'pending'
      ? p.status
      : 'pending';

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
    status,
    result,
    onEdit: () => navigate(STUDIO.createPick),
  };
}

export function Picks() {
  const navigate = useNavigate();
  const devPreview = hasDevStudioPreview();
  const [view, setView] = useState('activity');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('event');
  const [page, setPage] = useState(1);

  const me = useQuery(api.users.meSafe);
  const creator = useQuery(api.creators.get, me?.creatorId ? { id: me.creatorId } : 'skip');
  const picks = useQuery(
    api.picks.byCreator,
    creator?._id ? { creatorId: creator._id, limit: 100 } : 'skip',
  );

  const rows = useMemo(() => {
    const source =
      picks && picks.length > 0
        ? picks.map((p) => toRow(p, navigate))
        : devPreview
          ? DEMO_ROWS
          : [];

    let list = [...source];

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

    if (sort === 'access') {
      list.sort((a, b) => a.access.localeCompare(b.access));
    } else if (sort === 'result') {
      list.sort((a, b) => (a.result ?? '').localeCompare(b.result ?? ''));
    }

    return list;
  }, [picks, devPreview, view, filter, sort, navigate]);

  const loading = picks === undefined && !devPreview && Boolean(creator?._id);

  return (
    <Container size="2xl">
      <Stack gap={8}>
        <Stack gap={3}>
          <Eyebrow>Studio · Posts &amp; picks</Eyebrow>
          <Row between wrap>
            <Stack gap={2}>
              <Heading level={1} size="2xl">
                Posts &amp; picks
              </Heading>
              <StudioSubNav items={VIEW_TABS} value={view} onChange={setView} />
            </Stack>
            <Button variant="primary" iconLeft="plus" onClick={() => navigate(STUDIO.createPick)}>
              New pick
            </Button>
          </Row>
        </Stack>

        <Row between wrap>
          <StudioFilterPills options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
          <Stack gap={1}>
            <Eyebrow>Sort by</Eyebrow>
            <Select
              id="picks-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort picks"
            >
              <option value="event">Latest event date</option>
              <option value="result">Performance (result)</option>
              <option value="access">Access level</option>
            </Select>
          </Stack>
        </Row>

        {loading ? (
          <Card pad="lg" elev>
            <EmptyState icon="inbox" title="Loading picks…" />
          </Card>
        ) : rows.length === 0 ? (
          <Card pad="lg" elev>
            <EmptyState
              icon="inbox"
              title="Create your first pick"
              subtitle="Your dashboard is ready — publish a pick to start building your track record and subscriber base."
              action={
                <Button
                  variant="primary"
                  iconLeft="plus"
                  onClick={() => navigate('/dashboard/create')}
                >
                  Get started
                </Button>
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

        <QuickActionGrid title="Related" items={studioCrossLinks('picks', navigate)} />
      </Stack>
    </Container>
  );
}
