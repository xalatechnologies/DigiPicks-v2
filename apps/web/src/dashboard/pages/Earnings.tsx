import React, { useMemo } from 'react';
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
  Card,
  CardHead,
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
  KV,
  QuickActionGrid,
} from '@digipicks/ds';
import type { BadgeTone } from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { hasDevStudioPreview } from '../../lib/devDemoLogin';
import { studioCrossLinks } from '../../lib/studioCrossLinks';
import { STUDIO } from '../../lib/studioRoutes';
import { INVOICES } from '../data/studio';

const STATUS_TONE: Record<string, BadgeTone> = {
  paid: 'green',
  pending: 'amber',
  failed: 'red',
};

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
  const devPreview = hasDevStudioPreview();

  const me = useQuery(api.users.meSafe);
  const creator = useQuery(api.creators.get, me?.creatorId ? { id: me.creatorId } : 'skip');
  const subs = useQuery(
    api.subscriptions.byCreator,
    me?.creatorId ? { creatorId: me.creatorId, limit: 1000 } : 'skip',
  );
  const payouts = useQuery(api.payouts.byMe, { limit: 100 });
  const summary = useQuery(api.payouts.summary, {});

  const activeSubs = (subs ?? []).filter((s) => s.status === 'active');
  const startingPrice = creator?.startingPrice ?? 0;
  const mrrGross = activeSubs.length * startingPrice;
  const platformFeeRate = summary?.platformFeeRate ?? PLATFORM_FEE_RATE_FALLBACK;
  const mrrNet = mrrGross * (1 - platformFeeRate);
  const currency = summary?.currency ?? 'USD';
  const paidTotal = summary?.paidTotal ?? 0;
  const pendingTotal = summary?.pendingTotal ?? 0;

  const displayMrr = useMemo(() => {
    if (devPreview && mrrNet === 0) return '$14,240.50';
    if (mrrNet === 0) return '—';
    return formatCurrency(mrrNet, currency);
  }, [devPreview, mrrNet, currency]);

  const activeCount = devPreview && activeSubs.length === 0 ? 338 : activeSubs.length;

  const showDemoPayouts = devPreview && (payouts === undefined || payouts.length === 0);

  return (
    <Container size="2xl">
      <Stack gap={8}>
        <Row between wrap>
          <Stack gap={2}>
            <Eyebrow>Studio · Payouts</Eyebrow>
            <Heading level={1} size="2xl">
              Payouts
            </Heading>
            <Muted>MRR from active subscriptions; monthly payouts via Stripe Connect.</Muted>
          </Stack>
          <Row gap={2} wrap>
            <Button variant="outline" size="sm" onClick={() => navigate(STUDIO.products)}>
              View plans
            </Button>
            <Button variant="primary" size="sm" disabled>
              Withdraw
            </Button>
          </Row>
        </Row>

        <StudioSummaryGrid
          items={[
            {
              id: 'mrr',
              icon: 'dollar',
              iconTone: 'primary',
              label: 'MRR (net)',
              value: displayMrr,
              delta: devPreview ? { value: '+12.5%', dir: 'up' } : undefined,
            },
            {
              id: 'pending',
              icon: 'clock',
              iconTone: 'amber',
              label: 'Pending payout',
              value:
                devPreview && pendingTotal === 0
                  ? '$2,180.00'
                  : formatCurrency(pendingTotal, currency),
            },
            {
              id: 'lifetime',
              icon: 'card',
              iconTone: 'violet',
              label: 'Lifetime paid',
              value:
                devPreview && paidTotal === 0 ? '$48,920.00' : formatCurrency(paidTotal, currency),
            },
            {
              id: 'subs',
              icon: 'users',
              iconTone: 'danger',
              label: 'Active subscribers',
              value: activeCount.toLocaleString(),
            },
          ]}
        />

        <Row gap={5} wrap>
          <Card>
            <CardHead
              title="This month (estimated)"
              sub="Active subscribers × plan price — see Products for tiers"
            />
            <Stack gap={2}>
              <KV k="Active subscribers" v={<Mono>{activeCount}</Mono>} />
              <KV
                k="Gross revenue"
                v={
                  <Mono>
                    {devPreview && mrrGross === 0
                      ? '$16,370.00'
                      : formatCurrency(mrrGross, currency)}
                  </Mono>
                }
              />
              <KV
                k={`Platform + Stripe (~${Math.round(platformFeeRate * 100)}%)`}
                v={
                  <Mono>
                    −
                    {formatCurrency(
                      (devPreview && mrrGross === 0 ? 16370 : mrrGross) * platformFeeRate,
                      currency,
                    )}
                  </Mono>
                }
              />
              <KV k="Net to creator" v={<Mono>{displayMrr}</Mono>} />
              <Row gap={2}>
                <Button variant="secondary" size="sm" onClick={() => navigate(STUDIO.subscribers)}>
                  View subscribers
                </Button>
              </Row>
            </Stack>
          </Card>

          <Card>
            <CardHead title="Payout method" sub="Stripe Connect handles direct deposits" />
            <Stack gap={3}>
              <Muted>
                Connect Stripe to receive monthly payouts. Until then, earnings accumulate as
                pending.
              </Muted>
              <Button variant="secondary" size="sm" disabled>
                Connect with Stripe
              </Button>
            </Stack>
          </Card>
        </Row>

        <Card pad="sm" elev>
          <CardHead title="Payout history" sub="Monthly statements" />
          {payouts === undefined && !devPreview ? (
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
                <Button variant="primary" size="sm" onClick={() => navigate(STUDIO.products)}>
                  Set up pricing
                </Button>
              }
            />
          )}
        </Card>

        <QuickActionGrid title="Related" items={studioCrossLinks('payouts', navigate)} />
      </Stack>
    </Container>
  );
}
