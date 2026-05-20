import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  StudioPageHeader,
  Card,
  CardHead,
  Button,
  InsightCard,
  Icon,
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { ADMIN } from '../lib/adminRoutes';

export function Moderation() {
  const navigate = useNavigate();
  const summary = useQuery(api.admin.moderationSummary, {});

  return (
    <Container size="2xl">
      <Stack gap={5}>
        <StudioPageHeader
          eyebrow="Admin"
          title="Content moderation"
          sub="Unified entry point for events, applications, and pick disputes."
        />
        {summary === undefined ? (
          <EmptyState icon="shield" title="Loading…" />
        ) : (
          <Stack gap={4}>
            <InsightCard
              tone="amber"
              icon={<Icon name="calendar" size={22} />}
              title={`${summary.pendingEvents} events pending review`}
              action={
                <Button variant="primary" size="sm" onClick={() => navigate(ADMIN.eventsReview)}>
                  Review events
                </Button>
              }
            />
            <InsightCard
              tone="blue"
              icon={<Icon name="user" size={22} />}
              title={`${summary.pendingApplications} creator applications`}
              action={
                <Button variant="primary" size="sm" onClick={() => navigate(ADMIN.applications)}>
                  Review applications
                </Button>
              }
            />
            <InsightCard
              tone="blue"
              icon={<Icon name="flag" size={22} />}
              title={`${summary.openDisputes} open pick disputes`}
              action={
                <Button variant="primary" size="sm" onClick={() => navigate(ADMIN.disputes)}>
                  Pick disputes
                </Button>
              }
            />
            <Card pad="md">
              <CardHead
                title="Billing refunds"
                sub="Financial cases are separate from pick disputes."
              />
              <Button variant="secondary" onClick={() => navigate(ADMIN.refunds)}>
                Refunds queue
              </Button>
            </Card>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
