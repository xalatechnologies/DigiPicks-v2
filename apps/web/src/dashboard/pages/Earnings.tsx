import React from 'react';
import { useQuery } from 'convex/react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Col,
  Card,
  CardHead,
  Button,
  Icon,
  PageHead,
  KV,
  Mono,
  Muted,
  Badge,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  StatGrid,
  EmptyState,
} from '@digipicks/ds';
import type { BadgeTone } from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

const STATUS_TONE: Record<string, BadgeTone> = {
  paid: 'green',
  pending: 'amber',
  failed: 'red',
};

// Default fallback while the summary query is loading. The authoritative
// rate ships in payouts.summary.platformFeeRate (PLATFORM_FEE_RATE_BPS env
// override on the server, default 0.13).
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

  return (
    <>
      <PageHeader
        title="Earnings"
        crumbs={[{ label: 'Growth' }, { label: 'Earnings' }]}
        actions={
          <Row gap={2}>
            <Button variant="secondary" size="sm">
              <Icon name="filter" size={13} />
              Export
            </Button>
            <Button variant="primary" size="sm" disabled>
              <Icon name="dollar" size={13} />
              Withdraw
            </Button>
          </Row>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Growth"
            title="Earnings"
            sub="MRR derived from active subscriptions; payouts arrive monthly via Stripe. Withdraw flow lights up once Stripe Connect is configured (Phase 7)."
          />

          <StatGrid
            items={[
              {
                id: 'mrr',
                label: 'MRR (net)',
                value: <Mono>{formatCurrency(mrrNet, currency)}</Mono>,
                sub: <Muted>{activeSubs.length} active subscribers</Muted>,
              },
              {
                id: 'pending',
                label: 'Pending payout',
                value: <Mono>{formatCurrency(pendingTotal, currency)}</Mono>,
                sub: <Muted>queued from Stripe</Muted>,
              },
              {
                id: 'lifetime',
                label: 'Lifetime paid',
                value: <Mono>{formatCurrency(paidTotal, currency)}</Mono>,
                sub: <Muted>{summary?.count ?? 0} payouts</Muted>,
              },
              {
                id: 'take',
                label: 'Take rate',
                value: <Mono>87%</Mono>,
                sub: <Muted>creator share after fees</Muted>,
              },
            ]}
          />

          <Row gap={5} wrap>
            <Col gap={4}>
              <Card>
                <CardHead
                  title="This month (estimated)"
                  sub="Derived from active subscriptions × creator price"
                />
                <Stack gap={2}>
                  <KV k="Active subscribers" v={<Mono>{activeSubs.length}</Mono>} />
                  <KV k="Gross revenue" v={<Mono>{formatCurrency(mrrGross, currency)}</Mono>} />
                  <KV
                    k={`Platform + Stripe (~${Math.round(platformFeeRate * 100)}%)`}
                    v={<Mono>−{formatCurrency(mrrGross * platformFeeRate, currency)}</Mono>}
                  />
                  <KV k="Net to creator" v={<Mono>{formatCurrency(mrrNet, currency)}</Mono>} />
                </Stack>
              </Card>
            </Col>

            <Col gap={4}>
              <Card>
                <CardHead title="Payout method" sub="Stripe Connect handles direct deposits" />
                <Stack gap={3}>
                  <Muted>
                    Connect a Stripe account to receive monthly payouts. Until then, earnings
                    accumulate as “pending” and we'll route payouts manually.
                  </Muted>
                  <Row gap={2}>
                    <Button variant="secondary" size="sm" disabled>
                      Connect with Stripe
                    </Button>
                  </Row>
                </Stack>
              </Card>
            </Col>
          </Row>

          <Card pad="sm">
            <CardHead title="Payouts" sub="Monthly payouts and statements" />
            {payouts === undefined ? (
              <EmptyState icon="dollar" title="Loading payouts…" />
            ) : payouts.length === 0 ? (
              <EmptyState
                icon="dollar"
                title="No payouts yet."
                subtitle="Once subscribers pay through Stripe, paid invoices will land here automatically."
              />
            ) : (
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
            )}
          </Card>
        </Stack>
      </Container>
    </>
  );
}
