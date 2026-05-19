import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Grid,
  Heading,
  Eyebrow,
  Muted,
  Button,
  EmptyState,
  Card,
  StudioSummaryGrid,
  StudioTierCard,
  StudioFeatureCompare,
  StudioPlanConfigurator,
  QuickActionGrid,
  type StudioTierFeature,
  type StudioTierVariant,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { hasDevStudioPreview } from '../../lib/devDemoLogin';
import { studioCrossLinks } from '../../lib/studioCrossLinks';
import { STUDIO } from '../../lib/studioRoutes';

const COMPARE_ROWS = [
  { id: 'articles', label: 'Public Analysis Articles', free: true, premium: true, vip: true },
  { id: 'props', label: 'Daily NBA Props', free: false, premium: true, vip: true },
  { id: 'discord', label: 'Exclusive Discord Channels', free: false, premium: true, vip: true },
  { id: 'support', label: 'Priority Support', free: false, premium: false, vip: true },
  { id: 'bankroll', label: 'Bankroll Management Suite', free: false, premium: false, vip: true },
];

const DEMO_TIERS = [
  {
    id: 'demo-free',
    variant: 'starter' as StudioTierVariant,
    tierLabel: 'Starter Tier',
    name: 'Free',
    price: '$0',
    features: [
      { text: 'Public Analysis', included: true },
      { text: 'Weekly Newsletters', included: true },
      { text: 'Daily NBA Props', included: false },
    ],
    activeSubs: 88,
    popular: false,
    legacyPlan: 'free' as const,
  },
  {
    id: 'demo-premium',
    variant: 'advanced' as StudioTierVariant,
    tierLabel: 'Advanced Tier',
    name: 'Premium',
    price: '$29.99',
    features: [
      { text: 'Daily NBA Props', included: true },
      { text: 'Locked Deep Analysis', included: true },
      { text: 'Discord Early Access', included: true },
    ],
    activeSubs: 212,
    popular: true,
    legacyPlan: 'premium' as const,
  },
  {
    id: 'demo-vip',
    variant: 'elite' as StudioTierVariant,
    tierLabel: 'Elite Tier',
    name: 'VIP Elite',
    price: '$99.00',
    features: [
      { text: '1-on-1 Strategy Calls', included: true },
      { text: 'Real-time Bet Alerts', included: true },
      { text: 'Everything in Premium', included: true },
    ],
    activeSubs: 38,
    popular: false,
    legacyPlan: 'vip' as const,
  },
];

const TIER_LABEL: Record<string, string> = {
  free: 'Starter Tier',
  premium: 'Advanced Tier',
  vip: 'Elite Tier',
};

const TIER_VARIANT: Record<string, StudioTierVariant> = {
  free: 'starter',
  premium: 'advanced',
  vip: 'elite',
};

function fmtPrice(cents: number): string {
  if (cents === 0) return '$0';
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;
}

function perksToFeatures(perks: string[]): StudioTierFeature[] {
  return perks.map((text) => ({ text, included: true }));
}

