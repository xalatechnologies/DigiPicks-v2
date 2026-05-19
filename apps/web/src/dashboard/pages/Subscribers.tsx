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
  Button,
  EmptyState,
  Card,
  StudioSummaryGrid,
  StudioFilterPills,
  StudioMetaChip,
  StudioSubscribersTable,
  QuickActionGrid,
  type StudioSubscriberRowData,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { hasDevStudioPreview } from '../../lib/devDemoLogin';
import { studioCrossLinks } from '../../lib/studioCrossLinks';
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

export function Subscribers() {
  const navigate = useNavigate();
  const devPreview = hasDevStudioPreview();
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active');
  const [page, setPage] = useState(1);

  const me = useQuery(api.users.meSafe);
  const creator = useQuery(api.creators.get, me?.creatorId ? { id: me.creatorId } : 'skip');
  const activeCount = useQuery(
    api.subscriptions.countByCreator,
    creator?._id ? { creatorId: creator._id } : 'skip',
  );
  const subsRaw = useQuery(
    api.subscriptions.byCreator,
    creator?._id ? { creatorId: creator._id, limit: 200 } : 'skip',
  );

  const subs = subsRaw ?? [];
  const totalCount = typeof activeCount === 'number' ? activeCount : devPreview ? 420 : subs.length;

  const rows = useMemo(() => {
    const source = subs.length > 0 ? subs.map(toRow) : devPreview ? DEMO_ROWS : [];

    return source.filter((r) => {
      if (planFilter !== 'all' && r.plan !== planFilter) return false;
      if (statusFilter === 'active' && r.status !== 'active') return false;
      return true;
    });
  }, [subs, devPreview, planFilter, statusFilter]);

  const newThisWeek = useMemo(() => {
    if (devPreview) return 18;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return subs.filter((s) => s.startedAt >= weekAgo).length;
  }, [subs, devPreview]);

  const churnRate = useMemo(() => {
    if (devPreview) return '2.4%';
    if (subs.length === 0) return '—';
    const cancelled = subs.filter((s) => s.status === 'cancelled').length;
    return `${((cancelled / subs.length) * 100).toFixed(1)}%`;
  }, [subs, devPreview]);

  const loading = subsRaw === undefined && !devPreview && Boolean(creator?._id);

  return (
    <Container size="2xl">
      <Stack gap={8}>
        <Stack gap={2}>
          <Eyebrow>Audience · Subscribers</Eyebrow>
          <Heading level={1} size="2xl">
            Subscribers
          </Heading>
          <Muted>Manage your audience and track subscriber growth.</Muted>
        </Stack>

        <StudioSummaryGrid
          items={[
            {
              id: 'total',
              icon: 'users',
              iconTone: 'primary',
              label: 'Total subscribers',
              value: totalCount.toLocaleString(),
              delta: { value: '+12%', dir: 'up' },
            },
            {
              id: 'new',
              icon: 'users',
              iconTone: 'violet',
              label: 'New this week',
              value: `+${newThisWeek}`,
              delta: { value: '+4%', dir: 'up' },
            },
            {
              id: 'churn',
              icon: 'users',
              iconTone: 'danger',
              label: 'Churn rate',
              value: churnRate,
              delta: { value: '-0.5%', dir: 'down' },
            },
            {
              id: 'rev',
              icon: 'dollar',
              iconTone: 'amber',
              label: 'Revenue / sub',
              value: devPreview ? '$29.60' : '—',
              delta: { value: '+2%', dir: 'up' },
            },
          ]}
        />

        <Row between wrap>
          <Row gap={3} wrap>
            <StudioFilterPills options={PLAN_FILTERS} value={planFilter} onChange={setPlanFilter} />
            <StudioMetaChip
              icon="filter"
              label={statusFilter === 'active' ? 'Status: Active' : 'Status: All'}
              onClick={() => setStatusFilter((s) => (s === 'active' ? 'all' : 'active'))}
            />
            <StudioMetaChip icon="calendar" label="Last 30 days" />
          </Row>
          <Row gap={2} wrap>
            <Button variant="outline" size="sm" onClick={() => navigate(STUDIO.products)}>
              View plans
            </Button>
            <Button variant="primary" size="sm">
              Export list
            </Button>
          </Row>
        </Row>

        {loading ? (
          <Card pad="lg" elev>
            <EmptyState icon="users" title="Loading subscribers…" />
          </Card>
        ) : rows.length === 0 ? (
          <Card pad="lg" elev>
            <EmptyState
              icon="users"
              title="No subscribers yet"
              subtitle="Share your creator link to start building your audience."
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

        <QuickActionGrid title="Related" items={studioCrossLinks('subscribers', navigate)} />
      </Stack>
    </Container>
  );
}
