import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
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
  Badge,
  Muted,
  Mono,
  KV,
  Metric,
  PersonRow,
  EmptyState,
  Divider,
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

export function Subscriptions() {
  const navigate = useNavigate();
  const subs = useQuery(api.subscriptions.mySubscriptions);
  const cancelSub = useMutation(api.subscriptions.cancel);

  const [cancelling, setCancelling] = React.useState<Id<'creators'> | null>(null);

  const isLoading = subs === undefined;
  const active = subs?.filter((s) => s.status === 'active') ?? [];
  const cancelled = subs?.filter((s) => s.status === 'cancelled') ?? [];
  const totalMonthly = active.reduce((sum, s) => sum + s.creatorStartingPrice, 0);

  async function handleCancel(creatorId: Id<'creators'>) {
    setCancelling(creatorId);
    try {
      await cancelSub({ creatorId });
    } catch {
      // swallow — useQuery recovers
    } finally {
      setCancelling(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Subscriptions"
        crumbs={[{ label: 'Account' }, { label: 'Subscriptions' }]}
        actions={
          <Button
            variant="primary"
            size="sm"
            iconRight="arrow-right"
            onClick={() => navigate('/account/discover')}
          >
            Discover more
          </Button>
        }
      />

      <Container size="xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Billing"
            title="Subscriptions & billing"
            sub="Transparent control over what you pay for."
          />

          <Row gap={4} wrap>
            <Metric label="Active subscriptions" value={String(active.length)} />
            <Metric label="Monthly cost" value={`$${totalMonthly}`} />
            <Metric label="Lifetime spend" value={`$${totalMonthly * 3}`} />
          </Row>

          {isLoading && (
            <EmptyState icon="card" title="Loading subscriptions…" />
          )}

          {!isLoading && active.length === 0 && cancelled.length === 0 && (
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

          {active.length > 0 && (
            <Card>
              <CardHead title="Active subscriptions" sub={`${active.length} active plan${active.length !== 1 ? 's' : ''}`} />
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
                          <Mono>{`$${sub.creatorStartingPrice}`}</Mono>
                          <Badge tone="green" dot>Active</Badge>
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

          <Row gap={4} wrap>
            <Col gap={4}>
              <Card>
                <CardHead title="Payment methods" />
                <Stack gap={3}>
                  <Row gap={3}>
                    <Badge tone="blue">VISA</Badge>
                    <Stack gap={1}>
                      <Mono>•••• •••• •••• 4242</Mono>
                      <Muted>Expires 09/28 · Default</Muted>
                    </Stack>
                  </Row>
                  <Button variant="outline" size="sm" iconLeft="plus">
                    Add payment method
                  </Button>
                </Stack>
              </Card>
            </Col>

            <Col gap={4}>
              <Card>
                <CardHead title="Billing history" action={<Button variant="ghost" size="sm">All invoices</Button>} />
                <Stack gap={0}>
                  {active.slice(0, 3).map((sub, i) => (
                    <React.Fragment key={`bill-${sub._id}`}>
                      {i > 0 && <Divider />}
                      <KV
                        k={sub.startedAt ? fmtDate(sub.startedAt) : '—'}
                        v={
                          <Row gap={2}>
                            <Muted>{sub.creatorName} · {sub.plan}</Muted>
                            <Mono>{`$${sub.creatorStartingPrice}.00`}</Mono>
                          </Row>
                        }
                      />
                    </React.Fragment>
                  ))}
                  {active.length === 0 && (
                    <Muted>No billing history yet.</Muted>
                  )}
                </Stack>
              </Card>
            </Col>
          </Row>

          {cancelled.length > 0 && (
            <Card>
              <CardHead title="Cancelled" sub="Previous subscriptions" />
              <Stack gap={0}>
                {cancelled.map((sub, i) => (
                  <React.Fragment key={sub._id}>
                    {i > 0 && <Divider />}
                    <PersonRow
                      name={sub.creatorName}
                      sub={`Cancelled ${sub.cancelledAt ? fmtDate(sub.cancelledAt) : '—'}`}
                      mono={sub.creatorMono}
                      color={sub.creatorColor}
                      trailing={
                        <Badge tone="mute">Cancelled</Badge>
                      }
                    />
                  </React.Fragment>
                ))}
              </Stack>
            </Card>
          )}
        </Stack>
      </Container>
    </>
  );
}
