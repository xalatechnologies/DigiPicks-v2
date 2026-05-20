import React from 'react';
import { useQuery } from 'convex/react';
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
  EmptyState,
  StudioSummaryGrid,
  Badge,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

export function Billing() {
  const summary = useQuery(api.admin.billingSummary, {});
  const rows = useQuery(api.admin.subscriptionsList, { limit: 50 });

  return (
    <Container size="2xl">
      <Stack gap={5}>
        <StudioPageHeader
          eyebrow="Admin"
          title="Subscriptions & billing"
          sub="Platform subscription health and MRR signals."
        />
        {summary ? (
          <StudioSummaryGrid
            items={[
              { id: 'a', icon: 'users', label: 'Active subs', value: String(summary.activeCount) },
              { id: 'p', icon: 'clock', label: 'Past due', value: String(summary.pastDueCount) },
              { id: 't', icon: 'card', label: 'Total', value: String(summary.totalCount) },
            ]}
          />
        ) : null}
        <Card pad="sm">
          {rows === undefined ? (
            <EmptyState icon="card" title="Loading…" />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Subscriber</Th>
                  <Th>Creator</Th>
                  <Th>Plan</Th>
                  <Th>Status</Th>
                </Tr>
              </THead>
              <TBody>
                {rows.map(({ sub, subscriber, creator }) => (
                  <Tr key={sub._id}>
                    <Td>{subscriber?.email ?? '—'}</Td>
                    <Td>{creator?.handle ?? '—'}</Td>
                    <Td>{sub.plan}</Td>
                    <Td>
                      <Badge tone={sub.status === 'active' ? 'green' : 'amber'}>{sub.status}</Badge>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
