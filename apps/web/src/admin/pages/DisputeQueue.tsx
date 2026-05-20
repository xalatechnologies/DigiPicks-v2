import React from 'react';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Section,
  StudioPageHeader,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  Mono,
  Muted,
  Badge,
  EmptyState,
  Field,
  TextArea,
  Segmented,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  type BadgeTone,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

const STATUS_TONE: Record<DisputeStatus, BadgeTone> = {
  open: 'amber',
  under_review: 'blue',
  resolved: 'green',
  dismissed: 'red',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Reviewing' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

function fmtTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Admin dispute moderation queue. Lists every dispute with status filter,
 * inline transition controls, and resolution-note capture.
 *
 * Routed under /admin/disputes; auth gate is upstream in admin/Routes.
 */
export function DisputeQueue() {
  const [filter, setFilter] = React.useState<string>('all');
  const queue = useQuery(
    api.disputes.queue,
    filter === 'all' ? {} : { status: filter as DisputeStatus },
  );
  const transition = useMutation(api.disputes.transition);

  const [activeId, setActiveId] = React.useState<Id<'disputes'> | null>(null);
  const [resolution, setResolution] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const active = queue?.find(({ dispute }) => dispute._id === activeId) ?? null;

  React.useEffect(() => {
    setResolution(active?.dispute.resolution ?? '');
  }, [active?.dispute._id]);

  async function handleTransition(next: DisputeStatus) {
    if (!activeId) return;
    setError(null);
    setBusy(true);
    try {
      await transition({
        disputeId: activeId,
        status: next,
        resolution: resolution.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not transition dispute.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container size="2xl">
      <Stack gap={5}>
        <StudioPageHeader
          eyebrow="Admin"
          title="Dispute queue"
          sub="Review subscriber + creator disputes against graded picks."
          actions={
            <Segmented
              options={STATUS_FILTERS}
              value={filter}
              onChange={setFilter}
              ariaLabel="Filter by status"
            />
          }
        />

        <Section>
          <Row gap={4} wrap>
            <Card>
              <CardHead title="Open queue" sub={`${queue?.length ?? 0} disputes`} />
              {queue === undefined ? (
                <EmptyState icon="flag" title="Loading…" />
              ) : queue.length === 0 ? (
                <EmptyState
                  icon="flag"
                  title="No disputes"
                  subtitle="Nothing to review with this filter."
                />
              ) : (
                <Table>
                  <THead>
                    <Tr>
                      <Th>Status</Th>
                      <Th>Pick</Th>
                      <Th>Reason</Th>
                      <Th>Opener</Th>
                      <Th>Opened</Th>
                      <Th>Action</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {queue.map(({ dispute, pick, opener, creator }) => {
                      const status = dispute.status as DisputeStatus;
                      return (
                        <Tr key={dispute._id}>
                          <Td>
                            <Badge tone={STATUS_TONE[status]}>{status}</Badge>
                          </Td>
                          <Td>
                            <Mono>{pick?.title ?? '—'}</Mono>
                            {creator && <Muted> · {creator.handle}</Muted>}
                          </Td>
                          <Td>{dispute.reason}</Td>
                          <Td>
                            <Mono>{opener?.email ?? opener?._id.slice(-6) ?? '—'}</Mono>
                          </Td>
                          <Td>{fmtTime(dispute.createdAt)}</Td>
                          <Td>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveId(dispute._id)}
                            >
                              Open
                            </Button>
                          </Td>
                        </Tr>
                      );
                    })}
                  </TBody>
                </Table>
              )}
            </Card>

            {active && (
              <Card>
                <CardHead
                  title={active.pick?.title ?? 'Dispute detail'}
                  sub={
                    active.creator
                      ? `${active.creator.handle} · ${active.dispute.reason}`
                      : active.dispute.reason
                  }
                  action={
                    <Badge tone={STATUS_TONE[active.dispute.status as DisputeStatus]}>
                      {active.dispute.status}
                    </Badge>
                  }
                />
                <Stack gap={3}>
                  {active.dispute.detail && <Muted>{active.dispute.detail}</Muted>}

                  <Field label="Resolution note" help="Stored on the dispute + audit log.">
                    <TextArea
                      rows={3}
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      maxLength={2000}
                    />
                  </Field>

                  {error && <Muted>{error}</Muted>}

                  <Row gap={2} wrap>
                    {active.dispute.status === 'open' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        onClick={() => handleTransition('under_review')}
                      >
                        <Icon name="eye" size={13} />
                        Mark reviewing
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleTransition('resolved')}
                    >
                      <Icon name="check" size={13} />
                      Resolve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleTransition('dismissed')}
                    >
                      <Icon name="x" size={13} />
                      Dismiss
                    </Button>
                  </Row>

                  {active.dispute.notes.length > 0 && (
                    <Stack gap={2}>
                      <Muted>Notes</Muted>
                      {active.dispute.notes.map((n, i) => (
                        <Card key={i} pad="sm">
                          <Stack gap={1}>
                            <Muted>{fmtTime(n.createdAt)}</Muted>
                            <span>{n.body}</span>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Card>
            )}
          </Row>
        </Section>
      </Stack>
    </Container>
  );
}
