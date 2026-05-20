import React from 'react';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  PageHead,
  Card,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  EmptyState,
  Muted,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

export function PayoutsAdmin() {
  const creators = useQuery(api.admin.creatorsList, { limit: 50 });

  return (
    <Container size="2xl">
      <Stack gap={5}>
        <PageHead
          eyebrow="Admin"
          title="Payouts & finance"
          sub="Creator Connect status and monthly payout records."
        />
        <Card pad="sm">
          {creators === undefined ? (
            <EmptyState icon="dollar" title="Loading…" />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Creator</Th>
                  <Th>Connect</Th>
                  <Th>Account ID</Th>
                </Tr>
              </THead>
              <TBody>
                {creators.map((c) => (
                  <Tr key={c._id}>
                    <Td>{c.handle}</Td>
                    <Td>{c.connectStatus ?? 'not_started'}</Td>
                    <Td>
                      <Muted>{c.stripeConnectAccountId?.slice(-8) ?? '—'}</Muted>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
        <Muted>
          Detailed payout rows sync from Stripe Connect once creators complete onboarding (zip 89).
        </Muted>
      </Stack>
    </Container>
  );
}
