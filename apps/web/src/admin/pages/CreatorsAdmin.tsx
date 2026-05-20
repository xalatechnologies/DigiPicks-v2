import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  StudioPageHeader,
  QuickActionGrid,
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
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { adminCrossLinks } from '../lib/adminCrossLinks';
import type { Id } from '../../../../../convex/_generated/dataModel';

export function CreatorsAdmin() {
  const navigate = useNavigate();
  const creators = useQuery(api.admin.creatorsList, {});
  const setStatus = useMutation(api.admin.setCreatorStatus);

  async function suspend(id: Id<'creators'>) {
    await setStatus({ creatorId: id, status: 'suspended' });
  }

  async function activate(id: Id<'creators'>) {
    await setStatus({ creatorId: id, status: 'active' });
  }

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Admin · Creators"
          title="Creators"
          sub="Verify, suspend, and monitor creator accounts."
        />
        <Card pad="sm">
          {creators === undefined ? (
            <EmptyState icon="verified" title="Loading…" />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Handle</Th>
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Trust</Th>
                  <Th />
                </Tr>
              </THead>
              <TBody>
                {creators.map((c) => (
                  <Tr key={c._id}>
                    <Td>{c.handle}</Td>
                    <Td>{c.name}</Td>
                    <Td>
                      <Badge tone={c.status === 'active' ? 'green' : 'amber'}>{c.status}</Badge>
                    </Td>
                    <Td>{c.trustScore ?? '—'}</Td>
                    <Td>
                      {c.status === 'active' ? (
                        <Button variant="ghost" size="sm" onClick={() => suspend(c._id)}>
                          Suspend
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => activate(c._id)}>
                          Activate
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <QuickActionGrid title="Related" items={adminCrossLinks('creators', navigate)} />
      </Stack>
    </Container>
  );
}
