import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Card,
  CardHead,
  Button,
  Muted,
  StudioPageHeader,
  InsightCard,
  Icon,
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { useStripePortal } from '../../lib/useStripePortal';

export function PaymentIssue() {
  const navigate = useNavigate();
  const subs = useQuery(api.subscriptions.mySubscriptions);
  const { openPortal } = useStripePortal();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pastDue = subs?.filter((s) => s.status === 'past_due') ?? [];

  async function handleUpdate() {
    setBusy(true);
    setError(null);
    try {
      await openPortal('/account/billing/payment-issue');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing portal.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Account · Billing"
          title="Payment issue"
          sub="Update your payment method to restore premium access during the grace period."
        />
        {subs === undefined ? (
          <EmptyState icon="clock" title="Loading…" />
        ) : pastDue.length === 0 ? (
          <Card pad="lg">
            <Muted>No past-due subscriptions. You're all set.</Muted>
            <Button variant="secondary" onClick={() => navigate('/account/subscriptions')}>
              View subscriptions
            </Button>
          </Card>
        ) : (
          pastDue.map((s) => (
            <InsightCard
              key={s._id}
              tone="amber"
              icon={<Icon name="shield" size={22} />}
              title={`Payment failed — ${s.creatorName}`}
              sub="Your card could not be charged. Update payment within the grace period to keep access."
              action={
                <Button variant="primary" size="sm" onClick={handleUpdate} disabled={busy}>
                  {busy ? 'Opening…' : 'Update payment now'}
                </Button>
              }
            />
          ))
        )}
        {error ? <Muted>{error}</Muted> : null}
        <Card pad="md">
          <CardHead title="Need help?" sub="Contact support if charges look incorrect." />
          <Button variant="ghost" onClick={() => navigate('/contact')}>
            Contact support
          </Button>
        </Card>
      </Stack>
    </Container>
  );
}
