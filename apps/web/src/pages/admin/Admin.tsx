import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Section,
  PageHead,
  Row,
  Stack,
  Grid,
  Card,
  CardHead,
  Button,
  Icon,
  Mono,
  Muted,
  Badge,
  Metric,
  EmptyState,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function Admin() {
  const navigate = useNavigate();
  const summary = useQuery(api.admin.summary, {});
  const isLoading = summary === undefined;

  return (
    <main>
      <Container size="xl">
        <PageHead
          eyebrow="Admin"
          title="Operations"
          sub="Moderation queues, application review, and audit activity. All actions are logged."
          actions={
            <Row gap={2}>
              <Button
                variant="secondary"
                iconLeft="audit"
                disabled
              >
                Audit log
              </Button>
            </Row>
          }
        />

        <Section>
          {isLoading ? (
            <EmptyState icon="audit" title="Loading admin summary…" />
          ) : (
            <Grid cols={3} gap={4}>
              <Metric
                label="Pending event review"
                value={String(summary.pendingEventReview)}
                delta={
                  summary.pendingEventReview > 0
                    ? { value: 'queue', dir: 'up' }
                    : undefined
                }
              />
              <Metric
                label="Pending applications"
                value={String(summary.pendingApplications)}
                delta={
                  summary.pendingApplications > 0
                    ? { value: 'queue', dir: 'up' }
                    : undefined
                }
              />
              <Metric
                label="Flagged applications"
                value={String(summary.flaggedApplications)}
                delta={
                  summary.flaggedApplications > 0
                    ? { value: 'attention', dir: 'up' }
                    : undefined
                }
              />
            </Grid>
          )}
        </Section>

        <Section eyebrow="Queues" title="Where to act first.">
          <Grid cols={2} gap={4}>
            <Card pad="lg">
              <CardHead
                title="Event review"
                sub="Creator-submitted events awaiting admin verification"
                action={
                  summary && summary.pendingEventReview > 0 ? (
                    <Badge tone="amber" dot>
                      {summary.pendingEventReview} waiting
                    </Badge>
                  ) : (
                    <Badge tone="green" dot>
                      Empty
                    </Badge>
                  )
                }
              />
              <Stack gap={3}>
                <Muted>
                  Approve federated events before they surface on the public
                  /events feed. Rejection cancels the event and notifies the
                  creator.
                </Muted>
                <Row gap={2}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/admin/events/review')}
                  >
                    <Icon name="arrow-right" size={13} />
                    Open queue
                  </Button>
                </Row>
              </Stack>
            </Card>

            <Card pad="lg">
              <CardHead
                title="Creator applications"
                sub="Approve or reject creator onboarding"
                action={
                  summary && summary.pendingApplications > 0 ? (
                    <Badge tone="amber" dot>
                      {summary.pendingApplications} waiting
                    </Badge>
                  ) : (
                    <Badge tone="green" dot>
                      Empty
                    </Badge>
                  )
                }
              />
              <Stack gap={3}>
                <Muted>
                  Application review UI lights up when the dedicated admin
                  page ships. Until then, use the Convex dashboard
                  (applications.review).
                </Muted>
                <Row gap={2}>
                  <Button variant="secondary" size="sm" disabled>
                    <Icon name="user" size={13} />
                    Open queue
                  </Button>
                </Row>
              </Stack>
            </Card>
          </Grid>
        </Section>

        <Section eyebrow="Audit" title="Recent platform activity.">
          {!summary || summary.recentAudit.length === 0 ? (
            <Card pad="md">
              <EmptyState
                icon="audit"
                title="No recent audit entries."
                subtitle="Mutations that touch sensitive surfaces (admin actions, webhook events) write to the audit log."
              />
            </Card>
          ) : (
            <Card pad="sm">
              <Table>
                <THead>
                  <Tr>
                    <Th>Action</Th>
                    <Th>Entity</Th>
                    <Th>ID</Th>
                    <Th>When</Th>
                  </Tr>
                </THead>
                <TBody>
                  {summary.recentAudit.map((row) => (
                    <Tr key={row._id}>
                      <Td>
                        <Mono>{row.action}</Mono>
                      </Td>
                      <Td>{row.entityType}</Td>
                      <Td>
                        <Mono>{row.entityId ?? '—'}</Mono>
                      </Td>
                      <Td>
                        <Muted>{formatTime(row.createdAt)}</Muted>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}
        </Section>
      </Container>
    </main>
  );
}
