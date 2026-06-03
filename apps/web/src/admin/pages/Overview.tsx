import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Button,
  Icon,
  InsightCard,
  StudioAreaChart,
  StudioChartCard,
  StudioDashLayout,
  StudioDashCol,
  ActivityFeed,
  StudioPageHeader,
  AdminActionPanel,
  AdminMetricStrip,
  AdminCriticalAlertsPanel,
  AdminHealthBanner,
  EmptyState,
  Muted,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import {
  buildAdminActivityItems,
  buildAdminCriticalAlerts,
  buildAdminKpiStrip,
  buildAdminQuickActions,
  type OverviewKpis,
} from '../lib/adminMetrics';
import { ADMIN_OVERVIEW_PREVIEW } from '../lib/adminOverviewPreview';
import { useAdminSession } from '../lib/useAdminSession';
import { DEV_ADMIN_LOCAL } from '../../lib/devAdminDefaults';
import { clearDevAdminPreview, hasDevAdminPreview } from '../../lib/devAdminPreview';

const PERIOD_OPTIONS = [
  { label: 'Weekly', value: '7d' },
  { label: 'Monthly', value: '30d' },
];

const CHART_FOOTER_LABELS = ['Day 1', 'Day 10', 'Day 20', 'Today'] as const;

type OverviewPayload = {
  kpis: OverviewKpis;
  capped: { users: boolean; subscriptions: boolean; creators: boolean };
  recentActivity: Parameters<typeof buildAdminActivityItems>[0];
  alerts: Parameters<typeof buildAdminCriticalAlerts>[0];
};

function OverviewContent({
  overview,
  revenuePeriod,
  onRevenuePeriodChange,
  navigate,
}: {
  overview: OverviewPayload;
  revenuePeriod: string;
  onRevenuePeriodChange: (value: string) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const kpiItems = useMemo(
    () => buildAdminKpiStrip(overview.kpis, overview.capped, navigate),
    [overview, navigate],
  );

  const activityItems = useMemo(
    () => buildAdminActivityItems(overview.recentActivity, navigate),
    [overview, navigate],
  );

  const criticalAlerts = useMemo(
    () => buildAdminCriticalAlerts(overview.alerts, navigate),
    [overview, navigate],
  );

  const quickActions = useMemo(() => buildAdminQuickActions(navigate), [navigate]);

  return (
    <Stack gap={8}>
      <AdminMetricStrip items={kpiItems} />

      <StudioDashLayout>
        <StudioDashCol span={8}>
          <Stack gap={8}>
            <StudioChartCard
              title="Revenue growth"
              sub="Trailing 30-day performance overview"
              tone="elevated"
              periodOptions={PERIOD_OPTIONS}
              period={revenuePeriod}
              onPeriodChange={onRevenuePeriodChange}
              footer={
                <Row between>
                  {CHART_FOOTER_LABELS.map((label) => (
                    <Muted key={label}>{label}</Muted>
                  ))}
                </Row>
              }
            >
              <StudioAreaChart highlightLabel="Today" highlightValue="—" />
            </StudioChartCard>

            <ActivityFeed
              variant="editorial"
              title="System activity logs"
              actionLabel="Audit logs"
              onAction={() => navigate('/admin/audit')}
              items={activityItems}
            />
          </Stack>
        </StudioDashCol>

        <StudioDashCol span={4}>
          <Stack gap={8}>
            <AdminCriticalAlertsPanel items={criticalAlerts} />
            <AdminActionPanel title="Administrative actions" items={quickActions} />
            <AdminHealthBanner sub="Platform monitoring active — connect analytics for live uptime." />
          </Stack>
        </StudioDashCol>
      </StudioDashLayout>
    </Stack>
  );
}

export function AdminOverview() {
  const navigate = useNavigate();
  const [revenuePeriod, setRevenuePeriod] = useState('7d');
  const { me, isAdmin, profileReady } = useAdminSession();
  const claimDevAdminSession = useMutation(api.devProvision.claimDevAdminSession);
  const preview = DEV_ADMIN_LOCAL && hasDevAdminPreview();

  const overview = useQuery(api.admin.overview, isAdmin && !preview ? {} : 'skip');

  const pageHeader = (
    <StudioPageHeader eyebrow="Operational hub" title="Dashboard overview" actions={undefined} />
  );

  if (preview) {
    return (
      <Container size="2xl">
        <Stack gap={8}>
          {pageHeader}
          <InsightCard
            tone="blue"
            icon={<Icon name="shield" size={20} />}
            title="Preview mode"
            sub="Exit preview to load real data: clear session storage or sign in at /admin."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  clearDevAdminPreview();
                  window.location.reload();
                }}
              >
                Exit preview
              </Button>
            }
          />
          <OverviewContent
            overview={ADMIN_OVERVIEW_PREVIEW}
            revenuePeriod={revenuePeriod}
            onRevenuePeriodChange={setRevenuePeriod}
            navigate={navigate}
          />
        </Stack>
      </Container>
    );
  }

  if (!profileReady) {
    return (
      <Container size="2xl">
        <EmptyState icon="chart" title="Loading profile…" subtitle="Checking your platform role." />
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container size="2xl">
        <Stack gap={4}>
          <EmptyState
            icon="shield"
            title="Admin role required"
            subtitle={`Signed in as ${me?.email ?? 'unknown'} with role “${me?.role ?? 'none'}”. Grant admin on this deployment, then reload.`}
          />
          {DEV_ADMIN_LOCAL ? (
            <Row gap={2}>
              <Button
                variant="primary"
                onClick={() => {
                  void claimDevAdminSession({}).then(() => window.location.reload());
                }}
              >
                Grant admin role
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth?next=%2Fadmin')}>
                Sign in again
              </Button>
            </Row>
          ) : null}
          {import.meta.env.DEV ? (
            <Muted>
              Debug: run `npx convex run devProvisionActions:bootstrapDevAdmin` then reload /admin.
            </Muted>
          ) : null}
        </Stack>
      </Container>
    );
  }

  if (overview === null) {
    return (
      <Container size="2xl">
        <Stack gap={4}>
          <EmptyState
            icon="shield"
            title="Server did not recognize admin access"
            subtitle="Your browser session and Convex user row may be out of sync. Grant admin again or sign out and reopen /admin."
          />
          <Row gap={2}>
            <Button
              variant="primary"
              onClick={() => {
                void claimDevAdminSession({}).then(() => window.location.reload());
              }}
            >
              Grant admin role
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </Row>
        </Stack>
      </Container>
    );
  }

  if (overview === undefined) {
    return (
      <Container size="2xl">
        <EmptyState icon="chart" title="Loading platform overview…" />
      </Container>
    );
  }

  return (
    <Container size="2xl">
      <Stack gap={8}>
        {pageHeader}
        <OverviewContent
          overview={overview}
          revenuePeriod={revenuePeriod}
          onRevenuePeriodChange={setRevenuePeriod}
          navigate={navigate}
        />
      </Stack>
    </Container>
  );
}
