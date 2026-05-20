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
  AccountBillingPanel,
  EmptyState,
  QuickActionGrid,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { useStripePortal } from '../../lib/useStripePortal';
import { accountCrossLinks } from '../../lib/accountCrossLinks';

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BillingHistory() {
  const navigate = useNavigate();
  const subs = useQuery(api.subscriptions.mySubscriptions);
  const { openPortal } = useStripePortal();
  const [busy, setBusy] = useState(false);

  const history =
    subs?.map((s) => ({
      id: s._id,
      dateLabel: fmtDate(s.startedAt),
      detail: `${s.creatorName} · ${s.plan}`,
      amount: s.creatorStartingPrice > 0 ? `$${s.creatorStartingPrice}/mo` : 'Free',
    })) ?? [];

  async function handlePortal() {
    setBusy(true);
    try {
      await openPortal('/account/billing-history');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Account · Billing"
          title="Billing history"
          sub="Subscription start dates on file. Full invoices are available in Stripe."
        />
        {subs === undefined ? (
          <EmptyState icon="clock" title="Loading history…" />
        ) : (
          <Card pad="lg" elev>
            <CardHead
              title="Recent activity"
              action={
                <Button variant="secondary" size="sm" onClick={handlePortal} disabled={busy}>
                  {busy ? 'Opening…' : 'Stripe invoices'}
                </Button>
              }
            />
            <AccountBillingPanel history={history} onViewAllHistory={handlePortal} />
            {history.length === 0 ? <Muted>No subscriptions yet.</Muted> : null}
          </Card>
        )}
        <QuickActionGrid title="Related" items={accountCrossLinks('billingHistory', navigate)} />
      </Stack>
    </Container>
  );
}
