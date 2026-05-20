import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAction, useQuery } from 'convex/react';
import { useConvexAuth } from '@convex-dev/auth/react';
import {
  Container,
  Stack,
  Card,
  CardHead,
  Button,
  Field,
  Input,
  Muted,
  EmptyState,
  PageHead,
  Row,
  type PricingPlan,
} from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';

export function CreatorCheckout() {
  const { id: handle } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();
  const plan = (search.get('plan') ?? 'premium') as PricingPlan;
  const cancelled = search.get('cancelled') === '1';

  const creator = useQuery(api.creators.getByHandle, handle ? { handle } : 'skip');
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const [coupon, setCoupon] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated && handle) {
      navigate(`/auth?next=/creators/${handle}/checkout?plan=${plan}`);
    }
  }, [isAuthenticated, handle, navigate, plan]);

  if (!handle || creator === null) {
    return (
      <main>
        <Container size="md">
          <EmptyState icon="search" title="Creator not found" />
        </Container>
      </main>
    );
  }

  if (!creator) {
    return (
      <main>
        <Container size="md">
          <EmptyState icon="lock" title="Loading checkout…" />
        </Container>
      </main>
    );
  }

  const price =
    plan === 'vip' ? creator.startingPrice + 40 : plan === 'premium' ? creator.startingPrice : 0;

  async function handlePay() {
    if (plan === 'free') return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await createCheckout({
        creatorId: creator!._id,
        plan,
        couponCode: coupon.trim() || undefined,
      });
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <Container size="md">
        <Stack gap={5}>
          <PageHead
            eyebrow="Checkout"
            title="Complete your subscription"
            sub={`Subscribe to ${creator.name} on EdgePicks. Payment is processed securely by Stripe.`}
          />
          {cancelled ? (
            <Card pad="md">
              <Muted>Checkout was cancelled. You can try again when ready.</Muted>
            </Card>
          ) : null}
          <Card pad="lg" elev>
            <CardHead title={creator.name} sub={`@${creator.handle} · ${plan} plan`} />
            <Stack gap={4}>
              <Row gap={4}>
                <Muted>Monthly</Muted>
                <strong>${price}/mo</strong>
              </Row>
              <Field label="Coupon code" help="Optional — applied at Stripe checkout.">
                <Input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="SAVE20"
                />
              </Field>
              {error ? <Muted>{error}</Muted> : null}
              <Button variant="primary" onClick={handlePay} disabled={busy || plan === 'free'}>
                {busy ? 'Redirecting…' : 'Continue to Stripe'}
              </Button>
              <Button variant="ghost" onClick={() => navigate(`/creators/${creator.handle}`)}>
                Back to profile
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </main>
  );
}
