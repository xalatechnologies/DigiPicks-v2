import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Stat,
  Eyebrow,
  Mono,
  Badge,
  Sparkline,
  Section,
  MetricGrid,
  PersonRow,
  TitleSub,
  PickCard,
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

export function Overview() {
  const navigate = useNavigate();

  const me = useQuery(api.users.meSafe);
  const creator = useQuery(
    api.creators.get,
    me?.creatorId ? { id: me.creatorId } : 'skip',
  );
  const recentPicks = useQuery(
    api.picks.byCreator,
    creator?._id ? { creatorId: creator._id, limit: 6 } : 'skip',
  );
  const subCount = useQuery(
    api.subscriptions.countByCreator,
    creator?._id ? { creatorId: creator._id } : 'skip',
  );

  const recentSubsRaw = useQuery(
    api.subscriptions.byCreator,
    creator?._id ? { creatorId: creator._id, limit: 5 } : 'skip',
  );
  const recentSubs = (recentSubsRaw ?? []).map((s) => ({
    id: s._id,
    name: s.subscriberName,
    mono: s.subscriberMono,
    color: '#3A4F7A',
    email: s.subscriberEmail,
    plan: s.plan === 'premium' ? 'Premium' as const : s.plan === 'vip' ? 'VIP' as const : 'Trial' as const,
    ltv: '—',
  }));

  const displayName = creator?.name ?? me?.name ?? 'creator';

  return (
    <>
      <PageHeader
        title="Overview"
        crumbs={[{ label: 'Studio' }, { label: 'Overview' }]}
        actions={
          <Row gap={2}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/dashboard/messages')}
            >
              <Icon name="message" size={13} />
              Message subscribers
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/create')}>
              <Icon name="plus" size={13} />
              Create pick
            </Button>
          </Row>
        }
      />

      <Container size="2xl">
        <Stack gap={6}>
          <Section
            eyebrow="A quick read on your studio, audience, and growth"
            title={`Welcome back, ${displayName}.`}
            sub="Tonight's slate, your in-flight picks, and your fastest-growing levers."
          />

          <MetricGrid
            items={[
              {
                id: 'mrr',
                label: 'Monthly recurring revenue',
                // TODO: convex — needs api.earnings.mrr(creatorId).
                value: <Mono>$12,480</Mono>,
                delta: { value: '+18.4%', dir: 'up' },
                icon: <Icon name="dollar" size={14} />,
              },
              {
                id: 'subs',
                label: 'Active subscribers',
                value: (
                  <Mono>{typeof subCount === 'number' ? subCount.toLocaleString() : '—'}</Mono>
                ),
                icon: <Icon name="users" size={14} />,
              },
              {
                id: 'win',
                label: 'Win rate',
                value: (
                  <Mono>
                    {creator ? `${(creator.winRate * 100).toFixed(1)}%` : '—'}
                  </Mono>
                ),
                icon: <Icon name="trophy" size={14} />,
              },
              {
                id: 'units',
                label: 'Units',
                value: <Mono>{creator?.units ?? '—'}</Mono>,
                icon: <Icon name="chart" size={14} />,
              },
            ]}
          />

          <Row gap={5} wrap>
            <Col gap={4}>
              <Card>
                <CardHead
                  title="Recent picks"
                  sub="Drafts, scheduled, and pending grade"
                  action={
                    <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/picks')}>
                      Open manager
                      <Icon name="arrow-right" size={12} />
                    </Button>
                  }
                />
                {recentPicks === undefined ? (
                  <EmptyState icon="inbox" title="Loading picks…" />
                ) : recentPicks.length === 0 ? (
                  <EmptyState
                    icon="inbox"
                    title="No picks yet"
                    subtitle="Publish your first pick to start building a track record."
                    action={
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/dashboard/create')}
                      >
                        <Icon name="plus" size={13} />
                        Create pick
                      </Button>
                    }
                  />
                ) : (
                  <Stack gap={3}>
                    {recentPicks.map((p) => (
                      <PickCard
                        key={p._id}
                        creatorName={creator?.name ?? ''}
                        creatorHandle={creator?.handle ?? ''}
                        creatorMono={creator?.avatarMono ?? ''}
                        creatorColor={creator?.avatarColor ?? ''}
                        creatorVerified={creator?.verified ?? false}
                        access={p.access}
                        sport={p.sport}
                        event={p.eventName}
                        eventTime={p.eventTime}
                        posted={new Date(p.createdAt).toLocaleString()}
                        title={p.title}
                        market={p.market}
                        selection={p.selection}
                        odds={p.odds}
                        units={p.units}
                        body={p.body}
                        teaser={p.teaser}
                        status={p.grade ?? p.status}
                      />
                    ))}
                  </Stack>
                )}
              </Card>
            </Col>

            <Col gap={4}>
              <Card>
                <CardHead title="Quick actions" sub="Move the needle this week" />
                <Stack gap={3}>
                  <QuickAction
                    icon="plus"
                    title="Create a pick"
                    sub="Publish or schedule"
                    cta="Start"
                    onClick={() => navigate('/dashboard/create')}
                  />
                  <QuickAction
                    icon="card"
                    title="Smart pricing"
                    sub="Try $54/mo (recommended)"
                    cta="Review"
                    onClick={() => navigate('/dashboard/products')}
                  />
                  <QuickAction
                    icon="megaphone"
                    title="Growth manager"
                    sub="3 new opportunities"
                    cta="View"
                    onClick={() => navigate('/dashboard/growth')}
                  />
                </Stack>
              </Card>

              <Card>
                <CardHead
                  title="Recent subscribers"
                  sub="Newest joins and trial conversions"
                  action={
                    <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/subscribers')}>
                      All subs
                      <Icon name="arrow-right" size={12} />
                    </Button>
                  }
                />
                <Stack gap={3}>
                  {recentSubs.map((u) => (
                    <PersonRow
                      key={u.id}
                      name={u.name}
                      sub={u.email}
                      mono={u.mono}
                      color={u.color}
                      trailing={<Stat label={u.plan} value={<Mono>{u.ltv}</Mono>} />}
                    />
                  ))}
                </Stack>
              </Card>

              <Card>
                <CardHead
                  title="Track record"
                  sub={creator?.niche ?? '—'}
                  action={<Badge tone="green">{creator?.units ?? '—'}</Badge>}
                />
                <Row gap={4} between>
                  <Stack gap={1}>
                    <Eyebrow>Win rate</Eyebrow>
                    <Mono>
                      {creator ? `${(creator.winRate * 100).toFixed(1)}%` : '—'}
                    </Mono>
                  </Stack>
                  <Stack gap={1}>
                    <Eyebrow>Record</Eyebrow>
                    <Mono>{creator?.record ?? '—'}</Mono>
                  </Stack>
                  <Sparkline values={[3, 5, 4, 6, 8, 7, 10, 12, 11, 14]} width={140} height={36} />
                </Row>
              </Card>
            </Col>
          </Row>
        </Stack>
      </Container>
    </>
  );
}

interface QuickActionProps {
  icon: string;
  title: string;
  sub: string;
  cta: string;
  onClick?: () => void;
}

function QuickAction({ icon, title, sub, cta, onClick }: QuickActionProps) {
  return (
    <Card hover pad="sm" onClick={onClick}>
      <Row gap={3} between>
        <Row gap={3}>
          <Button variant="secondary" size="sm" iconOnly aria-label={title}>
            <Icon name={icon} size={16} />
          </Button>
          <TitleSub title={title} sub={sub} />
        </Row>
        <Button variant="ghost" size="sm">
          {cta}
          <Icon name="arrow-right" size={12} />
        </Button>
      </Row>
    </Card>
  );
}
