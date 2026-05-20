import React from 'react';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  StudioPageHeader,
  StudioSummaryGrid,
  StudioChartCard,
  StudioAreaChart,
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

export function Analytics() {
  const data = useQuery(api.admin.analyticsSummary, {});

  return (
    <Container size="2xl">
      <Stack gap={5}>
        <StudioPageHeader
          eyebrow="Admin"
          title="Analytics & platform health"
          sub="Operational metrics for the EdgePicks network."
        />
        {data === undefined ? (
          <EmptyState icon="chart" title="Loading…" />
        ) : (
          <>
            <StudioSummaryGrid
              items={[
                { id: 'u', icon: 'users', label: 'Users', value: String(data.totalUsers) },
                { id: 'c', icon: 'verified', label: 'Creators', value: String(data.totalCreators) },
                {
                  id: 's',
                  icon: 'card',
                  label: 'Active subscriptions',
                  value: String(data.activeSubscriptions),
                },
              ]}
            />
            <StudioChartCard
              title="Platform activity"
              sub="Placeholder trend — wire time-series in v2."
            >
              <StudioAreaChart />
            </StudioChartCard>
          </>
        )}
      </Stack>
    </Container>
  );
}
