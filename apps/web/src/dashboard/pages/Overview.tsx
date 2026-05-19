import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Heading,
  Icon,
  Sparkline,
  Mono,
  Serif,
  StudioMetricRow,
  StudioChartCard,
  StudioAreaChart,
  StudioDashLayout,
  StudioDashCol,
  ActivityFeed,
  NextStepsPanel,
  QuickActionGrid,
  Eyebrow,
  Muted,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { hasDevStudioPreview } from '../../lib/devDemoLogin';
import { STUDIO } from '../../lib/studioRoutes';
import { studioCrossLinks } from '../../lib/studioCrossLinks';

const PERIOD_OPTIONS = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
];

function demoActivity(navigate: (path: string) => void) {
  return [
    {
      id: '1',
      icon: 'users' as const,
      tone: 'success' as const,
      title: (
        <>
          New subscriber joined: <Serif>@jordan_picks</Serif>
        </>
      ),
      time: '2 minutes ago',
      amount: '+$49.00',
      onClick: () => navigate(STUDIO.subscribers),
    },
    {
      id: '2',
      icon: 'card' as const,
      tone: 'info' as const,
      title: (
        <>
          Subscription renewed: <Serif>Alex M.</Serif>
        </>
      ),
      time: '45 minutes ago',
      amount: '+$29.00',
      onClick: () => navigate(STUDIO.payouts),
    },
    {
      id: '3',
      icon: 'feed' as const,
      tone: 'primary' as const,
      title: (
        <>
          New post published: <Serif>NBA Lakers vs Celtics Analysis</Serif>
        </>
      ),
      time: '3 hours ago',
      trailingIcon: 'chevron-right' as const,
      onClick: () => navigate(STUDIO.picks),
    },
    {
      id: '4',
      icon: 'users' as const,
      tone: 'muted' as const,
      title: (
        <>
          Subscriber canceled: <Serif>@user_123</Serif>
        </>
      ),
      time: '5 hours ago',
      onClick: () => navigate(STUDIO.subscribers),
    },
  ];
}

export function Overview() {
  const navigate = useNavigate();
  const [revenuePeriod, setRevenuePeriod] = useState('7d');
  const devPreview = hasDevStudioPreview();

  const me = useQuery(api.users.meSafe);
  const creator = useQuery(api.creators.get, me?.creatorId ? { id: me.creatorId } : 'skip');
  const subCount = useQuery(
    api.subscriptions.countByCreator,
    creator?._id ? { creatorId: creator._id } : 'skip',
  );

  const displayName = creator?.name ?? me?.name ?? 'Creator';
  const activeSubs =
    typeof subCount === 'number' ? subCount.toLocaleString() : devPreview ? '420' : '—';
  const winRate = creator ? `${(creator.winRate * 100).toFixed(1)}%` : devPreview ? '58.2%' : '—';
  const units = creator?.units ?? (devPreview ? '+14.2u' : '—');

  const metrics = useMemo(
    () => [
      {
        id: 'mrr',
        label: 'Monthly revenue',
        value: devPreview ? '$12,450' : '$12,480',
        delta: { value: '12%', dir: 'up' as const },
        onClick: () => navigate(STUDIO.payouts),
      },
      {
        id: 'subs',
        label: 'Active subs',
        value: activeSubs,
        delta: { value: '8.4%', dir: 'up' as const },
        onClick: () => navigate(STUDIO.subscribers),
      },
      {
        id: 'new',
        label: 'New last 7d',
        value: devPreview ? '+18' : '—',
        delta: { value: '4%', dir: 'up' as const },
        onClick: () => navigate(STUDIO.subscribers),
      },
      {
        id: 'churn',
        label: 'Churn rate',
        value: devPreview ? '2.4%' : '—',
        delta: { value: '0.5%', dir: 'down' as const },
        onClick: () => navigate(STUDIO.subscribers),
      },
      {
        id: 'picks',
        label: 'Total picks',
        value: devPreview ? '156' : '—',
        delta: { value: 'Stable', dir: 'flat' as const },
        onClick: () => navigate(STUDIO.picks),
      },
      {
        id: 'perf',
        label: '30d performance',
        value: units,
        delta: { value: '3.1u', dir: 'up' as const },
        onClick: () => navigate(STUDIO.analytics),
      },
    ],
    [activeSubs, devPreview, units, navigate],
  );

  const activityItems = useMemo(() => demoActivity(navigate), [navigate]);

  return (
    <Container size="2xl">
      <Stack gap={8}>
        <Stack gap={2}>
          <Eyebrow>Studio · Overview</Eyebrow>
          <Row between>
            <Stack gap={1}>
              <Heading level={1} size="2xl">
                Dashboard
              </Heading>
              <Muted>
                Welcome back, {displayName}. Track revenue, subscribers, and performance.
              </Muted>
            </Stack>
          </Row>
        </Stack>

        <StudioMetricRow items={metrics} />

        <StudioDashLayout>
          <StudioDashCol span={8}>
            <StudioChartCard
              title="Revenue analytics"
              sub="Net earnings before platform fees"
              periodOptions={PERIOD_OPTIONS}
              period={revenuePeriod}
              onPeriodChange={setRevenuePeriod}
              footer={
                <Row between>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <Eyebrow key={d}>{d}</Eyebrow>
                  ))}
                </Row>
              }
            >
              <StudioAreaChart highlightLabel="Sept 12" highlightValue="$1,142.00" />
            </StudioChartCard>
          </StudioDashCol>

          <StudioDashCol span={4}>
            <StudioChartCard title="Subscriber growth" sub="Net audience acceleration">
              <Sparkline
                values={[12, 14, 13, 18, 22, 28, 35, 42]}
                color="var(--primary)"
                width={360}
                height={120}
              />
              <Card pad="md">
                <Row gap={3}>
                  <Icon name="flame" size={20} />
                  <Stack gap={1}>
                    <Heading level={3} size="sm">
                      High growth week
                    </Heading>
                    <Muted>Trending 12% above average</Muted>
                  </Stack>
                </Row>
              </Card>
            </StudioChartCard>
          </StudioDashCol>

          <StudioDashCol span={7}>
            <ActivityFeed
              title="Recent activity"
              actionLabel="View all"
              onAction={() => navigate(STUDIO.subscribers)}
              items={activityItems}
            />
          </StudioDashCol>

          <StudioDashCol span={5}>
            <Stack gap={6}>
              <NextStepsPanel
                title="Next steps"
                sub="Complete these tasks to optimize your revenue."
                items={[
                  {
                    id: 'pick',
                    label: 'Publish your first premium pick',
                    done: Boolean(creator),
                    onClick: () => navigate(STUDIO.createPick),
                  },
                  {
                    id: 'plan',
                    label: 'Set up your first subscription plan',
                    onClick: () => navigate(STUDIO.products),
                  },
                  {
                    id: 'social',
                    label: 'Complete your public profile',
                    onClick: () => navigate(STUDIO.profile),
                  },
                ]}
              />
              <QuickActionGrid
                title="Quick actions"
                items={studioCrossLinks('overview', navigate)}
              />
            </Stack>
          </StudioDashCol>
        </StudioDashLayout>

        {!devPreview && !creator ? (
          <Card pad="lg" elev>
            <CardHead
              title="Track record"
              sub="Win rate and units update as picks are graded."
              action={<Mono>{winRate}</Mono>}
            />
          </Card>
        ) : null}
      </Stack>
    </Container>
  );
}
