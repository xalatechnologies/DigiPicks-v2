import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  StudioPageHeader,
  Card,
  CardHead,
  Button,
  Muted,
  ProcessSteps,
  InsightCard,
  Icon,
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { STUDIO } from '../../lib/studioRoutes';
import { useStudioContext } from '../useStudioContext';

const STEPS = [
  { title: 'Start', body: 'Creator account approved' },
  { title: 'Verify identity', body: 'Stripe Connect KYC' },
  { title: 'Connect payout', body: 'Link bank account' },
  { title: 'Ready', body: 'Receive monthly payouts' },
];

export function PayoutOnboarding() {
  const navigate = useNavigate();
  const ctx = useStudioContext();
  const status = useQuery(
    api.connect.statusByCreator,
    ctx.creatorId ? { creatorId: ctx.creatorId } : 'skip',
  );
  const createLink = useAction(api.connect.createOnboardingLink);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleConnect() {
    if (!ctx.creatorId) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await createLink({ creatorId: ctx.creatorId });
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Connect onboarding.');
    } finally {
      setBusy(false);
    }
  }

  if (!ctx.creatorId && !ctx.devPreview) {
    return (
      <Container size="2xl">
        <EmptyState icon="dollar" title="Creator account required" />
      </Container>
    );
  }

  const connectStatus = status?.connectStatus ?? 'not_started';

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Payouts"
          title="Payout onboarding"
          sub="Complete Stripe Connect to receive earnings from your subscribers."
        />
        <ProcessSteps title="Progress" steps={STEPS} />
        <Card pad="lg" elev>
          <CardHead
            title="Verify your identity"
            sub="Federal regulations require identity verification before payouts."
          />
          <Stack gap={3}>
            <Muted>Status: {connectStatus}</Muted>
            {error ? <Muted>{error}</Muted> : null}
            <Button variant="primary" disabled={busy || !ctx.creatorId} onClick={handleConnect}>
              {busy ? 'Redirecting…' : 'Connect payout account'}
            </Button>
            <Button variant="ghost" onClick={() => navigate(STUDIO.payouts)}>
              Back to earnings
            </Button>
          </Stack>
        </Card>
        {connectStatus === 'restricted' ? (
          <InsightCard
            tone="amber"
            icon={<Icon name="shield" size={22} />}
            title="Verification needs attention"
            sub="Retry documentation upload in Stripe if your last attempt failed."
            action={
              <Button variant="secondary" size="sm" onClick={handleConnect}>
                Retry in Stripe
              </Button>
            }
          />
        ) : null}
      </Stack>
    </Container>
  );
}
