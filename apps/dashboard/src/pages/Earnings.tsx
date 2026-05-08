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
} from '@digipicks/ds';
import type { BadgeTone } from '@digipicks/ds';
import { INVOICES } from '../data/mock';

const STATUS_TONE: Record<string, BadgeTone> = {
  paid: 'green',
  pending: 'amber',
  failed: 'red',
};

export function Earnings() {
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
            <Button variant="primary" size="sm">
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
            sub="MRR, payouts, and historical invoices — net of platform and processing fees."
          />

          <StatGrid
            items={[
              { id: 'mrr', label: 'MRR', value: <Mono>$12,480</Mono>, sub: <Badge tone="green" dot>+18.4%</Badge> },
              { id: 'pending', label: 'Pending payout', value: <Mono>$3,148.20</Mono>, sub: <Muted>arrives May 31</Muted> },
              { id: 'lifetime', label: 'Lifetime', value: <Mono>$84,210</Mono>, sub: <Muted>since Jan 2024</Muted> },
              { id: 'take', label: 'Take rate', value: <Mono>87%</Mono>, sub: <Muted>creator share</Muted> },
            ]}
          />

          <Row gap={5} wrap>
            <Col gap={4}>
              <Card>
                <CardHead title="This month" sub="May 2026" />
                <Stack gap={2}>
                  <KV k="Subscriptions billed" v={<Mono>426</Mono>} />
                  <KV k="Gross revenue" v={<Mono>$14,346.00</Mono>} />
                  <KV k="Platform fee · 10%" v={<Mono>−$1,434.60</Mono>} />
                  <KV k="Stripe processing" v={<Mono>−$431.00</Mono>} />
                  <KV k="Net to creator" v={<Mono>$12,480.40</Mono>} />
                </Stack>
              </Card>
            </Col>

            <Col gap={4}>
              <Card>
                <CardHead title="Payout method" sub="Default destination for monthly payouts" />
                <Stack gap={2}>
                  <KV k="Bank" v="Chase Business Checking" />
                  <KV k="Account" v={<Mono>•••• 4391</Mono>} />
                  <KV k="Schedule" v="1st of each month" />
                  <Row gap={2}>
                    <Button variant="secondary" size="sm">
                      Change method
                    </Button>
                  </Row>
                </Stack>
              </Card>
            </Col>
          </Row>

          <Card pad="sm">
            <CardHead title="Invoices" sub="Monthly payouts and statements" />
            <Table>
              <THead>
                <Tr>
                  <Th>Invoice</Th>
                  <Th>Date</Th>
                  <Th>Description</Th>
                  <Th numeric>Amount</Th>
                  <Th>Status</Th>
                </Tr>
              </THead>
              <TBody>
                {INVOICES.map((i) => (
                  <Tr key={i.id}>
                    <Td>
                      <Mono>{i.id}</Mono>
                    </Td>
                    <Td>
                      <Muted>{i.date}</Muted>
                    </Td>
                    <Td>{i.description}</Td>
                    <Td numeric>
                      <Mono>{i.amount}</Mono>
                    </Td>
                    <Td>
                      <Badge tone={STATUS_TONE[i.status] ?? 'mute'} dot>
                        {i.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>
        </Stack>
      </Container>
    </>
  );
}
