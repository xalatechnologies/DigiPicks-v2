import React from 'react';
import {
  Topbar,
  Container,
  Stack,
  Row,
  Col,
  Button,
  Icon,
  PriceCard,
  PageHead,
  Breadcrumb,
  Card,
  CardHead,
  KV,
  Mono,
  Muted,
  Badge,
} from '@digipicks/ds';

export function Products() {
  return (
    <>
      <Topbar
        title="Products"
        crumb={<Breadcrumb items={[{ label: 'Studio' }, { label: 'Products' }]} />}
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
            <Col gap={0}>
              <PriceCard
                name="Free"
                price="$0"
                period="mo"
                features={[
                  '1–2 free picks per week',
                  'Discoverable in feed',
                  'No analysis attached',
                  'Sample of voice and edge',
                ]}
                cta={
                  <Button variant="outline" size="md" block>
                    Configure
                  </Button>
                }
              />
            </Col>
            <Col gap={0}>
              <PriceCard
                name="Premium"
                price="$39"
                period="mo"
                featured
                features={[
                  'All picks · pre-game only',
                  'Full analysis & confidence',
                  'Direct messages with creator',
                  'Discord access (subscribers-only)',
                  'Cancel anytime',
                ]}
                cta={
                  <Button variant="primary" size="md" block>
                    Edit plan
                  </Button>
                }
              />
            </Col>
            <Col gap={0}>
              <PriceCard
                name="VIP"
                price="$99"
                period="mo"
                features={[
                  'Everything in Premium',
                  'Early access · 30 min head-start',
                  'Live events & voice rooms',
                  'Quarterly 1:1 strategy call',
                  'Priority replies on DMs',
                ]}
                cta={
                  <Button variant="outline" size="md" block>
                    Edit plan
                  </Button>
                }
              />
            </Col>
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
                  <Row gap={3} between>
                    <Stack gap={0}>
                      <span>FIRST30</span>
                      <Muted>30% off first month · Premium</Muted>
                    </Stack>
                    <Badge tone="green" dot>
                      Live
                    </Badge>
                  </Row>
                  <Row gap={3} between>
                    <Stack gap={0}>
                      <span>SLATE7</span>
                      <Muted>7-day free trial · VIP</Muted>
                    </Stack>
                    <Badge tone="amber" dot>
                      Paused
                    </Badge>
                  </Row>
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
