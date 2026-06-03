import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Stack,
  StudioPageHeader,
  Button,
  EmptyState,
  Card,
  StudioSummaryGrid,
  StudioFilterBar,
  StudioMetaChip,
  StudioSubscribersTable,
  type StudioSubscriberRowData,
} from '@digipicks/ds';
import { useStudioContext } from '../useStudioContext';
import { STUDIO } from '../../lib/studioRoutes';

const PLAN_FILTERS = [
  { label: 'All plans', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Premium', value: 'premium' },
  { label: 'VIP', value: 'vip' },
];

const DEMO_ROWS: StudioSubscriberRowData[] = [
  {
    id: 'd1',
    name: 'Alex Rivera',
    handle: '@arivera_sports',
    mono: 'AR',
    plan: 'premium',
    status: 'active',
    joinDate: 'Oct 12, 2023',
    renewal: 'Nov 12, 2024',
  },
  {
    id: 'd2',
    name: 'Sarah Jenkins',
    handle: '@sarah_betz',
    mono: 'SJ',
    plan: 'vip',
    status: 'active',
    joinDate: 'Dec 04, 2023',
    renewal: 'Jan 04, 2025',
  },
  {
    id: 'd3',
    name: 'David Chen',
    handle: '@chen.picks',
    mono: 'DC',
    plan: 'free',
    status: 'cancelled',
    joinDate: 'Jan 20, 2024',
    renewal: 'Expired',
  },
  {
    id: 'd4',
    name: 'Elena Sokolov',
    handle: '@lena_stats',
    mono: 'ES',
    plan: 'premium',
    status: 'past_due',
    joinDate: 'Feb 11, 2024',
    renewal: 'Feb 11, 2024',
  },
  {
    id: 'd5',
    name: 'Marcus Gray',
    handle: '@mgray_analyst',
    mono: 'MG',
    plan: 'vip',
    status: 'active',
    joinDate: 'May 15, 2023',
    renewal: 'May 15, 2025',
  },
];

function formatDate(ms: number | undefined): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function handleFromEmail(email: string): string | undefined {
  const local = email.split('@')[0];
  if (!local) return undefined;
  return `@${local.replace(/\./g, '_')}`;
}

function toRow(u: {
  _id: string;
  subscriberName: string;
  subscriberEmail: string;
  subscriberMono: string;
  plan: string;
  status: string;
  startedAt: number;
  renewsAt?: number;
  cancelledAt?: number;
}): StudioSubscriberRowData {
  const plan =
    u.plan === 'free' || u.plan === 'premium' || u.plan === 'vip' || u.plan === 'trial'
      ? u.plan
      : 'premium';
  const status =
    u.status === 'active' || u.status === 'past_due' || u.status === 'cancelled'
      ? u.status
      : 'active';

  let renewal = formatDate(u.renewsAt);
  if (status === 'cancelled') renewal = 'Expired';
  if (status === 'past_due' && u.renewsAt) renewal = formatDate(u.renewsAt);

  return {
    id: u._id,
    name: u.subscriberName,
    handle: handleFromEmail(u.subscriberEmail),
    mono: u.subscriberMono,
    plan,
    status,
    joinDate: formatDate(u.startedAt),
    renewal,
  };
}

function matchesSearch(row: StudioSubscriberRowData, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    row.name.toLowerCase().includes(q) ||
    (row.handle?.toLowerCase().includes(q) ?? false) ||
    row.mono.toLowerCase().includes(q)
  );
}

