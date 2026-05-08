import React from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@digipicks/ds';
import { FEED_PICKS, CREATORS, STUDIO_SUBSCRIBERS, creatorById } from '../data/studio';

export function Overview() {
  const navigate = useNavigate();

  const recentPicks = FEED_PICKS.slice(0, 3);
  const recentSubs = STUDIO_SUBSCRIBERS.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Overview"
        crumbs={[{ label: 'Studio' }, { label: 'Overview' }]}
        actions={
          <Row gap={2}>
            <Button variant="secondary" size="sm">
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
            eyebrow="Tuesday, May 14 · 7 picks pending grade · 2 events tonight"
            title="Good evening, Marco."
            sub="A quick read on your studio, audience, and growth — tonight's slate is loaded."
          />

          <MetricGrid
            items={[
              {
                id: 'mrr',
                label: 'Monthly recurring revenue',
                value: <Mono>$12,480</Mono>,
                delta: { value: '+18.4%', dir: 'up' },
                icon: <Icon name="dollar" size={14} />,
              },
              {
                id: 'subs',
                label: 'Active subscribers',
                value: <Mono>426</Mono>,
                delta: { value: '+34 this mo', dir: 'up' },
                icon: <Icon name="users" size={14} />,
              },
              {
                id: 'win',
                label: 'Win rate · 30d',
                value: <Mono>61.2%</Mono>,
                delta: { value: '+1.8 pts', dir: 'up' },
                icon: <Icon name="trophy" size={14} />,
              },
              {
                id: 'roi',
                label: 'ROI · 30d',
                value: <Mono>+11.4%</Mono>,
                delta: { value: '+2.1 pts', dir: 'up' },
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
                <Stack gap={3}>
                  {recentPicks.map((p) => {
                    const c = creatorById(p.creator) ?? CREATORS[0];
                    return (
                      <PickCard
                        key={p.id}
                        creatorName={c.name}
                        creatorHandle={c.handle}
                        creatorMono={c.avatar.mono}
                        creatorColor={c.avatar.color}
                        creatorVerified={c.verified}
                        access={p.access}
                        sport={p.sport}
                        event={p.event}
                        eventTime={p.eventTime}
                        posted={p.posted}
                        title={p.title}
                        market={p.market}
                        selection={p.selection}
                        odds={p.odds}
                        units={p.units}
                        body={p.body}
                        teaser={p.teaser}
                        status={p.status}
                      />
                    );
                  })}
                </Stack>
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
                  title="Top market · last 30d"
                  sub="Player Props · NBA"
                  action={<Badge tone="green">+24.6u</Badge>}
                />
                <Row gap={4} between>
                  <Stack gap={1}>
                    <Eyebrow>Win rate</Eyebrow>
                    <Mono>64.3%</Mono>
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
