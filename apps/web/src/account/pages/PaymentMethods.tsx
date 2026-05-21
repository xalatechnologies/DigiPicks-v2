import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Stack,
  Card,
  CardHead,
  Muted,
  StudioPageHeader,
  AccountBillingPanel,
} from '@digipicks/ds';
import { useStripePortal } from '../../lib/useStripePortal';

export function PaymentMethods() {
  const navigate = useNavigate();
  const { openPortal } = useStripePortal();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManage() {
    setBusy(true);
    setError(null);
    try {
      await openPortal('/account/payment-methods');
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
          title="Payment methods"
          sub="Update cards and your default payment method via Stripe's secure portal."
        />
        <Card pad="lg" elev>
          <CardHead title="Saved payment methods" sub="Stripe Customer Portal" />
          <Stack gap={3}>
            <AccountBillingPanel
              paymentBrand="Stripe"
              paymentLabel="Payment methods"
              paymentSub="Open the secure portal to add or update cards."
              onUpdatePayment={busy ? undefined : handleManage}
            />
            {error ? <Muted>{error}</Muted> : null}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
