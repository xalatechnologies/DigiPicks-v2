import React from 'react';
import { useQuery } from 'convex/react';
import { Container, Stack, PageHead, Card, KV, EmptyState, Muted } from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

export function SettingsAdmin() {
  const settings = useQuery(api.admin.platformSettingsList, {});

  return (
    <Container size="2xl">
      <Stack gap={5}>
        <PageHead
          eyebrow="Admin"
          title="System settings"
          sub="Platform configuration — env-backed values shown read-only until platformSettings is populated."
        />
        <Card pad="lg">
          <Stack gap={3}>
            <KV k="Stripe" v="Configured via Convex env (STRIPE_SECRET_KEY)" />
            <KV k="Web base URL" v="WEB_BASE_URL" />
            <KV k="Grace period" v="GRACE_PERIOD_DAYS (default 3)" />
            <Muted>Editable platformSettings rows: {settings?.length ?? 0}</Muted>
          </Stack>
        </Card>
        {settings === undefined ? (
          <EmptyState icon="gear" title="Loading…" />
        ) : settings.length === 0 ? (
          <Muted>No custom platform settings stored yet.</Muted>
        ) : null}
      </Stack>
    </Container>
  );
}
