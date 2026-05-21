import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Section,
  Grid,
  Card,
  CardHead,
  Badge,
  Metric,
  EmptyState,
  StudioPageHeader,
  AdminMetricStrip,
  AdminAuditFilterBar,
  AdminAuditTable,
  AdminAuditDetailDrawer,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import {
  AUDIT_ENTITY_FILTERS,
  formatAuditTime,
  matchesAuditSearch,
  parseAuditEntity,
  type AuditEntityFilter,
} from '../lib/auditAdmin';

function useAuditParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const entity = parseAuditEntity(searchParams.get('entity'));
  const activeId = searchParams.get('id') as Id<'auditLogs'> | null;

  const setEntity = (next: AuditEntityFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('entity');
    else params.set('entity', next);
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setActiveId = (id: Id<'auditLogs'> | null) => {
    const params = new URLSearchParams(searchParams);
    if (id) params.set('id', id);
    else params.delete('id');
    setSearchParams(params, { replace: true });
  };

  return { entity, activeId, setEntity, setActiveId };
}

export function AuditLogs() {
  const { entity, activeId, setEntity, setActiveId } = useAuditParams();
  const [search, setSearch] = useState('');

  const summary = useQuery(api.admin.summary, {});
  const hubSummary = useQuery(api.admin.auditHubSummary, {});
  const auditMetrics = useQuery(api.audit.metrics, {});
  const autoGrader = useQuery(api.admin.autoGraderStats, {});
  const auditRows = useQuery(api.admin.auditList, {
    entityType: entity === 'all' ? undefined : entity,
    limit: 100,
  });

  const filtered = useMemo(() => {
    if (!auditRows) return undefined;
    return auditRows.filter((row) => matchesAuditSearch(row, search));
  }, [auditRows, search]);

  const tableRows = useMemo(() => {
    if (!filtered) return [];
    return filtered.map((row) => ({
      id: row._id,
      action: row.action,
      entityType: row.entityType,
      entityIdLabel: row.entityId ?? '—',
      timeLabel: formatAuditTime(row.createdAt),
    }));
  }, [filtered]);

  const active = useMemo(
    () => auditRows?.find((r) => r._id === activeId) ?? null,
    [auditRows, activeId],
  );

  const kpiItems = useMemo(() => {
    if (!hubSummary) {
      return [
        { label: 'Recent entries', value: '—' },
        { label: 'Retention (7d)', value: '—' },
        { label: 'Retention (30d)', value: '—' },
        { label: 'Entity types', value: '—' },
        { label: 'Latest event', value: '—' },
      ];
    }
    const entityCount = Object.keys(hubSummary.byEntity).length;
    return [
      { label: 'Recent entries', value: String(hubSummary.totalRecent) },
      {
        label: 'Retention (7d)',
        value: auditMetrics ? auditMetrics.last7d.toLocaleString() : '—',
      },
      {
        label: 'Retention (30d)',
        value: auditMetrics ? auditMetrics.last30d.toLocaleString() : '—',
      },
      { label: 'Entity types', value: String(entityCount) },
      {
        label: 'Latest event',
        value: hubSummary.latestAt ? formatAuditTime(hubSummary.latestAt) : '—',
      },
    ];
  }, [hubSummary, auditMetrics]);

  const footerLabel =
    filtered === undefined
      ? undefined
      : `Showing ${filtered.length} entr${filtered.length === 1 ? 'y' : 'ies'}`;

  const metadataJson = active?.metadata ? JSON.stringify(active.metadata, null, 2) : undefined;

  return (
    <Container size="2xl">
      <Stack gap={10}>
        <StudioPageHeader
          eyebrow="Operational hub"
          title="Audit logs"
          sub="Append-only platform activity, retention buckets, and auto-grader health."
        />

        <AdminMetricStrip columns={5} items={kpiItems} />

        <Stack gap={6}>
          <AdminAuditFilterBar
            entityOptions={[...AUDIT_ENTITY_FILTERS]}
            entity={entity}
            onEntityChange={(v) => setEntity(v as AuditEntityFilter)}
            search={search}
            onSearchChange={setSearch}
          />

          <AdminAuditTable
            rows={tableRows}
            selectedId={activeId}
            loading={auditRows === undefined}
            footerLabel={footerLabel}
            emptyTitle="No audit entries"
            emptySubtitle="Sensitive admin actions and webhooks write to the audit log."
            onSelect={(id) => setActiveId(id as Id<'auditLogs'>)}
          />
        </Stack>

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
              <Grid cols={4} gap={3}>
                <Metric label="Wins" value={String(autoGrader.counts.win ?? 0)} />
                <Metric label="Losses" value={String(autoGrader.counts.loss ?? 0)} />
                <Metric label="Pushes" value={String(autoGrader.counts.push ?? 0)} />
                <Metric label="Voids" value={String(autoGrader.counts.void ?? 0)} />
              </Grid>
            ) : (
              <EmptyState icon="audit" title="Loading auto-grader stats…" />
            )}
          </Card>
        </Section>

        {!summary || summary.recentAudit.length === 0 ? null : (
          <Section eyebrow="Snapshot" title="Latest from overview feed.">
            <Card pad="md">
              <EmptyState
                icon="audit"
                title={`${summary.recentAudit.length} recent entries on overview`}
                subtitle="Use the table above for full search and filters."
              />
            </Card>
          </Section>
        )}
      </Stack>

      <AdminAuditDetailDrawer
        open={Boolean(activeId)}
        onClose={() => setActiveId(null)}
        loading={Boolean(activeId) && auditRows === undefined}
        action={active?.action}
        entityType={active?.entityType}
        entityId={active?.entityId}
        actorLabel={active?.actorUserId}
        timeLabel={active ? formatAuditTime(active.createdAt) : undefined}
        metadataJson={metadataJson}
      />
    </Container>
  );
}
