import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Card,
  Icon,
  InsightCard,
  Mono,
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
import { api } from '../../../../../convex/_generated/api';
import { useStudioContext } from '../useStudioContext';
import {
  buildOverviewSummary,
  chartHighlightForPeriod,
  chartHighlightFromEarnings,
} from '../studioMetrics';
import { STUDIO } from '../../lib/studioRoutes';
import { mapStudioActivityFeed } from '../lib/studioActivity';
import { StudioDevHint } from '../StudioDevHint';

const PERIOD_OPTIONS = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
];

function demoActivity(navigate: (path: string) => void) {
  return mapStudioActivityFeed(
    [
      {
        id: 'demo-1',
        kind: 'subscription',
        title: '@jordan_picks',
        sub: 'premium · active',
        at: Date.now() - 120_000,
        amountLabel: '+$49.00',
      },
      {
        id: 'demo-2',
        kind: 'subscription',
        title: 'Alex M.',
        sub: 'premium · active',
        at: Date.now() - 2_700_000,
        amountLabel: '+$29.00',
      },
      {
        id: 'demo-3',
        kind: 'pick',
        title: 'NBA Lakers vs Celtics Analysis',
        sub: 'Published',
        at: Date.now() - 10_800_000,
      },
      {
        id: 'demo-4',
        kind: 'subscription',
        title: '@user_123',
        sub: 'premium · cancelled',
        at: Date.now() - 18_000_000,
      },
    ],
    { picks: STUDIO.picks, subscribers: STUDIO.subscribers, payouts: STUDIO.payouts },
    navigate,
  );
}

export function Overview() {
  const navigate = useNavigate();
  const [revenuePeriod, setRevenuePeriod] = useState('7d');
  const ctx = useStudioContext();

  const activityRaw = useQuery(
    api.creators.activityFeed,
    ctx.creatorId ? { creatorId: ctx.creatorId, limit: 8 } : 'skip',
  );

  const earningsHistory = useQuery(
    api.payouts.earningsHistory,
    ctx.creatorId && !ctx.devPreview ? { months: 12 } : 'skip',
  );

  const summaryItems = useMemo(
    () =>
      buildOverviewSummary(
        {
          devPreview: ctx.devPreview,
          isLive: ctx.isLive,
          activeSubs: ctx.activeSubs,
          newSubs7d: ctx.newSubs7d,
          churnRate: ctx.churnRate,
          publishedPicks: ctx.publishedPicks,
          units: ctx.units,
          mrrEstimateCents: ctx.mrrEstimateCents,
        },
        navigate,
      ),
    [ctx, navigate],
  );

  const chartHighlight = useMemo(() => {
    if (ctx.isLive && earningsHistory?.buckets.length) {
      return chartHighlightFromEarnings(
        earningsHistory.buckets,
        revenuePeriod,
        earningsHistory.currency,
        false,
      );
    }
    if (ctx.devPreview) return chartHighlightForPeriod(revenuePeriod);
    return { label: '—', value: '—' };
  }, [ctx.isLive, ctx.devPreview, earningsHistory, revenuePeriod]);

  const activityItems = useMemo(() => {
    if (ctx.isLive && activityRaw && activityRaw.length > 0) {
      return mapStudioActivityFeed(
        activityRaw,
        {
          picks: STUDIO.picks,
          subscribers: STUDIO.subscribers,
          payouts: STUDIO.payouts,
        },
        navigate,
      );
    }
    if (ctx.devPreview) return demoActivity(navigate);
    return [];
  }, [ctx.isLive, ctx.devPreview, activityRaw, navigate]);

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
      {
        id: 'events',
        label: 'Schedule a live event',
        done: false,
        onClick: () => navigate(STUDIO.events),
      },
      {
        id: 'messages',
        label: 'Reply to subscriber messages',
        done: false,
        onClick: () => navigate(STUDIO.messages),
      },
      {
        id: 'copilot',
        label: 'Draft picks with Copilot',
        done: false,
        onClick: () => navigate(STUDIO.copilot),
      },
      {
        id: 'discord',
        label: 'Connect Discord notifications',
        done: Boolean(ctx.creator?.discordWebhookUrl),
        onClick: () => navigate(STUDIO.settingsDiscord),
      },
    ],
    [ctx.hasPublishedPick, ctx.hasTiers, ctx.hasProfile, ctx.creator?.discordWebhookUrl, navigate],
  );

  return (
    <Container size="2xl">
      <Stack gap={6}>
        {ctx.devPreview && !ctx.creatorId ? (
          <StudioDevHint message="Preview mode — sign in with an approved creator account for live KPIs and activity." />
        ) : null}

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
              {ctx.isLive && ctx.newSubs7d > 0 ? (
                <InsightCard
                  tone="amber"
                  icon={<Icon name="flame" size={20} />}
                  title="High growth week"
                  sub={`+${ctx.newSubs7d} new subscribers in the last 7 days`}
                />
              ) : ctx.devPreview ? (
                <InsightCard
                  tone="amber"
                  icon={<Icon name="flame" size={20} />}
                  title="High growth week"
                  sub="Trending 12% above average"
                />
              ) : null}
            </StudioChartCard>
          </StudioDashCol>

          <StudioDashCol span={7}>
            <ActivityFeed
              title="Recent activity"
              actionLabel="View subscribers"
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
