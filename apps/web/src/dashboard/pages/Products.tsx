import React from 'react';
import { useMutation, useQuery } from 'convex/react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Col,
  Button,
  Icon,
  PriceCard,
  PageHead,
  Card,
  CardHead,
  KV,
  Mono,
  Badge,
  TitleSub,
  EmptyState,
  Muted,
} from '@digipicks/ds';
import type { BadgeTone } from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

interface DiscountDef {
  code: string;
  description: string;
  status: 'Live' | 'Paused';
}

const DISCOUNT_TONE: Record<DiscountDef['status'], BadgeTone> = {
  Live: 'green',
  Paused: 'amber',
};

const DISCOUNTS: DiscountDef[] = [
  { code: 'FIRST30', description: '30% off first month · Premium', status: 'Live' },
  { code: 'SLATE7', description: '7-day free trial · VIP', status: 'Paused' },
];

function fmtPrice(cents: number): string {
  if (cents === 0) return '$0';
  return `$${(cents / 100).toFixed(0)}`;
}

export function Products() {
  const me = useQuery(api.users.meSafe);
  const creator = useQuery(
    api.creators.get,
    me?.creatorId ? { id: me.creatorId } : 'skip',
  );
  const tiers = useQuery(
    api.pricingTiers.byCreator,
    me?.creatorId ? { creatorId: me.creatorId } : 'skip',
  );
  const createTier = useMutation(api.pricingTiers.create);
  const archiveTier = useMutation(api.pricingTiers.archive);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleNewTier() {
    if (!me?.creatorId) return;
    const name = window.prompt('Tier name (e.g. "VIP+")?');
    if (!name) return;
    const priceStr = window.prompt('Monthly price in USD (e.g. 99)?', '99');
    const priceUsd = Number(priceStr);
    if (!Number.isFinite(priceUsd) || priceUsd < 0) return;

    setError(null);
    setBusy(true);
    try {
      await createTier({
        creatorId: me.creatorId,
        name,
        priceCents: Math.round(priceUsd * 100),
        interval: 'month',
        perks: ['Custom tier'],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create tier.');
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive(tierId: Id<'pricingTiers'>) {
    if (!window.confirm('Archive this tier? Existing subscribers stay active.')) return;
    setError(null);
    setBusy(true);
    try {
      await archiveTier({ tierId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not archive tier.');
    } finally {
      setBusy(false);
    }
  }

  const tiersList = tiers ?? [];

  return (
    <>
      <PageHeader
        title="Products"
        crumbs={[{ label: 'Studio' }, { label: 'Products' }]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleNewTier}
            disabled={busy || !me?.creatorId}
          >
            <Icon name="plus" size={13} />
            New tier
          </Button>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Studio"
            title="Plans & pricing"
            sub="Free is your funnel. Premium is the workhorse. VIP is your high-conviction lane."
          />

          {error && <Muted>{error}</Muted>}

          {tiers === undefined ? (
            <EmptyState icon="card" title="Loading tiers…" />
          ) : tiersList.length === 0 ? (
            <Card>
              <EmptyState
                icon="card"
                title="No pricing tiers yet."
                subtitle="Tap New tier to create your first offering. Free / Premium / VIP defaults are seeded automatically the first time a subscriber loads your profile."
              />
            </Card>
          ) : (
            <Row gap={4} wrap>
              {tiersList.map((tier) => (
                <Col key={tier._id} gap={0}>
                  <PriceCard
                    name={tier.name}
                    price={fmtPrice(tier.priceCents)}
                    period={tier.interval === 'month' ? 'mo' : tier.interval === 'year' ? 'yr' : 'once'}
                    featured={tier.legacyPlan === 'premium'}
                    features={tier.perks}
                    cta={
                      <Row gap={2}>
                        <Button variant="primary" size="sm" block disabled>
                          Edit (coming soon)
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(tier._id)}
                          disabled={busy}
                        >
                          <Icon name="trash" size={13} />
                        </Button>
                      </Row>
                    }
                  />
                </Col>
              ))}
            </Row>
          )}

          <Row gap={5} wrap>
            <Col gap={4}>
              <Card>
                <CardHead
                  title="Smart pricing recommendation"
                  sub="Based on your win rate, demand, and competitor pricing"
                  action={<Badge tone="gold">Recommended</Badge>}
                />
                <Stack gap={3}>
                  <KV k="Recommended Premium" v={<Mono>$54/mo</Mono>} />
                  <KV k="Estimated MRR lift" v={<Mono>+$1,840/mo</Mono>} />
                  <KV k="Expected churn impact" v={<Mono>+0.6 pts</Mono>} />
                  <Row gap={2}>
                    <Button variant="primary" size="sm">
                      Apply pricing
                    </Button>
                    <Button variant="ghost" size="sm">
                      Run another model
                    </Button>
                  </Row>
                </Stack>
              </Card>
            </Col>

            <Col gap={4}>
              <Card>
                <CardHead title="Active discounts" sub="Promotions running on your products" />
                <Stack gap={2}>
                  {DISCOUNTS.map((d) => (
                    <Row key={d.code} gap={3} between>
                      <TitleSub title={d.code} sub={d.description} />
                      <Badge tone={DISCOUNT_TONE[d.status]} dot>
                        {d.status}
                      </Badge>
                    </Row>
                  ))}
                </Stack>
              </Card>

              <Card>
                <CardHead title="Tax & invoicing" sub="Set once, applies to every payout" />
                <Stack gap={2}>
                  <KV k="Business name" v="CourtVision Media LLC" />
                  <KV k="Tax ID" v={<Mono>EIN ••••3492</Mono>} />
                  <KV k="Default currency" v="USD" />
                </Stack>
              </Card>
            </Col>
          </Row>
        </Stack>
      </Container>
    </>
  );
}