export function Subscribers() {
  const navigate = useNavigate();
  const ctx = useStudioContext();
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const allRows = useMemo(() => {
    if (ctx.subs.length > 0) return ctx.subs.map(toRow);
    if (ctx.devPreview && !ctx.isLive) return DEMO_ROWS;
    return [];
  }, [ctx.subs, ctx.devPreview]);

  const rows = useMemo(() => {
    return allRows.filter((r) => {
      if (planFilter !== 'all' && r.plan !== planFilter) return false;
      if (statusFilter === 'active' && r.status !== 'active') return false;
      return matchesSearch(r, search);
    });
  }, [allRows, planFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const active = allRows.filter((r) => r.status === 'active').length;
    const pastDue = allRows.filter((r) => r.status === 'past_due').length;
    const cancelled = allRows.filter((r) => r.status === 'cancelled').length;
    const churnDisplay = ctx.churnRate ? `${ctx.churnRate}%` : '—';

    return {
      total: allRows.length > 0 ? allRows.length : ctx.devPreview ? ctx.activeSubs : 0,
      active,
      newThisWeek: ctx.newSubs7d,
      churnDisplay,
      pastDue,
      cancelled,
    };
  }, [allRows, ctx.activeSubs, ctx.churnRate, ctx.devPreview, ctx.newSubs7d]);

  const loading = ctx.subsLoading && !ctx.devPreview;

  React.useEffect(() => {
    setPage(1);
  }, [planFilter, statusFilter, search]);

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Subscribers"
          title="Subscribers"
          sub="Manage your audience and track subscriber growth."
          actions={
            <>
              <Button variant="outline" onClick={() => navigate(STUDIO.products)}>
                View plans
              </Button>
              <Button variant="primary">Export list</Button>
            </>
          }
        />

        <StudioSummaryGrid
          items={[
            {
              id: 'total',
              icon: 'users',
              iconTone: 'primary',
              label: 'Total subscribers',
              value: stats.total.toLocaleString(),
              delta: { value: `${stats.active} active`, dir: 'flat' as const },
              active: planFilter === 'all' && statusFilter === 'all',
              onClick: () => {
                setPlanFilter('all');
                setStatusFilter('all');
              },
            },
            {
              id: 'new',
              icon: 'users',
              iconTone: 'violet',
              label: 'New this week',
              value: `+${stats.newThisWeek}`,
              delta: { value: '7d', dir: 'up' as const },
              active: statusFilter === 'active' && planFilter === 'all',
              onClick: () => {
                setPlanFilter('all');
                setStatusFilter('active');
              },
            },
            {
              id: 'churn',
              icon: 'chart',
              iconTone: 'danger',
              label: 'Churn rate',
              value: stats.churnDisplay,
              delta:
                stats.cancelled > 0
                  ? { value: `${stats.cancelled} cancelled`, dir: 'down' as const }
                  : undefined,
              active: statusFilter === 'all',
              onClick: () => setStatusFilter('all'),
            },
            {
              id: 'rev',
              icon: 'dollar',
              iconTone: 'amber',
              label: 'Revenue / sub',
              value: ctx.devPreview ? '$29.60' : '—',
              delta: { value: '30d avg', dir: 'up' as const },
              onClick: () => navigate(STUDIO.payouts),
            },
          ]}
        />

        <StudioFilterBar
          options={PLAN_FILTERS}
          value={planFilter}
          onChange={setPlanFilter}
          ariaLabel="Filter subscribers by plan"
          search={{
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: 'Search subscribers…',
            'aria-label': 'Search subscribers',
          }}
          trailing={
            <>
              <StudioMetaChip
                icon="filter"
                label={statusFilter === 'active' ? 'Status: Active' : 'Status: All'}
                onClick={() => setStatusFilter((s) => (s === 'active' ? 'all' : 'active'))}
              />
              {stats.pastDue > 0 ? (
                <StudioMetaChip
                  icon="flag"
                  label={`${stats.pastDue} past due`}
                  onClick={() => setStatusFilter('all')}
                />
              ) : (
                <StudioMetaChip icon="calendar" label="Last 30 days" />
              )}
            </>
          }
        />

        {loading ? (
          <Card pad="lg" elev>
            <EmptyState icon="users" title="Loading subscribers…" />
          </Card>
        ) : rows.length === 0 ? (
          <Card pad="lg" elev>
            <EmptyState
              icon="users"
              title={search ? 'No subscribers match your search' : 'No subscribers yet'}
              subtitle={
                search
                  ? 'Try a different query or clear filters.'
                  : 'Share your creator link to start building your audience.'
              }
              action={
                search ? (
                  <Button variant="secondary" onClick={() => setSearch('')}>
                    Clear search
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => navigate(STUDIO.products)}>
                    Set up plans
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <StudioSubscribersTable
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
