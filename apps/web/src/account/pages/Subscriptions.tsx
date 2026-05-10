import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  PageHeader,
  PageHead,
  Container,
  Stack,
  Row,
  Button,
  Icon,
  Badge,
  Muted,
  PersonRow,
  EmptyState,
  Divider,
  DashGrid,
  StatTile,
  SubscriptionTile,
  SectionHead,
  InsightCard,
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

function fmtShort(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

  // ── Right rail ─────────────────────────────────────────────────────────
  const aside = (
    <>
      <InsightCard
        tone="blue"
        eyebrow="Default card"
        title="Visa ending 4242"
        sub="Expires 09/28"
        action={<Badge tone="green">Default</Badge>}
      >
        <Button variant="outline" size="sm" iconLeft="plus">
          Add method
        </Button>
      </InsightCard>

      <InsightCard
        tone="green"
        eyebrow="Spending"
        title="Lifetime estimate"
        sub={`Across ${monthsActive || 0} month${monthsActive === 1 ? '' : 's'}`}
      >
        <Stack gap={2}>
          <PersonRow
            name={`$${totalMonthly}`}
            sub="This month"
            mono="$"
            color="var(--green)"
            trailing={<Badge tone="green">Active</Badge>}
          />
          <Divider />
          <PersonRow
            name={`$${lifetimeEstimate}`}
            sub={`Lifetime · ${monthsActive} mo`}
            mono="∞"
            color="var(--gold)"
            trailing={<Badge tone="gold">Total</Badge>}
          />
        </Stack>
      </InsightCard>

      <InsightCard
        tone="mute"
        eyebrow="Recent invoices"
        title="Billing history"
        action={
          <Button variant="ghost" size="sm" iconRight="arrow-right">
            All
          </Button>
        }
      >
        {active.length === 0 && cancelled.length === 0 ? (
          <Muted>No billing history yet.</Muted>
        ) : (
          <Stack gap={0}>
            {[...active, ...cancelled].slice(0, 5).map((sub, i) => (
              <React.Fragment key={`bill-${sub._id}`}>
                {i > 0 && <Divider />}
                <PersonRow
                  name={sub.creatorName}
                  sub={sub.startedAt ? fmtDate(sub.startedAt) : '—'}
                  mono={sub.creatorMono}
                  color={sub.creatorColor}
                  trailing={
                    <Badge tone={sub.status === 'active' ? 'green' : 'mute'}>
                      ${sub.creatorStartingPrice}
                    </Badge>
                  }
                />
              </React.Fragment>
            ))}
          </Stack>
        )}
      </InsightCard>

      <InsightCard
        tone="blue"
        eyebrow="Quick links"
        title="Billing tools"
        sub="External portals & support"
      >
        <Stack gap={0}>
          <PersonRow
            name="Stripe portal"
            sub="Manage billing"
            mono="S"
            color="var(--primary)"
            trailing={<Icon name="arrow-right" size={14} />}
          />
          <Divider />
          <PersonRow
            name="Download receipts"
            sub="PDF export"
            mono="R"
            color="var(--blue)"
            trailing={<Icon name="arrow-right" size={14} />}
          />
          <Divider />
          <PersonRow
            name="Billing support"
            sub="Get help"
            mono="H"
            color="var(--green)"
            trailing={<Icon name="arrow-right" size={14} />}
          />
        </Stack>
      </InsightCard>
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
        <Stack gap={6}>
          <PageHead
            eyebrow="Account"
            title={active.length > 0 ? 'Your active subscriptions' : 'Your subscriptions'}
            sub={
              active.length > 0
                ? `You're supporting ${active.length} creator${active.length === 1 ? '' : 's'} for $${totalMonthly}/mo. Manage plans, payment, and billing history below.`
                : 'Manage active plans, retry past-due payments, and resubscribe to creators you’ve cancelled.'
            }
          />

          {/* Top metrics — accent stat tiles */}
          <Row gap={4} wrap>
            <StatTile
              label="Active"
              tone="green"
              value={String(active.length)}
              sub={
                active.length > 0
                  ? `${active.length} creator${active.length === 1 ? '' : 's'} on rotation`
                  : 'No active plans'
              }
            />
            <StatTile
              label="Monthly spend"
              tone="blue"
              value={`$${totalMonthly}`}
              sub={nextRenewal > 0 ? `Next charge ${fmtShort(nextRenewal)}` : '—'}
            />
            <StatTile
              label="Lifetime"
              tone="gold"
              value={`$${lifetimeEstimate}`}
              sub={
                monthsActive > 0
                  ? `Across ${monthsActive} month${monthsActive === 1 ? '' : 's'}`
                  : '—'
              }
            />
            <StatTile
              label="Past due"
              tone={pastDue.length > 0 ? 'red' : 'neutral'}
              value={String(pastDue.length)}
              sub={pastDue.length > 0 ? 'Action required' : 'All paid'}
              trend={pastDue.length > 0 ? { value: 'Resolve', dir: 'down' } : undefined}
            />
          </Row>

          <DashGrid aside={aside}>
            {isLoading && <EmptyState icon="card" title="Loading subscriptions…" />}

            {!isLoading &&
              active.length === 0 &&
              pastDue.length === 0 &&
              cancelled.length === 0 && (
                <EmptyState
                  icon="card"
                  title="No subscriptions yet"
                  subtitle="Discover creators and subscribe to start receiving premium picks."
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

            {pastDue.length > 0 && (
              <>
                <SectionHead
                  size="sm"
                  eyebrow="Action needed"
                  title="Past due"
                  sub="Update your card to keep these subscriptions active."
                  action={
                    <Badge tone="red" dot>
                      {pastDue.length}
                    </Badge>
                  }
                />
                <Stack gap={2}>
                  {pastDue.map((sub) => (
                    <SubscriptionTile
                      key={sub._id}
                      creatorName={sub.creatorName}
                      creatorHandle={sub.creatorHandle}
                      creatorMono={sub.creatorMono}
                      creatorColor={sub.creatorColor}
                      plan={sub.plan}
                      price={sub.creatorStartingPrice}
                      status="past_due"
                      meta="Payment failed"
                      primaryAction={
                        <Button variant="primary" size="sm">
                          Retry payment
                        </Button>
                      }
                      secondaryAction={
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/creators/${sub.creatorHandle}`)}
                        >
                          View
                        </Button>
                      }
                    />
                  ))}
                </Stack>
              </>
            )}

            {active.length > 0 && (
              <>
                <SectionHead
                  size="sm"
                  eyebrow="Currently subscribed"
                  title="Active plans"
                  sub={`${active.length} creator${active.length === 1 ? '' : 's'} · $${totalMonthly}/mo total`}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      iconLeft="compass"
                      onClick={() => navigate('/account/discover')}
                    >
                      Add more
                    </Button>
                  }
                />
                <Stack gap={2}>
                  {active.map((sub) => (
                    <SubscriptionTile
                      key={sub._id}
                      creatorName={sub.creatorName}
                      creatorHandle={sub.creatorHandle}
                      creatorMono={sub.creatorMono}
                      creatorColor={sub.creatorColor}
                      plan={sub.plan}
                      price={sub.creatorStartingPrice}
                      status="active"
                      meta={sub.renewsAt ? `Renews ${fmtDate(sub.renewsAt)}` : undefined}
                      primaryAction={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/creators/${sub.creatorHandle}`)}
                        >
                          View profile
                        </Button>
                      }
                      secondaryAction={
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(sub.creatorId)}
                          disabled={cancelling === sub.creatorId}
                        >
                          {cancelling === sub.creatorId ? 'Cancelling…' : 'Cancel'}
                        </Button>
                      }
                    />
                  ))}
                </Stack>
              </>
            )}

            {cancelled.length > 0 && (
              <>
                <SectionHead
                  size="sm"
                  eyebrow="Inactive"
                  title="Cancelled"
                  sub="Resubscribe anytime — your history with these creators is preserved."
                />
                <Stack gap={2}>
                  {cancelled.map((sub) => (
                    <SubscriptionTile
                      key={sub._id}
                      creatorName={sub.creatorName}
                      creatorHandle={sub.creatorHandle}
                      creatorMono={sub.creatorMono}
                      creatorColor={sub.creatorColor}
                      plan={sub.plan}
                      price={sub.creatorStartingPrice}
                      status="cancelled"
                      meta={sub.cancelledAt ? `Cancelled ${fmtDate(sub.cancelledAt)}` : undefined}
                      primaryAction={
                        <Button
                          variant="primary"
                          size="sm"
                          iconRight="arrow-right"
                          onClick={() => navigate(`/creators/${sub.creatorHandle}`)}
                        >
                          Resubscribe
                        </Button>
                      }
                    />
                  ))}
                </Stack>
              </>
            )}
          </DashGrid>
        </Stack>
      </Container>
    </>
  );
}
