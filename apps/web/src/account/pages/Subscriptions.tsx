import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  Badge,
  Muted,
  Mono,
  KV,
  PersonRow,
  EmptyState,
  Divider,
  Stat,
  DashGrid,
  MetricGrid,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtShortDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function Subscriptions() {
  const navigate = useNavigate();
  const subs = useQuery(api.subscriptions.mySubscriptions);
  const cancelSub = useMutation(api.subscriptions.cancel);

  const [cancelling, setCancelling] = React.useState<Id<'creators'> | null>(null);

  const isLoading = subs === undefined;
  const active = subs?.filter((s) => s.status === 'active') ?? [];
  const pastDue = subs?.filter((s) => s.status === 'past_due') ?? [];
  const cancelled = subs?.filter((s) => s.status === 'cancelled') ?? [];
  const totalMonthly = active.reduce((sum, s) => sum + s.creatorStartingPrice, 0);

  const nextRenewal = active.reduce((earliest, s) => {
    if (!s.renewsAt) return earliest;
    return earliest === 0 || s.renewsAt < earliest ? s.renewsAt : earliest;
  }, 0);

  const earliestSub = [...active, ...cancelled].reduce((earliest, s) => {
    return earliest === 0 || s.startedAt < earliest ? s.startedAt : earliest;
  }, 0);
  const monthsActive =
    earliestSub > 0 ? Math.max(1, Math.ceil((Date.now() - earliestSub) / (30 * 86400000))) : 0;
  const lifetimeEstimate = totalMonthly * monthsActive;

  async function handleCancel(creatorId: Id<'creators'>) {
    setCancelling(creatorId);
    try {
      await cancelSub({ creatorId });
    } catch {
      /* useQuery recovers */
    } finally {
      setCancelling(null);
    }
  }

  // ── Sidebar ──────────────────────────────────────────────────────────
  const aside = (
    <>
      {/* Payment method */}
      <Card>
        <CardHead title="Payment method" sub="Managed by Stripe" />
        <Stack gap={3}>
          <PersonRow
            name="Visa ending in 4242"
            sub="Expires 09/28 · Default"
            mono="V"
            color="#4F8CFF"
            trailing={<Badge tone="green">Default</Badge>}
          />
          <Button variant="outline" size="sm" iconLeft="plus">
            Add payment method
          </Button>
        </Stack>
      </Card>

      {/* Spending summary */}
      <Card>
        <CardHead title="Spending" sub="Current period" />
        <Row gap={3} wrap>
          <Stat label="This month" value={`$${totalMonthly}`} />
          <Stat label="Last month" value={`$${totalMonthly}`} />
          <Stat
            label="Avg/month"
            value={
              lifetimeEstimate > 0
                ? `$${Math.round(lifetimeEstimate / Math.max(monthsActive, 1))}`
                : '$0'
            }
          />
        </Row>
      </Card>

      {/* Billing history */}
      <Card>
        <CardHead
          title="Billing history"
          action={
            <Button variant="ghost" size="sm">
              All invoices
            </Button>
          }
        />
        <Stack gap={0}>
          {[...active, ...cancelled].slice(0, 5).map((sub, i) => (
            <React.Fragment key={`bill-${sub._id}`}>
              {i > 0 && <Divider />}
              <PersonRow
                name={`${sub.creatorName} · ${sub.plan}`}
                sub={sub.startedAt ? fmtDate(sub.startedAt) : '—'}
                mono={sub.creatorMono}
                color={sub.creatorColor}
                trailing={
                  <Row gap={2}>
                    <Mono>{`$${sub.creatorStartingPrice}`}</Mono>
                    <Badge tone={sub.status === 'active' ? 'green' : 'mute'}>
                      {sub.status === 'active' ? 'Paid' : 'Refunded'}
                    </Badge>
                  </Row>
                }
              />
            </React.Fragment>
          ))}
          {active.length === 0 && cancelled.length === 0 && <Muted>No billing history yet.</Muted>}
        </Stack>
      </Card>

      {/* Quick links */}
      <Card>
        <CardHead title="Quick links" />
        <Stack gap={0}>
          <KV
            k="Portal"
            v={
              <Button variant="ghost" size="sm" iconRight="arrow-right">
                Open Stripe portal
              </Button>
            }
          />
          <Divider />
          <KV
            k="Receipts"
            v={
              <Button variant="ghost" size="sm" iconRight="arrow-right">
                Download receipts
              </Button>
            }
          />
          <Divider />
          <KV
            k="Support"
            v={
              <Button variant="ghost" size="sm" iconRight="arrow-right">
                Billing support
              </Button>
            }
          />
        </Stack>
      </Card>
    </>
  );

  return (
    <>
      <PageHeader
        title="Subscriptions"
        crumbs={[{ label: 'Account' }, { label: 'Subscriptions' }]}
        actions={
          <Row gap={2}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/account')}>
              Dashboard
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconRight="arrow-right"
              onClick={() => navigate('/account/discover')}
            >
              Discover more
            </Button>
          </Row>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          {/* ── Metrics ─────────────────────────────────────────────── */}
          <MetricGrid
            items={[
              {
                id: 'activeSubs',
                label: 'Active subscriptions',
                value: <Mono>{active.length}</Mono>,
                icon: <Icon name="users" size={14} />,
              },
              {
                id: 'monthly',
                label: 'Monthly cost',
                value: <Mono>${totalMonthly}</Mono>,
                delta:
                  nextRenewal > 0
                    ? { value: `Next ${fmtShortDate(nextRenewal)}`, dir: 'flat' }
                    : undefined,
                icon: <Icon name="card" size={14} />,
              },
              {
                id: 'lifetime',
                label: 'Lifetime spend',
                value: <Mono>${lifetimeEstimate}</Mono>,
                delta:
                  monthsActive > 0 ? { value: `${monthsActive} months`, dir: 'flat' } : undefined,
                icon: <Icon name="dollar" size={14} />,
              },
            ]}
          />

          {/* ── Two-column: plans + billing ─────────────────────────── */}
          <DashGrid aside={aside}>
            {isLoading && <EmptyState icon="card" title="Loading subscriptions…" />}

            {!isLoading &&
              active.length === 0 &&
              pastDue.length === 0 &&
              cancelled.length === 0 && (
                <EmptyState
                  icon="card"
                  title="No subscriptions yet."
                  subtitle="Discover creators and subscribe to start receiving premium picks in your feed."
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      iconRight="arrow-right"
                      onClick={() => navigate('/account/discover')}
                    >
                      Browse creators
                    </Button>
                  }
                />
              )}

            {/* Past-due warning */}
            {pastDue.length > 0 && (
              <Card>
                <CardHead
                  title="Action needed"
                  action={
                    <Badge tone="red" dot>
                      Past due
                    </Badge>
                  }
                />
                <Stack gap={0}>
                  {pastDue.map((sub, i) => (
                    <React.Fragment key={sub._id}>
                      {i > 0 && <Divider />}
                      <PersonRow
                        name={sub.creatorName}
                        sub="Payment failed — update your card"
                        mono={sub.creatorMono}
                        color={sub.creatorColor}
                        trailing={
                          <Button variant="primary" size="sm">
                            Retry payment
                          </Button>
                        }
                      />
                    </React.Fragment>
                  ))}
                </Stack>
              </Card>
            )}

            {/* Active subscriptions */}
            {active.length > 0 && (
              <Card>
                <CardHead
                  title="Active subscriptions"
                  action={
                    <Badge tone="green" dot>
                      {`$${totalMonthly}/mo`}
                    </Badge>
                  }
                />
                <Stack gap={0}>
                  {active.map((sub, i) => (
                    <React.Fragment key={sub._id}>
                      {i > 0 && <Divider />}
                      <PersonRow
                        name={sub.creatorName}
                        sub={`${sub.plan} · Renews ${sub.renewsAt ? fmtDate(sub.renewsAt) : '—'}`}
                        mono={sub.creatorMono}
                        color={sub.creatorColor}
                        trailing={
                          <Row gap={2}>
                            <Mono>{`$${sub.creatorStartingPrice}/mo`}</Mono>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(sub.creatorId)}
                              disabled={cancelling === sub.creatorId}
                            >
                              {cancelling === sub.creatorId ? 'Cancelling…' : 'Manage'}
                            </Button>
                          </Row>
                        }
                      />
                    </React.Fragment>
                  ))}
                </Stack>
              </Card>
            )}

            {/* Cancelled */}
            {cancelled.length > 0 && (
              <Card>
                <CardHead title="Cancelled" sub="Resubscribe anytime" />
                <Stack gap={0}>
                  {cancelled.map((sub, i) => (
                    <React.Fragment key={sub._id}>
                      {i > 0 && <Divider />}
                      <PersonRow
                        name={sub.creatorName}
                        sub={`Cancelled ${sub.cancelledAt ? fmtDate(sub.cancelledAt) : '—'} · was $${sub.creatorStartingPrice}/mo`}
                        mono={sub.creatorMono}
                        color={sub.creatorColor}
                        trailing={
                          <Row gap={2}>
                            <Badge tone="mute">Cancelled</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/creators/${sub.creatorHandle}`)}
                            >
                              Resubscribe
                            </Button>
                          </Row>
                        }
                      />
                    </React.Fragment>
                  ))}
                </Stack>
              </Card>
            )}
          </DashGrid>
        </Stack>
      </Container>
    </>
  );
}
