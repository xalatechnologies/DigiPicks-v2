import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Stack,
  Row,
  Card,
  Icon,
  InsightCard,
  Mono,
  Serif,
  Button,
  StudioSummaryGrid,
  StudioChartCard,
  StudioAreaChart,
  StudioDashLayout,
  StudioDashCol,
  ActivityFeed,
  NextStepsPanel,
  StudioPageHeader,
  CardHead,
  Muted,
} from '@digipicks/ds';
import { useStudioContext } from '../useStudioContext';
import { buildOverviewSummary, chartHighlightForPeriod } from '../studioMetrics';
import { STUDIO } from '../../lib/studioRoutes';

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
  const ctx = useStudioContext();

  const summaryItems = useMemo(
    () =>
      buildOverviewSummary(
        {
          devPreview: ctx.devPreview,
          activeSubs: ctx.activeSubs,
          newSubs7d: ctx.newSubs7d,
          churnRate: ctx.churnRate,
          publishedPicks: ctx.publishedPicks,
          units: ctx.units,
        },
        navigate,
      ),
    [ctx, navigate],
  );

  const chartHighlight = chartHighlightForPeriod(revenuePeriod);
  const activityItems = useMemo(() => demoActivity(navigate), [navigate]);

  const nextSteps = useMemo(
    () => [
      {
        id: 'pick',
        label: 'Publish your first premium pick',
        done: ctx.hasPublishedPick,
        onClick: () => navigate(STUDIO.createPick),
      },
      {
        id: 'plan',
        label: 'Set up your first subscription plan',
        done: ctx.hasTiers,
        onClick: () => navigate(STUDIO.products),
      },
      {
        id: 'profile',
        label: 'Complete your public profile',
        done: ctx.hasProfile,
        onClick: () => navigate(STUDIO.profile),
      },
    ],
    [ctx.hasPublishedPick, ctx.hasTiers, ctx.hasProfile, navigate],
  );

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Overview"
          title="Dashboard"
          sub={`Welcome back, ${ctx.displayName}. Track revenue, subscribers, and performance.`}
          actions={
            <Button variant="primary" iconLeft="plus" onClick={() => navigate(STUDIO.createPick)}>
              New pick
            </Button>
          }
        />

        <StudioSummaryGrid columns={3} items={summaryItems} />

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
                    <span key={d}>{d}</span>
                  ))}
                </Row>
              }
            >
              <StudioAreaChart
                highlightLabel={chartHighlight.label}
                highlightValue={chartHighlight.value}
              />
            </StudioChartCard>
          </StudioDashCol>

          <StudioDashCol span={4}>
            <StudioChartCard title="Subscriber growth" sub="Net audience acceleration">
              <StudioAreaChart size="sm" highlightValue="" />
              <InsightCard
                tone="amber"
                icon={<Icon name="flame" size={20} />}
                title="High growth week"
                sub="Trending 12% above average"
              />
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
                items={nextSteps}
              />
            </Stack>
          </StudioDashCol>
        </StudioDashLayout>

        <Card pad="lg" elev>
          <CardHead
            title="Track record"
            sub="Win rate and units update as picks are graded."
            action={<Mono>{ctx.winRate}</Mono>}
          />
          <Row gap={6} wrap>
            <Stack gap={1}>
              <Muted>Record</Muted>
              <Mono>{ctx.record}</Mono>
            </Stack>
            <Stack gap={1}>
              <Muted>Units</Muted>
              <Mono>{ctx.units}</Mono>
            </Stack>
          </Row>
        </Card>
      </Stack>
    </Container>
  );
}
