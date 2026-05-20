import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Button,
  Icon,
  InsightCard,
  StudioSummaryGrid,
  StudioChartCard,
  StudioAreaChart,
  StudioDashLayout,
  StudioDashCol,
  ActivityFeed,
  StudioPageHeader,
  AdminActionPanel,
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import {
  buildAdminActivityItems,
  buildAdminAlerts,
  buildAdminKpiRows,
  buildAdminQuickActions,
} from '../lib/adminMetrics';

const PERIOD_OPTIONS = [
  { label: 'Weekly', value: '7d' },
  { label: 'Monthly', value: '30d' },
];

export function AdminOverview() {
  const navigate = useNavigate();
  const [revenuePeriod, setRevenuePeriod] = useState('7d');
  const overview = useQuery(api.admin.overview, {});

  const kpiRowA = useMemo(() => {
    if (!overview) return [];
    const all = buildAdminKpiRows(overview.kpis, overview.capped, navigate);
    return all.slice(0, 4);
  }, [overview, navigate]);

  const kpiRowB = useMemo(() => {
    if (!overview) return [];
    const all = buildAdminKpiRows(overview.kpis, overview.capped, navigate);
    return all.slice(4, 8);
  }, [overview, navigate]);

  const activityItems = useMemo(
    () => (overview ? buildAdminActivityItems(overview.recentActivity, navigate) : []),
    [overview, navigate],
  );

  const alerts = useMemo(
    () => (overview ? buildAdminAlerts(overview.alerts, navigate) : []),
    [overview, navigate],
  );

  const quickActions = useMemo(() => buildAdminQuickActions(navigate), [navigate]);

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Admin · Overview"
          title="Dashboard overview"
          sub="Monitoring platform health and creator performance in real time."
          actions={
            <Button
              variant="primary"
              iconLeft="arrow-right"
              disabled
              title="Export reports will ship in a later release."
            >
              Export report
            </Button>
          }
        />

        {overview === undefined ? (
          <EmptyState icon="chart" title="Loading platform overview…" />
        ) : (
          <>
            <StudioSummaryGrid columns={4} items={kpiRowA} />
            <StudioSummaryGrid columns={4} items={kpiRowB} />

            <StudioDashLayout>
              <StudioDashCol span={8}>
                <StudioChartCard
                  title="Revenue growth"
                  sub="Trailing 30-day performance overview"
                  periodOptions={PERIOD_OPTIONS}
                  period={revenuePeriod}
                  onPeriodChange={setRevenuePeriod}
                  footer={
                    <Row between>
                      {['Day 1', 'Day 10', 'Day 20', 'Today'].map((d) => (
                        <span key={d}>{d}</span>
                      ))}
                    </Row>
                  }
                >
                  <StudioAreaChart highlightLabel="Today" highlightValue="—" />
                </StudioChartCard>
              </StudioDashCol>

              <StudioDashCol span={4}>
                <Stack gap={4}>
                  {alerts.length === 0 ? (
                    <InsightCard
                      tone="green"
                      icon={<Icon name="check" size={20} />}
                      title="No critical alerts"
                      sub="Queues are within normal operating thresholds."
                    />
                  ) : (
                    alerts.map((alert) => (
                      <InsightCard
                        key={alert.id}
                        tone={alert.tone}
                        icon={<Icon name="flag" size={20} />}
                        title={alert.title}
                        sub={alert.sub}
                        action={
                          alert.onOpen ? (
                            <Button variant="secondary" size="sm" onClick={alert.onOpen}>
                              Open
                            </Button>
                          ) : undefined
                        }
                      />
                    ))
                  )}
                </Stack>
              </StudioDashCol>

              <StudioDashCol span={7}>
                <ActivityFeed
                  title="System activity logs"
                  actionLabel="Audit logs"
                  onAction={() => navigate('/admin/audit')}
                  items={activityItems}
                />
              </StudioDashCol>

              <StudioDashCol span={5}>
                <AdminActionPanel title="Administrative actions" items={quickActions} />
              </StudioDashCol>
            </StudioDashLayout>
          </>
        )}
      </Stack>
    </Container>
  );
}
