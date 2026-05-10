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
  const auditMetrics = useQuery(api.audit.metrics, {});
  const autoGrader = useQuery(api.admin.autoGraderStats, {});
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
              <Button variant="secondary" iconLeft="audit" disabled>
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
                delta={summary.pendingEventReview > 0 ? { value: 'queue', dir: 'up' } : undefined}
              />
              <Metric
                label="Pending applications"
                value={String(summary.pendingApplications)}
                delta={summary.pendingApplications > 0 ? { value: 'queue', dir: 'up' } : undefined}
              />
              <Metric
                label="Flagged applications"
                value={String(summary.flaggedApplications)}
                delta={
                  summary.flaggedApplications > 0 ? { value: 'attention', dir: 'up' } : undefined
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
                  Approve federated events before they surface on the public /events feed. Rejection
                  cancels the event and notifies the creator.
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
                  Application review UI lights up when the dedicated admin page ships. Until then,
                  use the Convex dashboard (applications.review).
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

        <Section eyebrow="Retention" title="Audit log size by age.">
          <Card pad="lg">
            <CardHead
              title="Retention buckets"
              sub={
                auditMetrics
                  ? `${auditMetrics.total.toLocaleString()} total entries · retention policy ${auditMetrics.retentionDays}d`
                  : 'Loading…'
              }
              action={
                <Badge tone="blue" dot>
                  Append-only
                </Badge>
              }
            />
            {auditMetrics ? (
              <Grid cols={3} gap={3}>
                <Metric label="Last 7 days" value={auditMetrics.last7d.toLocaleString()} />
                <Metric label="Last 30 days" value={auditMetrics.last30d.toLocaleString()} />
                <Metric label="Last 90 days" value={auditMetrics.last90d.toLocaleString()} />
                <Metric label="Last 1 year" value={auditMetrics.last1y.toLocaleString()} />
                <Metric
                  label="Older than 1 year"
                  value={auditMetrics.olderThan1y.toLocaleString()}
                />
                <Metric
                  label="Older than 2 years"
                  value={auditMetrics.olderThan2y.toLocaleString()}
                />
              </Grid>
            ) : (
              <EmptyState icon="audit" title="Loading retention metrics…" />
            )}
          </Card>
        </Section>

        <Section
          eyebrow="Auto-grader"
          title="Cron grading health."
          sub="Counts of picks the hourly auto-grader resolved from this audit window. Spot-check the sample below to catch misgrades early."
        >
          <Card pad="lg">
            <CardHead
              title="Recent auto-grades"
              sub={
                autoGrader
                  ? `Window: latest ${autoGrader.windowSize.toLocaleString()} audit entries · ${autoGrader.total.toLocaleString()} auto-graded`
                  : 'Loading…'
              }
              action={
                <Badge tone="blue" dot>
                  Hourly cron
                </Badge>
              }
            />
            {autoGrader ? (
              <Stack gap={4}>
                <Grid cols={4} gap={3}>
                  <Metric label="Wins" value={String(autoGrader.counts.win ?? 0)} />
                  <Metric label="Losses" value={String(autoGrader.counts.loss ?? 0)} />
                  <Metric label="Pushes" value={String(autoGrader.counts.push ?? 0)} />
                  <Metric label="Voids" value={String(autoGrader.counts.void ?? 0)} />
                </Grid>
                {autoGrader.sample.length === 0 ? (
                  <EmptyState
                    icon="audit"
                    title="No auto-grades in this window."
                    subtitle="The cron may not have fired yet, or no events have completed since."
                  />
                ) : (
                  <Table>
                    <THead>
                      <Tr>
                        <Th>Pick</Th>
                        <Th>Grade</Th>
                        <Th>Net units</Th>
                        <Th>When</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {autoGrader.sample.map((row) => (
                        <Tr key={row.id}>
                          <Td>
                            <Mono>{row.pickId ?? '—'}</Mono>
                          </Td>
                          <Td>
                            <Badge
                              tone={
                                row.grade === 'win'
                                  ? 'green'
                                  : row.grade === 'loss'
                                    ? 'red'
                                    : 'amber'
                              }
                            >
                              {row.grade}
                            </Badge>
                          </Td>
                          <Td>
                            <Mono>{row.netUnits === null ? '—' : row.netUnits.toFixed(2)}</Mono>
                          </Td>
                          <Td>
                            <Muted>{formatTime(row.createdAt)}</Muted>
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                )}
              </Stack>
            ) : (
              <EmptyState icon="audit" title="Loading auto-grader stats…" />
            )}
          </Card>
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
