import React from 'react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Col,
  Button,
  Icon,
  PriceCard,
  PageHead,
  Card,
  CardHead,
  KV,
  Mono,
  Badge,
  TitleSub,
} from '@digipicks/ds';
import type { BadgeTone } from '@digipicks/ds';

interface PlanDef {
  id: string;
  name: string;
  price: string;
  period: string;
  featured?: boolean;
  features: string[];
  ctaLabel: string;
  ctaVariant: 'primary' | 'outline';
}

const PLANS: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'mo',
    features: [
      '1–2 free picks per week',
      'Discoverable in feed',
      'No analysis attached',
      'Sample of voice and edge',
    ],
    ctaLabel: 'Configure',
    ctaVariant: 'outline',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$39',
    period: 'mo',
    featured: true,
    features: [
      'All picks · pre-game only',
      'Full analysis & confidence',
      'Direct messages with creator',
      'Discord access (subscribers-only)',
      'Cancel anytime',
    ],
    ctaLabel: 'Edit plan',
    ctaVariant: 'primary',
  },
  {
    id: 'vip',
    name: 'VIP',
    price: '$99',
    period: 'mo',
    features: [
      'Everything in Premium',
      'Early access · 30 min head-start',
      'Live events & voice rooms',
      'Quarterly 1:1 strategy call',
      'Priority replies on DMs',
    ],
    ctaLabel: 'Edit plan',
    ctaVariant: 'outline',
  },
];

interface DiscountDef {
  code: string;
  description: string;
  status: 'Live' | 'Paused';
}

const DISCOUNT_TONE: Record<DiscountDef['status'], BadgeTone> = {
  Live: 'green',
  Paused: 'amber',
};

const DISCOUNTS: DiscountDef[] = [
  { code: 'FIRST30', description: '30% off first month · Premium', status: 'Live' },
  { code: 'SLATE7', description: '7-day free trial · VIP', status: 'Paused' },
];

export function Products() {
  return (
    <>
      <PageHeader
        title="Products"
        crumbs={[{ label: 'Studio' }, { label: 'Products' }]}
        actions={
          <Button variant="primary" size="sm">
            <Icon name="plus" size={13} />
            New plan
          </Button>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Studio"
            title="Plans & pricing"
            sub="Free is your funnel. Premium is the workhorse. VIP is your high-conviction lane."
          />

          <Row gap={4} wrap>
            {PLANS.map((plan) => (
              <Col key={plan.id} gap={0}>
                <PriceCard
                  name={plan.name}
                  price={plan.price}
                  period={plan.period}
                  featured={plan.featured}
                  features={plan.features}
                  cta={
                    <Button variant={plan.ctaVariant} size="md" block>
                      {plan.ctaLabel}
                    </Button>
                  }
                />
              </Col>
            ))}
          </Row>

          <Row gap={5} wrap>
            <Col gap={4}>
              <Card>
                <CardHead
                  title="Smart pricing recommendation"
                  sub="Based on your win rate, demand, and competitor pricing"
                  action={<Badge tone="gold">Recommended</Badge>}
                />
                <Stack gap={3}>
                  <KV k="Recommended Premium" v={<Mono>$54/mo</Mono>} />
                  <KV k="Estimated MRR lift" v={<Mono>+$1,840/mo</Mono>} />
                  <KV k="Expected churn impact" v={<Mono>+0.6 pts</Mono>} />
                  <Row gap={2}>
                    <Button variant="primary" size="sm">
                      Apply pricing
                    </Button>
                    <Button variant="ghost" size="sm">
                      Run another model
                    </Button>
                  </Row>
                </Stack>
              </Card>
            </Col>

            <Col gap={4}>
              <Card>
                <CardHead title="Active discounts" sub="Promotions running on your products" />
                <Stack gap={2}>
                  {DISCOUNTS.map((d) => (
                    <Row key={d.code} gap={3} between>
                      <TitleSub title={d.code} sub={d.description} />
                      <Badge tone={DISCOUNT_TONE[d.status]} dot>
                        {d.status}
                      </Badge>
                    </Row>
                  ))}
                </Stack>
              </Card>

              <Card>
                <CardHead title="Tax & invoicing" sub="Set once, applies to every payout" />
                <Stack gap={2}>
                  <KV k="Business name" v="CourtVision Media LLC" />
                  <KV k="Tax ID" v={<Mono>EIN ••••3492</Mono>} />
                  <KV k="Default currency" v="USD" />
                </Stack>
              </Card>
            </Col>
          </Row>
        </Stack>
      </Container>
    </>
  );
}
