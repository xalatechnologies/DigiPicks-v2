import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import {
  Container,
  Stack,
  Grid,
  StudioPageHeader,
  Muted,
  Button,
  EmptyState,
  Card,
  StudioSummaryGrid,
  StudioSubNav,
  StudioFilterBar,
  StudioMetaChip,
  StudioTierCard,
  StudioFeatureCompare,
  StudioPlanConfigurator,
  QuickActionGrid,
  type StudioTierFeature,
  type StudioTierVariant,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { useStudioContext } from '../useStudioContext';
import { studioCrossLinks } from '../../lib/studioCrossLinks';
import { STUDIO } from '../../lib/studioRoutes';

const COMPARE_ROWS = [
  { id: 'articles', label: 'Public Analysis Articles', free: true, premium: true, vip: true },
  { id: 'props', label: 'Daily NBA Props', free: false, premium: true, vip: true },
  { id: 'discord', label: 'Exclusive Discord Channels', free: false, premium: true, vip: true },
  { id: 'support', label: 'Priority Support', free: false, premium: false, vip: true },
  { id: 'bankroll', label: 'Bankroll Management Suite', free: false, premium: false, vip: true },
];

const TIER_FILTERS = [
  { label: 'All tiers', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Premium', value: 'premium' },
  { label: 'VIP', value: 'vip' },
];

const VIEW_TABS = [
  { label: 'Pricing tiers', value: 'tiers' },
  { label: 'Feature matrix', value: 'compare' },
  { label: 'Configure plan', value: 'configure' },
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

type TierCardModel = {
  id: string;
  tierId?: Id<'pricingTiers'>;
  variant: StudioTierVariant;
  tierLabel: string;
  name: string;
  price: string;
  features: StudioTierFeature[];
  activeSubs: number;
  popular: boolean;
  legacyPlan: string;
};

export function Products() {
  const navigate = useNavigate();
  const ctx = useStudioContext();
  const tiers = ctx.tiers;

  const createTier = useMutation(api.pricingTiers.create);
  const archiveTier = useMutation(api.pricingTiers.archive);

  const [view, setView] = useState('tiers');
  const [tierFilter, setTierFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [price, setPrice] = useState('');
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [features, setFeatures] = useState(['Daily NBA Props', 'Access to Private Discord']);
  const [selectedAccess, setSelectedAccess] = useState<string[]>(['props', 'discord']);

  const subsByPlan = useMemo(() => {
    const counts = { free: 0, premium: 0, vip: 0 };
    for (const s of ctx.subs) {
      if (s.status !== 'active') continue;
      const p = s.plan as keyof typeof counts;
      if (p in counts) counts[p] += 1;
    }
    return counts;
  }, [ctx.subs]);

  const allTierCards = useMemo((): TierCardModel[] => {
    if (tiers.length > 0) {
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
            (ctx.devPreview
              ? (DEMO_TIERS.find((d) => d.legacyPlan === legacy)?.activeSubs ?? 0)
              : 0),
          popular: legacy === 'premium',
          legacyPlan: legacy,
        };
      });
    }
    if (ctx.devPreview) {
      return DEMO_TIERS.map((d) => ({ ...d, tierId: undefined }));
    }
    return [];
  }, [tiers, subsByPlan, ctx.devPreview]);

  const tierCards = useMemo(() => {
    return allTierCards.filter((tier) => {
      if (tierFilter !== 'all' && tier.legacyPlan !== tierFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        tier.name.toLowerCase().includes(q) ||
        tier.tierLabel.toLowerCase().includes(q) ||
        tier.legacyPlan.toLowerCase().includes(q)
      );
    });
  }, [allTierCards, tierFilter, search]);

  const monthlyRevenue = useMemo(() => {
    if (ctx.devPreview && ctx.subs.length === 0) return '$14,240.50';
    if (!ctx.subs.length) return '—';
    let cents = 0;
    for (const s of ctx.subs) {
      if (s.status !== 'active') continue;
      const tier = tiers.find((t) => t.legacyPlan === s.plan);
      if (tier) cents += tier.priceCents;
    }
    if (cents === 0) return ctx.devPreview ? '$14,240.50' : '—';
    return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [ctx.subs, ctx.devPreview, tiers]);

  const arpu = useMemo(() => {
    const active = ctx.subs.filter((s) => s.status === 'active').length;
    if (ctx.devPreview && active === 0) return '$42.18';
    if (!active) return '—';
    let cents = 0;
    for (const s of ctx.subs) {
      if (s.status !== 'active') continue;
      const tier = tiers.find((t) => t.legacyPlan === s.plan);
      if (tier) cents += tier.priceCents;
    }
    return `$${(cents / active / 100).toFixed(2)}`;
  }, [ctx.subs, ctx.devPreview, tiers]);

  const activeSubsTotal = useMemo(() => {
    const active = ctx.subs.filter((s) => s.status === 'active').length;
    return active > 0 ? active : ctx.devPreview ? 338 : 0;
  }, [ctx.subs, ctx.devPreview]);

  const loading = ctx.tiersLoading && !ctx.devPreview;

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

  function scrollToConfigure() {
    setView('configure');
    requestAnimationFrame(() => {
      document.getElementById('studio-plan-config')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  async function handleSavePlan() {
    if (!ctx.me?.creatorId) return;
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
        creatorId: ctx.me.creatorId,
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
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Products"
          title="Products & Pricing"
          sub="Manage your subscription tiers and content accessibility rules."
          actions={
            <>
              <Button variant="outline" iconLeft="sliders" onClick={() => setView('compare')}>
                Pricing strategy
              </Button>
              <Button
                variant="primary"
                iconLeft="plus"
                disabled={busy || !ctx.me?.creatorId}
                onClick={scrollToConfigure}
              >
                New tier
              </Button>
            </>
          }
        />

        {error ? <Muted>{error}</Muted> : null}

        <StudioSubNav items={VIEW_TABS} value={view} onChange={setView} />

        <StudioSummaryGrid
          columns={3}
          items={[
            {
              id: 'mrr',
              icon: 'dollar',
              iconTone: 'primary',
              label: 'Monthly revenue',
              value: monthlyRevenue,
              delta: ctx.devPreview ? { value: '+12.5%', dir: 'up' as const } : undefined,
              onClick: () => navigate(STUDIO.payouts),
            },
            {
              id: 'arpu',
              icon: 'chart',
              iconTone: 'violet',
              label: 'Avg. revenue / user',
              value: arpu,
              delta: { value: '30d', dir: 'flat' as const },
              active: view === 'configure',
              onClick: scrollToConfigure,
            },
            {
              id: 'subs',
              icon: 'users',
              iconTone: 'amber',
              label: 'Active subscriptions',
              value: activeSubsTotal.toLocaleString(),
              delta: { value: `${allTierCards.length} tiers`, dir: 'flat' as const },
              onClick: () => navigate(STUDIO.subscribers),
            },
          ]}
        />

        {view === 'tiers' ? (
          <>
            <StudioFilterBar
              options={TIER_FILTERS}
              value={tierFilter}
              onChange={setTierFilter}
              ariaLabel="Filter pricing tiers"
              search={{
                value: search,
                onChange: (e) => setSearch(e.target.value),
                placeholder: 'Search tiers…',
                'aria-label': 'Search tiers',
              }}
              trailing={<StudioMetaChip icon="plus" label="New tier" onClick={scrollToConfigure} />}
            />

            {loading ? (
              <Card pad="lg" elev>
                <EmptyState icon="card" title="Loading tiers…" />
              </Card>
            ) : tierCards.length === 0 ? (
              <Card pad="lg" elev>
                <EmptyState
                  icon="card"
                  title={search ? 'No tiers match your search' : 'No pricing tiers yet'}
                  subtitle={
                    search
                      ? 'Try a different query or clear filters.'
                      : 'Configure a plan below or use New tier to create your first offering.'
                  }
                  action={
                    search ? (
                      <Button variant="secondary" onClick={() => setSearch('')}>
                        Clear search
                      </Button>
                    ) : (
                      <Button variant="primary" iconLeft="plus" onClick={scrollToConfigure}>
                        Create tier
                      </Button>
                    )
                  }
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
          </>
        ) : null}

        {view === 'compare' ? <StudioFeatureCompare rows={COMPARE_ROWS} /> : null}

        {view === 'configure' ? (
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
              onFeatureChange={(i, v) =>
                setFeatures((prev) => prev.map((f, j) => (j === i ? v : f)))
              }
              onAddFeature={() => setFeatures((prev) => [...prev, ''])}
              onRemoveFeature={(i) => setFeatures((prev) => prev.filter((_, j) => j !== i))}
              onToggleAccess={toggleAccess}
              onDiscard={resetForm}
              onSave={handleSavePlan}
            />
          </div>
        ) : null}

        <QuickActionGrid title="Related" items={studioCrossLinks('products', navigate)} />
      </Stack>
    </Container>
  );
}
