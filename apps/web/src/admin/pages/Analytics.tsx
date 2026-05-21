import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Grid,
  StudioPageHeader,
  AdminMetricStrip,
  StudioChartCard,
  StudioAreaChart,
  InsightCard,
  Icon,
  Button,
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { ADMIN } from '../lib/adminRoutes';

export function Analytics() {
  const navigate = useNavigate();
  const data = useQuery(api.admin.analyticsSummary, {});

  const kpiItems = useMemo(() => {
    if (!data) {
      return [
        { label: 'Total users', value: '—' },
        { label: 'Creators', value: '—' },
        { label: 'Active subs', value: '—' },
        { label: 'New users (7d)', value: '—' },
        { label: 'Failed payments', value: '—' },
      ];
    }
    return [
      {
        label: 'Total users',
        value: data.totalUsers.toLocaleString(),
        delta: { text: `+${data.newUsersWeek} this week`, dir: 'up' as const },
        onClick: () => navigate(ADMIN.users),
      },
      {
        label: 'Creators',
        value: data.totalCreators.toLocaleString(),
        delta: { text: `+${data.newCreatorsWeek} this week`, dir: 'up' as const },
        onClick: () => navigate(ADMIN.creators),
      },
      {
        label: 'Active subs',
        value: data.activeSubscriptions.toLocaleString(),
        onClick: () => navigate(ADMIN.billing),
      },
      {
        label: 'New users (7d)',
        value: String(data.newUsersWeek),
      },
      {
        label: 'Past due',
        value: String(data.failedPayments),
        badge:
          data.failedPayments > 0 ? { text: 'Payment risk', tone: 'urgent' as const } : undefined,
        onClick: () => navigate(`${ADMIN.billing}?payment=1`),
      },
    ];
  }, [data, navigate]);

  return (
    <Container size="2xl">
      <Stack gap={10}>
        <StudioPageHeader
          eyebrow="Operational hub"
          title="Analytics & platform health"
          sub="Operational metrics for the DigiPicks network."
        />

        {data === undefined ? (
          <EmptyState icon="chart" title="Loading analytics…" />
        ) : (
          <>
            <AdminMetricStrip columns={5} items={kpiItems} />

            <Grid cols={3} gap={4}>
              <InsightCard
                tone="amber"
                icon={<Icon name="flag" size={20} />}
                eyebrow="Operations"
                title={`${data.openDisputes} open disputes`}
                sub="Pick grading disputes awaiting review."
                action={
                  <Button variant="outline" size="sm" onClick={() => navigate(ADMIN.disputes)}>
                    Open queue
                  </Button>
                }
              />
              <InsightCard
                tone="blue"
                icon={<Icon name="card" size={20} />}
                eyebrow="Finance"
                title={`${data.openBilling} billing cases`}
                sub="Refunds, chargebacks, and subscription issues."
                action={
                  <Button variant="outline" size="sm" onClick={() => navigate(ADMIN.refunds)}>
                    Open refunds
                  </Button>
                }
              />
              <InsightCard
                tone="blue"
                icon={<Icon name="user" size={20} />}
                eyebrow="Onboarding"
                title={`${data.pendingApplications} applications`}
                sub="Creator applications in the review pipeline."
                action={
                  <Button variant="outline" size="sm" onClick={() => navigate(ADMIN.applications)}>
                    Review applications
                  </Button>
                }
              />
            </Grid>

            <StudioChartCard
              title="Platform activity"
              sub="Trend series ships in v2 — KPIs above reflect live Convex counts."
            >
              <StudioAreaChart />
            </StudioChartCard>
          </>
        )}
      </Stack>
    </Container>
  );
}
