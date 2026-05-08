import React from 'react';
import {
  Topbar,
  Container,
  Stack,
  Row,
  Col,
  Card,
  CardHead,
  Button,
  Icon,
  PageHead,
  Breadcrumb,
  Metric,
  Mono,
  Muted,
  Badge,
  KV,
  FeatureCard,
} from '@digipicks/ds';

export function Growth() {
  return (
    <>
      <Topbar
        title="Growth Manager"
        crumb={<Breadcrumb items={[{ label: 'Growth' }, { label: 'Manager' }]} />}
        actions={
          <Button variant="primary" size="sm">
            <Icon name="megaphone" size={13} />
            New campaign
          </Button>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Growth"
            title="Move the needle this week"
            sub="Promotions, referrals, and funnels — pick a lever and run with it."
          />

          <Row gap={4} wrap>
            <Col gap={0}>
              <Metric label="Profile views · 30d" value={<Mono>4,820</Mono>} delta={{ value: '+12%', dir: 'up' }} />
            </Col>
            <Col gap={0}>
              <Metric label="Started checkout" value={<Mono>612</Mono>} delta={{ value: '+8%', dir: 'up' }} />
            </Col>
            <Col gap={0}>
              <Metric label="New subscribers" value={<Mono>142</Mono>} delta={{ value: '+34', dir: 'up' }} />
            </Col>
            <Col gap={0}>
              <Metric label="Trial → paid" value={<Mono>67%</Mono>} delta={{ value: '+2.4 pts', dir: 'up' }} />
            </Col>
          </Row>

          <Row gap={5} wrap>
            <Col gap={4}>
              <Card>
                <CardHead title="Opportunities" sub="3 new this week, ranked by expected impact" />
                <Stack gap={3}>
                  <FeatureCard
                    icon={<Icon name="sparkles" size={18} />}
                    title="Free pick on Friday slate"
                    body="A free pick on Friday boosts checkout by ~24% historically. Estimated MRR lift: $620."
                  />
                  <FeatureCard
                    icon={<Icon name="gift" size={18} />}
                    title="Trial offer for past visitors"
                    body="384 unique visitors viewed your profile in the last 30 days without subscribing. A 7-day trial converts ~12%."
                  />
                  <FeatureCard
                    icon={<Icon name="megaphone" size={18} />}
                    title="Win streak announcement"
                    body="You're on W4. Posting a recap is the second-highest converting content type after a free pick."
                  />
                </Stack>
              </Card>
            </Col>

            <Col gap={4}>
              <Card>
                <CardHead title="Referrals" sub="Your top advocates" />
                <Stack gap={2}>
                  <KV k="Total referred subs" v={<Mono>38</Mono>} />
                  <KV k="Top referrer" v="Avery Dunne (12)" />
                  <KV k="Reward issued" v={<Mono>$320</Mono>} />
                  <Row gap={2}>
                    <Button variant="primary" size="sm">
                      Configure rewards
                    </Button>
                  </Row>
                </Stack>
              </Card>

              <Card>
                <CardHead title="Active campaigns" />
                <Stack gap={2}>
                  <Row gap={3} between>
                    <Stack gap={0}>
                      <span>Spring slate trial</span>
                      <Muted>Started Apr 28 · ends May 31</Muted>
                    </Stack>
                    <Badge tone="green" dot>
                      Live
                    </Badge>
                  </Row>
                  <Row gap={3} between>
                    <Stack gap={0}>
                      <span>Free preview · Knicks</span>
                      <Muted>Single post · 4d ago</Muted>
                    </Stack>
                    <Badge tone="mute">Ended</Badge>
                  </Row>
                </Stack>
              </Card>
            </Col>
          </Row>
        </Stack>
      </Container>
    </>
  );
}
