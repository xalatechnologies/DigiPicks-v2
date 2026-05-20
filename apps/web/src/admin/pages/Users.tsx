import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Button,
  EmptyState,
  Search,
  Mono,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { ADMIN } from '../lib/adminRoutes';

export function Users() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const users = useQuery(api.admin.usersList, { search: search || undefined });

  return (
    <Container size="2xl">
      <Stack gap={5}>
        <StudioPageHeader
          eyebrow="Admin"
          title="Users"
          sub="Search subscribers and creators by email or name."
        />
        <Search
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users…"
          aria-label="Search users"
        />
        <Card pad="sm">
          {users === undefined ? (
            <EmptyState icon="users" title="Loading…" />
          ) : users.length === 0 ? (
            <EmptyState icon="users" title="No users found" />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Email</Th>
                  <Th>Name</Th>
                  <Th>Role</Th>
                  <Th />
                </Tr>
              </THead>
              <TBody>
                {users.map((u) => (
                  <Tr key={u._id}>
                    <Td>
                      <Mono>{u.email ?? '—'}</Mono>
                    </Td>
                    <Td>{u.name ?? '—'}</Td>
                    <Td>{u.role}</Td>
                    <Td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`${ADMIN.users}/${u._id}/entitlements`)}
                      >
                        Entitlements
                      </Button>
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
