import React from 'react';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  StudioPageHeader,
  Card,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  EmptyState,
  StudioSummaryGrid,
  Segmented,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Reviewing' },
];

export function Refunds() {
  const [filter, setFilter] = React.useState('all');
  const summary = useQuery(api.billingCases.adminSummary, {});
  const queue = useQuery(
    api.billingCases.adminQueue,
    filter === 'all' ? {} : { status: filter as 'open' | 'under_review' | 'pending_finance' },
  );
  const transition = useMutation(api.billingCases.transition);
  const [activeId, setActiveId] = React.useState<Id<'billingCases'> | null>(null);

  return (
    <Container size="2xl">
      <Stack gap={5}>
        <StudioPageHeader
          eyebrow="Finance"
          title="Refunds & disputes"
          sub="Billing cases, chargebacks, and subscription refunds."
          actions={
            <Segmented options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Filter" />
          }
        />
        {summary ? (
          <StudioSummaryGrid
            items={[
              { id: 'o', icon: 'flag', label: 'Open', value: String(summary.openDisputes) },
              {
                id: 'r',
                icon: 'dollar',
                label: 'Refunds (mo)',
                value: `$${(summary.refundsThisMonthCents / 100).toFixed(2)}`,
              },
              {
                id: 'c',
                icon: 'flag',
                label: 'Chargebacks',
                value: String(summary.activeChargebacks),
              },
            ]}
          />
        ) : null}
        <Card pad="sm">
          {queue === undefined ? (
            <EmptyState icon="card" title="Loading…" />
          ) : queue.length === 0 ? (
            <EmptyState
              icon="card"
              title="No billing cases"
              subtitle="Cases appear when subscribers open refund requests."
            />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Case</Th>
                  <Th>User</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th />
                </Tr>
              </THead>
              <TBody>
                {queue.map(({ case: c, subscriber }) => (
                  <Tr key={c._id}>
                    <Td>{c.caseNumber}</Td>
                    <Td>{subscriber?.email ?? '—'}</Td>
                    <Td>${(c.amountCents / 100).toFixed(2)}</Td>
                    <Td>
                      <Badge tone="amber">{c.status}</Badge>
                    </Td>
                    <Td>
                      <Button variant="ghost" size="sm" onClick={() => setActiveId(c._id)}>
                        Open
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
        {activeId ? (
          <Card pad="lg">
            <Stack gap={2}>
              <Button
                variant="primary"
                onClick={() => transition({ caseId: activeId, status: 'refunded' })}
              >
                Mark refunded
              </Button>
              <Button
                variant="secondary"
                onClick={() => transition({ caseId: activeId, status: 'denied' })}
              >
                Deny
              </Button>
            </Stack>
          </Card>
        ) : null}
      </Stack>
    </Container>
  );
}
