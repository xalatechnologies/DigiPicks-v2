import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
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
  Segmented,
  Field,
  TextArea,
  Muted,
  StudioPageHeader,
  StudioRefineCard,
  QuickActionGrid,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { adminCrossLinks } from '../lib/adminCrossLinks';
import type { Id } from '../../../../../convex/_generated/dataModel';

const FILTERS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'review', label: 'In review' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export function Applications() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('submitted');
  const apps = useQuery(api.applications.listByStatus, {
    status: status as 'submitted' | 'review' | 'more_info' | 'flagged' | 'approved' | 'rejected',
  });
  const review = useMutation(api.applications.review);
  const [activeId, setActiveId] = useState<Id<'applications'> | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const active = apps?.find((a) => a._id === activeId);

  async function handleReview(next: 'approved' | 'rejected' | 'review') {
    if (!activeId) return;
    setBusy(true);
    try {
      await review({ id: activeId, status: next, reviewNotes: notes.trim() || undefined });
      setActiveId(null);
      setNotes('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Admin · Onboarding"
          title="Creator applications"
          sub="Review onboarding requests before provisioning studio access."
        />

        <StudioRefineCard
          title="Refine queue"
          sub="Filter applications by review status."
          summary={
            apps === undefined
              ? 'Loading…'
              : `${apps.length} application${apps.length === 1 ? '' : 's'}`
          }
          onReset={status !== 'submitted' ? () => setStatus('submitted') : undefined}
        >
          <Segmented options={FILTERS} value={status} onChange={setStatus} ariaLabel="Status" />
        </StudioRefineCard>

        <Card pad="sm">
          {apps === undefined ? (
            <EmptyState icon="user" title="Loading…" />
          ) : apps.length === 0 ? (
            <EmptyState icon="user" title="No applications" subtitle="Nothing in this queue." />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Handle</Th>
                  <Th>Name</Th>
                  <Th>Sport</Th>
                  <Th>Status</Th>
                  <Th />
                </Tr>
              </THead>
              <TBody>
                {apps.map((a) => (
                  <Tr key={a._id}>
                    <Td>{a.handle}</Td>
                    <Td>{a.name}</Td>
                    <Td>{a.sport}</Td>
                    <Td>
                      <Badge tone="blue">{a.status}</Badge>
                    </Td>
                    <Td>
                      <Button variant="ghost" size="sm" onClick={() => setActiveId(a._id)}>
                        Review
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        {active ? (
          <Card pad="lg">
            <StudioPageHeader
              eyebrow="Review"
              title={active.name}
              sub={`@${active.handle} · ${active.email}`}
            />
            {active.aiAuthenticityScore != null ? (
              <Muted>AI authenticity score: {active.aiAuthenticityScore}</Muted>
            ) : null}
            <Field label="Review notes">
              <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <Stack gap={2}>
              <Button variant="primary" disabled={busy} onClick={() => handleReview('approved')}>
                Approve
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => handleReview('review')}>
                Mark in review
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => handleReview('rejected')}>
                Reject
              </Button>
            </Stack>
          </Card>
        ) : null}

        <QuickActionGrid title="Related" items={adminCrossLinks('applications', navigate)} />
      </Stack>
    </Container>
  );
}
