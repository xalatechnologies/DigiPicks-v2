import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Grid,
  Icon,
  StudioPageHeader,
  Button,
  Card,
  CardHead,
  Muted,
  Mono,
  Badge,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  EmptyState,
  StudioSummaryGrid,
  StudioSubNav,
  StudioMetaChip,
  StudioChartCard,
  StudioAreaChart,
  InsightCard,
  KV,
  QuickActionGrid,
} from '@digipicks/ds';
import type { BadgeTone } from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { useStudioContext } from '../useStudioContext';
import { chartHighlightForPeriod } from '../studioMetrics';
import { StudioDevHint } from '../StudioDevHint';
import { studioCrossLinks } from '../../lib/studioCrossLinks';
import { STUDIO } from '../../lib/studioRoutes';
import { INVOICES } from '../data/studio';

const STATUS_TONE: Record<string, BadgeTone> = {
  paid: 'green',
  pending: 'amber',
  failed: 'red',
};

const VIEW_TABS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Payout history', value: 'history' },
];

const PLATFORM_FEE_RATE_FALLBACK = 0.13;

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function Earnings() {
  const navigate = useNavigate();
  const ctx = useStudioContext();
  const [view, setView] = useState('overview');
  const [range, setRange] = useState('30d');

  const payouts = useQuery(api.payouts.byMe, ctx.creatorId ? { limit: 100 } : 'skip');
  const summary = useQuery(api.payouts.summary, ctx.creatorId ? {} : 'skip');

  const activeSubs = ctx.subs.filter((s) => s.status === 'active');
  const startingPrice = ctx.creator?.startingPrice ?? 0;
  const mrrGross = activeSubs.length * startingPrice;
  const platformFeeRate = summary?.platformFeeRate ?? PLATFORM_FEE_RATE_FALLBACK;
  const mrrNet = mrrGross * (1 - platformFeeRate);
  const currency = summary?.currency ?? 'USD';
  const paidTotal = summary?.paidTotal ?? 0;
  const pendingTotal = summary?.pendingTotal ?? 0;

  const displayMrr = useMemo(() => {
    if (ctx.devPreview && mrrNet === 0) return '$14,240.50';
    if (mrrNet === 0) return '—';
    return formatCurrency(mrrNet, currency);
  }, [ctx.devPreview, mrrNet, currency]);

  const activeCount =
    activeSubs.length > 0 ? activeSubs.length : ctx.devPreview ? ctx.activeSubs || 338 : 0;

  const showDemoPayouts =
    ctx.devPreview && (!ctx.creatorId || payouts === undefined || payouts.length === 0);

  const loadingPayouts = Boolean(ctx.creatorId) && payouts === undefined && !ctx.devPreview;

  const pendingDisplay =
    ctx.devPreview && pendingTotal === 0 ? '$2,180.00' : formatCurrency(pendingTotal, currency);

  const lifetimeDisplay =
    ctx.devPreview && paidTotal === 0 ? '$48,920.00' : formatCurrency(paidTotal, currency);

  const grossDisplay =
    ctx.devPreview && mrrGross === 0 ? '$16,370.00' : formatCurrency(mrrGross, currency);

  const feeDisplay = formatCurrency(
    (ctx.devPreview && mrrGross === 0 ? 16370 : mrrGross) * platformFeeRate,
    currency,
  );

  const chartHighlight = chartHighlightForPeriod(range);
  const showDevHint = ctx.devPreview && !ctx.creatorId;

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Payouts"
          title="Payouts"
          sub="MRR from active subscriptions; monthly payouts via Stripe Connect."
          actions={
            <>
              <Button variant="outline" onClick={() => navigate(STUDIO.products)}>
                View plans
              </Button>
              <Button variant="primary" disabled>
                Withdraw
              </Button>
            </>
          }
        />

        <StudioSubNav items={VIEW_TABS} value={view} onChange={setView} />

        <StudioSummaryGrid
          items={[
            {
              id: 'mrr',
              icon: 'dollar',
              iconTone: 'primary',
              label: 'MRR (net)',
              value: displayMrr,
              delta: ctx.devPreview ? { value: '+12.5%', dir: 'up' as const } : undefined,
              active: view === 'overview',
              onClick: () => setView('overview'),
            },
            {
              id: 'pending',
              icon: 'clock',
              iconTone: 'amber',
              label: 'Pending payout',
              value: pendingDisplay,
              active: view === 'history',
              onClick: () => setView('history'),
            },
            {
              id: 'lifetime',
              icon: 'card',
              iconTone: 'violet',
              label: 'Lifetime paid',
              value: lifetimeDisplay,
              onClick: () => setView('history'),
            },
            {
              id: 'subs',
              icon: 'users',
              iconTone: 'danger',
              label: 'Active subscribers',
              value: activeCount.toLocaleString(),
              onClick: () => navigate(STUDIO.subscribers),
            },
          ]}
        />

        {showDevHint ? (
          <StudioDevHint message="Sample payout and MRR figures. Sign in with a creator account for live Stripe data." />
        ) : null}

        {view === 'overview' ? (
          <Stack gap={6}>
            <StudioChartCard
              title="Net revenue trend"
              sub="Estimated creator earnings after platform fees"
              periodOptions={[
                { label: '7D', value: '7d' },
                { label: '30D', value: '30d' },
                { label: '90D', value: '90d' },
              ]}
              period={range}
              onPeriodChange={setRange}
            >
              <StudioAreaChart
                highlightLabel={chartHighlight.label}
                highlightValue={chartHighlight.value}
              />
            </StudioChartCard>

            <Grid cols={2} gap={6} stagger={false}>
              <Card pad="lg" elev>
                <CardHead
                  title="This month (estimated)"
                  sub="Active subscribers × plan price — see Products for tiers"
                />
                <Stack gap={3}>
                  <KV k="Active subscribers" v={<Mono>{activeCount}</Mono>} />
                  <KV k="Gross revenue" v={<Mono>{grossDisplay}</Mono>} />
                  <KV
                    k={`Platform + Stripe (~${Math.round(platformFeeRate * 100)}%)`}
                    v={<Mono>−{feeDisplay}</Mono>}
                  />
                  <KV k="Net to creator" v={<Mono>{displayMrr}</Mono>} />
                  <Button variant="secondary" onClick={() => navigate(STUDIO.subscribers)}>
                    View subscribers
                  </Button>
                </Stack>
              </Card>

              <Card pad="lg" elev>
                <CardHead title="Payout method" sub="Stripe Connect handles direct deposits" />
                <Stack gap={3}>
                  <Muted>
                    Connect Stripe to receive monthly payouts. Until then, earnings accumulate as
                    pending.
                  </Muted>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(STUDIO.earningsOnboarding)}
                    disabled={!ctx.creatorId}
                  >
                    Connect with Stripe
                  </Button>
                </Stack>
              </Card>
            </Grid>

            <InsightCard
              tone="blue"
              icon={<Icon name="dollar" size={22} />}
              title="Monthly payout schedule"
              sub="Payouts run on the 1st of each month for the prior period. Pending balance transfers after Stripe verification."
              action={
                <Button variant="primary" size="sm" onClick={() => setView('history')}>
                  View history
                </Button>
              }
            />
          </Stack>
        ) : null}

        {view === 'history' ? (
          <Card pad="lg" elev>
            <CardHead
              title="Payout history"
              sub="Monthly statements"
              action={<StudioMetaChip icon="calendar" label="Last 12 months" />}
            />
            {loadingPayouts ? (
              <EmptyState icon="dollar" title="Loading payouts…" />
            ) : showDemoPayouts ? (
              <Table>
                <THead>
                  <Tr>
                    <Th>Description</Th>
                    <Th>Date</Th>
                    <Th numeric>Amount</Th>
                    <Th>Status</Th>
                  </Tr>
                </THead>
                <TBody>
                  {INVOICES.map((inv) => (
                    <Tr key={inv.id}>
                      <Td>{inv.description}</Td>
                      <Td>
                        <Muted>{inv.date}</Muted>
                      </Td>
                      <Td numeric>
                        <Mono>{inv.amount}</Mono>
                      </Td>
                      <Td>
                        <Badge tone={STATUS_TONE[inv.status] ?? 'mute'} dot>
                          {inv.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            ) : payouts && payouts.length > 0 ? (
              <Table>
                <THead>
                  <Tr>
                    <Th>Stripe ID</Th>
                    <Th>Period</Th>
                    <Th>Paid</Th>
                    <Th numeric>Amount</Th>
                    <Th>Status</Th>
                  </Tr>
                </THead>
                <TBody>
                  {payouts.map((p) => (
                    <Tr key={p._id}>
                      <Td>
                        <Mono>{p.stripePayoutId ?? '—'}</Mono>
                      </Td>
                      <Td>
                        <Muted>
                          {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                        </Muted>
                      </Td>
                      <Td>
                        <Muted>{p.paidAt ? formatDate(p.paidAt) : '—'}</Muted>
                      </Td>
                      <Td numeric>
                        <Mono>{formatCurrency(p.amount, p.currency)}</Mono>
                      </Td>
                      <Td>
                        <Badge tone={STATUS_TONE[p.status] ?? 'mute'} dot>
                          {p.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            ) : (
              <EmptyState
                icon="dollar"
                title="No payouts yet"
                subtitle="Once subscribers pay through Stripe, paid invoices will appear here."
                action={
                  <Button variant="primary" onClick={() => navigate(STUDIO.products)}>
                    Set up pricing
                  </Button>
                }
              />
            )}
          </Card>
        ) : null}

        <QuickActionGrid title="Related" items={studioCrossLinks('payouts', navigate)} />
      </Stack>
    </Container>
  );
}
