import React from 'react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Card,
  Button,
  Icon,
  Avatar,
  Badge,
  Mono,
  Muted,
  Search,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  PageHead,
  MetricGrid,
  FilterChips,
  TitleSub,
} from '@digipicks/ds';
import type { BadgeTone } from '@digipicks/ds';
import { STUDIO_SUBSCRIBERS } from '../data/studio';

const PLAN_TONE: Record<string, BadgeTone> = {
  Premium: 'gold',
  VIP: 'violet',
  Trial: 'blue',
};

const STATUS_TONE: Record<string, BadgeTone> = {
  active: 'green',
  past_due: 'amber',
  churned: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  past_due: 'Past due',
  churned: 'Churned',
};

const PLAN_OPTIONS = ['Premium', 'VIP', 'Trial'];

export function Subscribers() {
  const [query, setQuery] = React.useState('');
  const [plan, setPlan] = React.useState<string | null>(null);

  const filtered = STUDIO_SUBSCRIBERS.filter((u) => {
    if (plan && u.plan !== plan) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const active = STUDIO_SUBSCRIBERS.filter((u) => u.status === 'active').length;
  const pastDue = STUDIO_SUBSCRIBERS.filter((u) => u.status === 'past_due').length;
  const churned = STUDIO_SUBSCRIBERS.filter((u) => u.status === 'churned').length;

  return (
    <>
      <PageHeader
        title="Subscribers"
        crumbs={[{ label: 'Audience' }, { label: 'Subscribers' }]}
        actions={
          <Row gap={2}>
            <Button variant="secondary" size="sm">
              <Icon name="message" size={13} />
              Broadcast
            </Button>
            <Button variant="primary" size="sm">
              <Icon name="plus" size={13} />
              Invite
            </Button>
          </Row>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Audience"
            title="Subscribers"
            sub="Active members across Premium and VIP — sorted by lifetime value."
          />

          <MetricGrid
            items={[
              { id: 'active', label: 'Active', value: <Mono>{active}</Mono>, delta: { value: '+34 mo', dir: 'up' } },
              { id: 'past_due', label: 'Past due', value: <Mono>{pastDue}</Mono>, delta: { value: 'monitor', dir: 'flat' } },
              { id: 'churned', label: 'Churned · 30d', value: <Mono>{churned}</Mono>, delta: { value: '−2 vs prev', dir: 'down' } },
              { id: 'ltv', label: 'Avg LTV', value: <Mono>$184</Mono>, delta: { value: '+$12 mo', dir: 'up' } },
            ]}
          />

          <Row gap={3} between wrap>
            <FilterChips
              options={PLAN_OPTIONS}
              value={plan}
              onChange={setPlan}
              allLabel="All plans"
            />
            <Search
              placeholder="Search by name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Row>

          <Card pad="sm">
            <Table>
              <THead>
                <Tr>
                  <Th>Member</Th>
                  <Th>Plan</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th numeric>LTV</Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.map((u) => (
                  <Tr key={u.id}>
                    <Td>
                      <Row gap={3}>
                        <Avatar mono={u.mono} color={u.color} size={32} />
                        <TitleSub title={u.name} sub={u.email} />
                      </Row>
                    </Td>
                    <Td>
                      <Badge tone={PLAN_TONE[u.plan] ?? 'mute'}>{u.plan}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={STATUS_TONE[u.status] ?? 'mute'} dot>
                        {STATUS_LABEL[u.status] ?? u.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Muted>{u.joined} ago</Muted>
                    </Td>
                    <Td numeric>
                      <Mono>{u.ltv}</Mono>
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
