import React from 'react';
import { useQuery } from 'convex/react';
import { Container, Stack, PageHead, Card, EmptyState, Muted } from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

export function Campaigns() {
  const campaigns = useQuery(api.admin.campaignsList, {});

  return (
    <Container size="2xl">
      <Stack gap={5}>
        <PageHead
          eyebrow="Admin"
          title="Notifications & campaigns"
          sub="Broadcast email, push, and in-app campaigns."
        />
        <Card pad="lg">
          {campaigns === undefined ? (
            <EmptyState icon="megaphone" title="Loading…" />
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon="megaphone"
              title="No campaigns yet"
              subtitle="Campaign composer ships in a follow-up — schema is ready."
            />
          ) : (
            <Muted>{campaigns.length} campaign(s) on file.</Muted>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
