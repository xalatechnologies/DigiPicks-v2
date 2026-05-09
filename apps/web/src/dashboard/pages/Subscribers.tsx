import React from 'react';
import { useQuery } from 'convex/react';
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
  EmptyState,
} from '@digipicks/ds';
import type { BadgeTone } from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

const PLAN_TONE: Record<string, BadgeTone> = {
  premium: 'gold',
  vip: 'violet',
  trial: 'blue',
};

const PLAN_LABEL: Record<string, string> = {
  premium: 'Premium',
  vip: 'VIP',
  trial: 'Trial',
};

const STATUS_TONE: Record<string, BadgeTone> = {
  active: 'green',
  past_due: 'amber',
  cancelled: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  past_due: 'Past due',
  cancelled: 'Cancelled',
};

const PLAN_OPTIONS = [
  { label: 'Premium', value: 'premium' },
  { label: 'VIP', value: 'vip' },
  { label: 'Trial', value: 'trial' },
];

function formatJoinedAgo(startedAt: number): string {
  const days = Math.floor((Date.now() - startedAt) / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

export function Subscribers() {
  const [query, setQuery] = React.useState('');
  const [plan, setPlan] = React.useState<string | null>(null);

  const me = useQuery(api.users.meSafe);
  const creator = useQuery(
    api.creators.get,
    me?.creatorId ? { id: me.creatorId } : 'skip',
  );
  const activeCount = useQuery(
    api.subscriptions.countByCreator,
    creator?._id ? { creatorId: creator._id } : 'skip',
  );
  const subsRaw = useQuery(
    api.subscriptions.byCreator,
    creator?._id ? { creatorId: creator._id } : 'skip',
  );

  const subs = subsRaw ?? [];

  const filtered = subs.filter((u) => {
    if (plan && u.plan !== plan) return false;
    if (query) {
      const q = query.toLowerCase();
      if (
        !u.subscriberName.toLowerCase().includes(q) &&
        !u.subscriberEmail.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const pastDue = subs.filter((u) => u.status === 'past_due').length;
  const cancelled = subs.filter((u) => u.status === 'cancelled').length;

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
              {
                id: 'active',
                label: 'Active',
                value: (
                  <Mono>
                    {typeof activeCount === 'number' ? activeCount.toLocaleString() : '—'}
                  </Mono>
                ),
              },
              { id: 'past_due', label: 'Past due', value: <Mono>{pastDue}</Mono>, delta: { value: 'monitor', dir: 'flat' } },
              { id: 'cancelled', label: 'Cancelled', value: <Mono>{cancelled}</Mono> },
              { id: 'total', label: 'Total', value: <Mono>{subs.length}</Mono> },
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

          {subsRaw === undefined ? (
            <Card pad="sm">
              <EmptyState icon="inbox" title="Loading subscribers…" />
            </Card>
          ) : filtered.length === 0 ? (
            <Card pad="sm">
              <EmptyState
                icon="users"
                title="No subscribers yet."
                subtitle="Share your creator link to start building your audience."
              />
            </Card>
          ) : (
            <Card pad="sm">
              <Table>
                <THead>
                  <Tr>
                    <Th>Member</Th>
                    <Th>Plan</Th>
                    <Th>Status</Th>
                    <Th>Joined</Th>
                  </Tr>
                </THead>
                <TBody>
                  {filtered.map((u) => (
                    <Tr key={u._id}>
                      <Td>
                        <Row gap={3}>
                          <Avatar mono={u.subscriberMono} color="#3A4F7A" size={32} />
                          <TitleSub title={u.subscriberName} sub={u.subscriberEmail} />
                        </Row>
                      </Td>
                      <Td>
                        <Badge tone={PLAN_TONE[u.plan] ?? 'mute'}>{PLAN_LABEL[u.plan] ?? u.plan}</Badge>
                      </Td>
                      <Td>
                        <Badge tone={STATUS_TONE[u.status] ?? 'mute'} dot>
                          {STATUS_LABEL[u.status] ?? u.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Muted>{formatJoinedAgo(u.startedAt)}</Muted>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}
        </Stack>
      </Container>
    </>
  );
}
