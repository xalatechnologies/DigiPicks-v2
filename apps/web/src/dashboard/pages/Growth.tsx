import React from 'react';
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
  MetricGrid,
  Mono,
  Badge,
  KV,
  FeatureCard,
  TitleSub,
} from '@digipicks/ds';
import type { BadgeTone } from '@digipicks/ds';

interface Opportunity {
  id: string;
  icon: string;
  title: string;
  body: string;
}

const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'free-friday',
    icon: 'sparkles',
    title: 'Free pick on Friday slate',
    body: 'A free pick on Friday boosts checkout by ~24% historically. Estimated MRR lift: $620.',
  },
  {
    id: 'trial-revisit',
    icon: 'gift',
    title: 'Trial offer for past visitors',
    body: '384 unique visitors viewed your profile in the last 30 days without subscribing. A 7-day trial converts ~12%.',
  },
  {
    id: 'streak-recap',
    icon: 'megaphone',
    title: 'Win streak announcement',
    body: "You're on W4. Posting a recap is the second-highest converting content type after a free pick.",
  },
];

interface CampaignDef {
  id: string;
  title: string;
  meta: string;
  status: 'Live' | 'Ended';
}

const CAMPAIGN_TONE: Record<CampaignDef['status'], BadgeTone> = {
  Live: 'green',
  Ended: 'mute',
};

const CAMPAIGNS: CampaignDef[] = [
  {
    id: 'spring-trial',
    title: 'Spring slate trial',
    meta: 'Started Apr 28 · ends May 31',
    status: 'Live',
  },
  {
    id: 'free-knicks',
    title: 'Free preview · Knicks',
    meta: 'Single post · 4d ago',
    status: 'Ended',
  },
];

export function Growth() {
  return (
    <>
      <PageHeader
        title="Growth Manager"
        crumbs={[{ label: 'Growth' }, { label: 'Manager' }]}
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

          <MetricGrid
            items={[
              { id: 'views', label: 'Profile views · 30d', value: <Mono>4,820</Mono>, delta: { value: '+12%', dir: 'up' } },
              { id: 'checkout', label: 'Started checkout', value: <Mono>612</Mono>, delta: { value: '+8%', dir: 'up' } },
              { id: 'new', label: 'New subscribers', value: <Mono>142</Mono>, delta: { value: '+34', dir: 'up' } },
              { id: 'trial', label: 'Trial → paid', value: <Mono>67%</Mono>, delta: { value: '+2.4 pts', dir: 'up' } },
            ]}
          />

          <Row gap={5} wrap>
            <Col gap={4}>
              <Card>
                <CardHead title="Opportunities" sub="3 new this week, ranked by expected impact" />
                <Stack gap={3}>
                  {OPPORTUNITIES.map((o) => (
                    <FeatureCard
                      key={o.id}
                      icon={<Icon name={o.icon} size={18} />}
                      title={o.title}
                      body={o.body}
                    />
                  ))}
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
                  {CAMPAIGNS.map((c) => (
                    <Row key={c.id} gap={3} between>
                      <TitleSub title={c.title} sub={c.meta} />
                      <Badge tone={CAMPAIGN_TONE[c.status]} dot={c.status === 'Live'}>
                        {c.status}
                      </Badge>
                    </Row>
                  ))}
                </Stack>
              </Card>
            </Col>
          </Row>
        </Stack>
      </Container>
    </>
  );
}
