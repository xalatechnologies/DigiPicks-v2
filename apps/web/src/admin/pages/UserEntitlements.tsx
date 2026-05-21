import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  StudioPageHeader,
  CardHead,
  Card,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  Button,
  EmptyState,
  AdminMetricStrip,
  Field,
  Input,
  Muted,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ADMIN } from '../lib/adminRoutes';

export function UserEntitlements() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const data = useQuery(
    api.entitlements.adminByUser,
    userId ? { userId: userId as Id<'users'> } : 'skip',
  );
  const grant = useMutation(api.entitlements.grantOverride);
  const [resourceId, setResourceId] = React.useState('');
  const [creatorId, setCreatorId] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function handleGrant() {
    if (!userId || !creatorId || !resourceId) return;
    setBusy(true);
    try {
      await grant({
        userId: userId as Id<'users'>,
        creatorId: creatorId as Id<'creators'>,
        resourceType: 'pick_feed',
        resourceId,
        reason: 'Admin manual override',
      });
      setResourceId('');
    } finally {
      setBusy(false);
    }
  }

  if (!userId) {
    return (
      <Container size="2xl">
        <EmptyState icon="user" title="User not specified" />
      </Container>
    );
  }

  const kpiItems = data
    ? [
        { label: 'Subscriptions', value: String(data.subscriptionCount) },
        { label: 'Entitlements', value: String(data.activeEntitlementCount) },
        { label: 'Access logs', value: String(data.accessLogs.length) },
        { label: 'Account', value: 'Active' },
      ]
    : [
        { label: 'Subscriptions', value: '—' },
        { label: 'Entitlements', value: '—' },
        { label: 'Access logs', value: '—' },
        { label: 'Account', value: '—' },
      ];

  return (
    <Container size="2xl">
      <Stack gap={10}>
        <StudioPageHeader
          eyebrow="Operational hub"
          title={data?.user?.email ?? 'User entitlements'}
          sub="Active access across subscriptions and manual overrides."
          actions={
            <Button variant="outline" onClick={() => navigate(`${ADMIN.users}?id=${userId}`)}>
              Back to user
            </Button>
          }
        />

        <AdminMetricStrip columns={5} items={kpiItems} />

        <Card pad="sm">
          {data === undefined ? (
            <EmptyState icon="lock" title="Loading entitlements…" />
          ) : !data || data.entitlements.length === 0 ? (
            <EmptyState
              icon="lock"
              title="No entitlements"
              subtitle="Grant a manual override below if needed."
            />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Resource</Th>
                  <Th>Creator</Th>
                  <Th>Status</Th>
                  <Th>Source</Th>
                </Tr>
              </THead>
              <TBody>
                {(data?.entitlements ?? []).map((e, i) => (
                  <Tr key={e.resourceId ?? i}>
                    <Td>{e.resourceType}</Td>
                    <Td>{String(e.creatorName)}</Td>
                    <Td>{e.status}</Td>
                    <Td>{e.source}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Card pad="lg">
          <CardHead title="Manual override" sub="Grant pick-feed access outside Stripe." />
          <Stack gap={3}>
            <Field label="Creator ID">
              <Input value={creatorId} onChange={(e) => setCreatorId(e.target.value)} />
            </Field>
            <Field label="Resource ID">
              <Input value={resourceId} onChange={(e) => setResourceId(e.target.value)} />
            </Field>
            <Row gap={2}>
              <Button variant="primary" disabled={busy} onClick={handleGrant}>
                Grant override
              </Button>
            </Row>
          </Stack>
        </Card>

        <Card pad="sm">
          <CardHead title="Access logs" sub="Recent allow/deny decisions." />
          {data?.accessLogs.length === 0 ? (
            <Muted>No access logs yet.</Muted>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Resource</Th>
                  <Th>Result</Th>
                  <Th>Time</Th>
                </Tr>
              </THead>
              <TBody>
                {data?.accessLogs.map((log) => (
                  <Tr key={log._id}>
                    <Td>{log.resourceId}</Td>
                    <Td>{log.result}</Td>
                    <Td>{new Date(log.createdAt).toLocaleString()}</Td>
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
