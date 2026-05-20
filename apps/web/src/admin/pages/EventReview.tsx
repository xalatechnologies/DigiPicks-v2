import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Card,
  Button,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  SportTag,
  EventSourceBadge,
  Badge,
  Mono,
  Muted,
  StudioPageHeader,
  TitleSub,
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AdminEventReview() {
  const navigate = useNavigate();
  const events = useQuery(api.events.pendingReview, { limit: 100 });
  const reviewEvent = useMutation(api.events.reviewEvent);

  const [busyId, setBusyId] = React.useState<Id<'events'> | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function review(eventId: Id<'events'>, decision: 'approve' | 'reject') {
    setError(null);
    setBusyId(eventId);
    try {
      await reviewEvent({ eventId, decision });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record review.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Container size="2xl">
      <Stack gap={5}>
        <StudioPageHeader
          eyebrow="Admin · Moderation"
          title="Event review"
          sub="Events authored by creators awaiting verification. Approving an event makes it visible on the public feed."
          actions={
            <Button variant="secondary" size="sm" onClick={() => navigate('/events')}>
              Public events
            </Button>
          }
        />

        {error && (
          <Card>
            <Row gap={3}>
              <Badge tone="red" dot>
                Error
              </Badge>
              <Muted>{error}</Muted>
            </Row>
          </Card>
        )}

        {events === undefined ? (
          <Card pad="sm">
            <EmptyState icon="calendar" title="Loading review queue…" />
          </Card>
        ) : events.length === 0 ? (
          <Card pad="sm">
            <EmptyState
              icon="check"
              title="No events awaiting review."
              subtitle="The queue is clear. New creator submissions will appear here."
            />
          </Card>
        ) : (
          <Card pad="sm">
            <Table>
              <THead>
                <Tr>
                  <Th>Title</Th>
                  <Th>Sport</Th>
                  <Th>League</Th>
                  <Th>Source</Th>
                  <Th>Starts</Th>
                  <Th>Visibility</Th>
                  <Th>Actions</Th>
                </Tr>
              </THead>
              <TBody>
                {events.map((e) => (
                  <Tr key={e._id}>
                    <Td>
                      <TitleSub title={e.title ?? `${e.home} vs ${e.away}`} sub={e.time} />
                    </Td>
                    <Td>
                      <SportTag sport={e.sport} />
                    </Td>
                    <Td>{e.league}</Td>
                    <Td>
                      <EventSourceBadge source={e.sourceType ?? 'creator'} />
                    </Td>
                    <Td>
                      <Muted>{formatDate(e.startsAt)}</Muted>
                    </Td>
                    <Td>
                      <Mono>{e.visibility ?? 'public'}</Mono>
                    </Td>
                    <Td>
                      <Row gap={2}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => review(e._id, 'approve')}
                          disabled={busyId !== null}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => review(e._id, 'reject')}
                          disabled={busyId !== null}
                        >
                          Reject
                        </Button>
                      </Row>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