export function Products() {
  const navigate = useNavigate();
  const devPreview = hasDevStudioPreview();
  const me = useQuery(api.users.meSafe);
  const creator = useQuery(api.creators.get, me?.creatorId ? { id: me.creatorId } : 'skip');
  const tiers = useQuery(
    api.pricingTiers.byCreator,
    creator?._id ? { creatorId: creator._id } : 'skip',
  );
  const subs = useQuery(
    api.subscriptions.byCreator,
    creator?._id ? { creatorId: creator._id, limit: 500 } : 'skip',
  );

  const createTier = useMutation(api.pricingTiers.create);
  const archiveTier = useMutation(api.pricingTiers.archive);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [price, setPrice] = useState('');
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [features, setFeatures] = useState(['Daily NBA Props', 'Access to Private Discord']);
  const [selectedAccess, setSelectedAccess] = useState<string[]>(['props', 'discord']);

  const subsByPlan = useMemo(() => {
    const counts = { free: 0, premium: 0, vip: 0 };
    for (const s of subs ?? []) {
      if (s.status !== 'active') continue;
      const p = s.plan as keyof typeof counts;
      if (p in counts) counts[p] += 1;
    }
    return counts;
  }, [subs]);

  const tierCards = useMemo(() => {
    if (tiers && tiers.length > 0) {
      return tiers.map((tier) => {
        const legacy = tier.legacyPlan ?? 'premium';
        const variant = TIER_VARIANT[legacy] ?? 'advanced';
        const activeSubs = subsByPlan[legacy as keyof typeof subsByPlan] ?? 0;
        return {
          id: tier._id,
          tierId: tier._id as Id<'pricingTiers'>,
          variant,
          tierLabel: TIER_LABEL[legacy] ?? 'Custom Tier',
          name: tier.name,
          price: fmtPrice(tier.priceCents),
          features: perksToFeatures(tier.perks),
          activeSubs:
            activeSubs ||
            (devPreview ? DEMO_TIERS.find((d) => d.legacyPlan === legacy)?.activeSubs : 0),
          popular: legacy === 'premium',
        };
      });
    }
    if (devPreview) {
      return DEMO_TIERS.map((d) => ({ ...d, tierId: undefined as Id<'pricingTiers'> | undefined }));
    }
    return [];
  }, [tiers, subsByPlan, devPreview]);

  const monthlyRevenue = useMemo(() => {
    if (devPreview) return '$14,240.50';
    if (!subs?.length) return '—';
    let cents = 0;
    for (const s of subs) {
      if (s.status !== 'active') continue;
      const tier = tiers?.find((t) => t.legacyPlan === s.plan);
      if (tier) cents += tier.priceCents;
    }
    if (cents === 0) return '—';
    return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [subs, tiers, devPreview]);

  const arpu = useMemo(() => {
    if (devPreview) return '$42.18';
    const active = subs?.filter((s) => s.status === 'active').length ?? 0;
    if (!active || !subs) return '—';
    let cents = 0;
    for (const s of subs) {
      if (s.status !== 'active') continue;
      const tier = tiers?.find((t) => t.legacyPlan === s.plan);
      if (tier) cents += tier.priceCents;
    }
    return `$${(cents / active / 100).toFixed(2)}`;
  }, [subs, tiers, devPreview]);

  const activeSubsTotal = useMemo(() => {
    if (devPreview) return 338;
    return subs?.filter((s) => s.status === 'active').length ?? 0;
  }, [subs, devPreview]);

  const loading = tiers === undefined && !devPreview && Boolean(creator?._id);

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

  function resetForm() {
    setPlanName('');
    setPrice('');
    setInterval('month');
    setFeatures(['Daily NBA Props', 'Access to Private Discord']);
    setSelectedAccess(['props', 'discord']);
  }

  async function handleSavePlan() {
    if (!me?.creatorId) return;
    const name = planName.trim();
    const priceUsd = Number(price);
    if (!name) {
      setError('Plan name is required.');
      return;
    }
    if (!Number.isFinite(priceUsd) || priceUsd < 0) {
      setError('Enter a valid monthly price.');
      return;
    }
    const perks = features.map((f) => f.trim()).filter(Boolean);
    if (perks.length === 0) {
      setError('Add at least one plan feature.');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await createTier({
        creatorId: me.creatorId,
        name,
        priceCents: Math.round(priceUsd * 100),
        interval,
        perks,
      });
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create tier.');
    } finally {
      setBusy(false);
    }
  }

  function toggleAccess(id: string) {
    setSelectedAccess((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <Container size="2xl">
      <Stack gap={8}>
        <Row between wrap>
          <Stack gap={2}>
            <Eyebrow>Studio · Products</Eyebrow>
            <Heading level={1} size="2xl">
              Products &amp; Pricing
            </Heading>
            <Muted>Manage your subscription tiers and content accessibility rules.</Muted>
          </Stack>
          <Row gap={2} wrap>
            <Button variant="outline" size="sm" iconLeft="sliders">
              Pricing Strategy
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft="plus"
              disabled={busy || !me?.creatorId}
              onClick={() => {
                const el = document.getElementById('studio-plan-config');
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              New tier
            </Button>
          </Row>
        </Row>

        {error ? <Muted>{error}</Muted> : null}

        <StudioSummaryGrid
          items={[
            {
              id: 'mrr',
              icon: 'card',
              iconTone: 'primary',
              label: 'Monthly Revenue',
              value: monthlyRevenue,
              delta: devPreview ? { value: '+12.5%', dir: 'up' } : undefined,
            },
            {
              id: 'arpu',
              icon: 'chart',
              iconTone: 'violet',
              label: 'Avg. Revenue / User',
              value: arpu,
            },
            {
              id: 'subs',
              icon: 'users',
              iconTone: 'amber',
              label: 'Active Subscriptions',
              value: activeSubsTotal.toLocaleString(),
            },
          ]}
        />

        {loading ? (
          <Card pad="lg" elev>
            <EmptyState icon="card" title="Loading tiers…" />
          </Card>
        ) : tierCards.length === 0 ? (
          <Card pad="lg" elev>
            <EmptyState
              icon="card"
              title="No pricing tiers yet"
              subtitle="Use Configure New Plan below or New tier to create your first offering."
            />
          </Card>
        ) : (
          <Grid cols={3} gap={8} stagger={false}>
            {tierCards.map((tier) => (
              <StudioTierCard
                key={tier.id}
                variant={tier.variant}
                tierLabel={tier.tierLabel}
                name={tier.name}
                price={tier.price}
                features={tier.features}
                activeSubs={tier.activeSubs}
                popular={tier.popular}
                onDelete={tier.tierId ? () => handleArchive(tier.tierId!) : undefined}
              />
            ))}
          </Grid>
        )}

        <StudioFeatureCompare rows={COMPARE_ROWS} />

        <div id="studio-plan-config">
          <StudioPlanConfigurator
            planName={planName}
            price={price}
            interval={interval}
            features={features}
            selectedAccess={selectedAccess}
            busy={busy}
            onPlanNameChange={setPlanName}
            onPriceChange={setPrice}
            onIntervalChange={setInterval}
            onFeatureChange={(i, v) => setFeatures((prev) => prev.map((f, j) => (j === i ? v : f)))}
            onAddFeature={() => setFeatures((prev) => [...prev, ''])}
            onRemoveFeature={(i) => setFeatures((prev) => prev.filter((_, j) => j !== i))}
            onToggleAccess={toggleAccess}
            onDiscard={resetForm}
            onSave={handleSavePlan}
          />
        </div>

        <QuickActionGrid title="Related" items={studioCrossLinks('products', navigate)} />
      </Stack>
    </Container>
  );
}
