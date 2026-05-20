import React from 'react';
import { useQuery } from 'convex/react';
import {
  Container,
  Section,
  Stack,
  Grid,
  Card,
  CardHead,
  Badge,
  Metric,
  EmptyState,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  Mono,
  Muted,
  StudioPageHeader,
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

export function AuditLogs() {
  const summary = useQuery(api.admin.summary, {});
  const auditMetrics = useQuery(api.audit.metrics, {});
  const autoGrader = useQuery(api.admin.autoGraderStats, {});

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Admin · Audit"
          title="Audit logs"
          sub="Append-only platform activity, retention buckets, and auto-grader health."
        />

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
          sub="Counts of picks the hourly auto-grader resolved from this audit window."
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
                subtitle="Sensitive admin actions and webhooks write to the audit log."
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
      </Stack>
    </Container>
  );
}
