import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useConvexAuth } from '../auth/convexAuth';
import {
  Container,
  Stack,
  Grid,
  Spacer,
  Button,
  Icon,
  PersonRow,
  PickCard,
  PricingModal,
  EmptyState,
  Muted,
  Breadcrumb,
  Tabs,
  StudioSummaryGrid,
  StudioDashLayout,
  StudioDashCol,
  CreatorProfileHero,
  CreatorProfileAbout,
  CreatorSubscribeCard,
  CreatorPerformanceHighlights,
  CreatorProfileStickyAside,
  Heading,
  Section,
  PriceCard,
  type PricingPlan,
  type PricingTier,
} from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';
import { isOwnCreator } from '../lib/creatorSelf';

const PROFILE_TABS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Picks', value: 'picks' },
  { label: 'Products', value: 'products' },
];

const SUBSCRIBE_FEATURES = [
  { icon: 'bell' as const, text: 'Instant pick notifications' },
  { icon: 'chart' as const, text: 'Verified track record' },
  { icon: 'message' as const, text: 'Member-only community access' },
];

const INCLUDED_FEATURES = [
  { text: 'Daily data-backed picks' },
  { text: 'Full reasoning and unit sizing' },
  { text: 'Confidence and CLV context' },
];

function formatWinRate(v: number): string {
  const pct = v <= 1 ? v * 100 : v;
  return `${Math.round(pct)}%`;
}

function formatSubs(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return v.toLocaleString();
}

function formatLast10(last10: string): string | undefined {
  const trimmed = last10.trim();
  if (!trimmed) return undefined;
  const wins = [...trimmed].filter((c) => c === 'W').length;
  const losses = [...trimmed].filter((c) => c === 'L').length;
  if (wins + losses === 0) return undefined;
  return `${wins}-${losses}`;
}

export function CreatorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');
  const [tab, setTab] = React.useState('overview');

  const creator = useQuery(api.creators.getByHandle, id ? { handle: id } : 'skip');
  const recentPicks = useQuery(
    api.picks.byCreator,
    creator?._id ? { creatorId: creator._id, limit: 8 } : 'skip',
  );
  const allCreators = useQuery(api.creators.list, {});
  const isSubscribed = useQuery(
    api.subscriptions.hasAccess,
    creator?._id && isAuthenticated ? { creatorId: creator._id } : 'skip',
  );

  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const subscribeFree = useMutation(api.subscriptions.subscribe);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [busyPlan, setBusyPlan] = React.useState<PricingPlan | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  if (id && creator === null) {
    return (
      <main>
        <Container size="2xl" pad="page">
          <Section>
            <EmptyState
              icon="search"
              title="Creator not found"
              subtitle={`We couldn't find a creator with the handle "${id}".`}
              action={
                <Button
                  variant="primary"
                  iconRight="arrow-right"
                  onClick={() => navigate('/creators')}
                >
                  Browse creators
                </Button>
              }
            />
          </Section>
        </Container>
      </main>
    );
  }

  if (!creator) {
    return (
      <main>
        <Container size="2xl" pad="page">
          <Section>
            <EmptyState icon="user" title="Loading creator…" />
          </Section>
        </Container>
      </main>
    );
  }

  const profile = creator;
  const isOwnProfile = isOwnCreator(profile._id, me?.creatorId);
  const hasFullAccess = isOwnProfile || Boolean(isSubscribed);

  const others = (allCreators ?? []).filter((c) => c._id !== profile._id).slice(0, 2);
  const recent = recentPicks ?? [];
  const unitsDisplay = profile.units.startsWith('-') ? profile.units : `+${profile.units}`;
  const last10Highlight = formatLast10(profile.last10 ?? '');

  const tiers: PricingTier[] = [
    {
      plan: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: ['Public picks and grades', 'Win-rate transparency', 'Notification preferences'],
      featured: false,
      available: true,
    },
    {
      plan: 'premium',
      name: 'Premium',
      price: `$${profile.startingPrice}`,
      period: 'mo',
      features: [
        'Every pre-game pick',
        'Full reasoning + units sizing',
        'Confidence + CLV tracking',
        'Priority pick alerts',
      ],
      featured: true,
      available: Boolean(profile.stripePriceIdPremium),
    },
    {
      plan: 'vip',
      name: 'VIP',
      price: `$${profile.startingPrice + 40}`,
      period: 'mo',
      features: [
        'Everything in Premium',
        'Real-time DMs with the creator',
        'VIP-only chat room',
        'Tax-ready unit reports',
      ],
      featured: false,
      available: Boolean(profile.stripePriceIdVip),
    },
  ];

  const summaryItems = [
    {
      id: 'units',
      icon: 'chart' as const,
      iconTone: profile.units.startsWith('-') ? ('danger' as const) : ('primary' as const),
      label: 'Profit (30d)',
      value: unitsDisplay,
    },
    {
      id: 'winrate',
      icon: 'flame' as const,
      iconTone: 'amber' as const,
      label: 'Win rate',
      value: formatWinRate(profile.winRate),
    },
    {
      id: 'record',
      icon: 'feed' as const,
      iconTone: 'violet' as const,
      label: 'Graded record',
      value: profile.record || '—',
    },
    {
      id: 'subs',
      icon: 'users' as const,
      iconTone: 'primary' as const,
      label: 'Subscribers',
      value: formatSubs(profile.subscriberCount),
    },
  ];

  const performanceItems = profile.sports.slice(0, 2).map((sport, index) => ({
    id: sport,
    label: sport,
    value: unitsDisplay,
    percent: Math.max(20, Math.min(95, Math.round(profile.winRate) - index * 8 + 12)),
  }));

  async function handleSubscribe(plan: PricingPlan) {
    if (!isAuthenticated) {
      navigate(`/auth?next=/creators/${profile.handle}`);
      return;
    }
    setError(null);
    setBusyPlan(plan);
    try {
      if (plan === 'free') {
        await subscribeFree({ creatorId: profile._id, plan: 'free' });
        setModalOpen(false);
      } else {
        setModalOpen(false);
        navigate(`/creators/${profile.handle}/checkout?plan=${plan}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.');
    } finally {
      setBusyPlan(null);
    }
  }

  function openSubscribe() {
    if (isOwnProfile) {
      navigate('/dashboard');
      return;
    }
    if (!isAuthenticated) {
      navigate(`/auth?next=/creators/${profile.handle}`);
      return;
    }
    setError(null);
    setModalOpen(true);
  }

  const subscribeLabel = isOwnProfile
    ? 'Creator studio'
    : isSubscribed
      ? 'Manage subscription'
      : `Subscribe for $${profile.startingPrice}/mo`;

  return (
    <main>
      <Container size="2xl" pad="page">
        <Stack gap={6}>
          <Breadcrumb items={[{ label: 'Creators', href: '/creators' }, { label: profile.name }]} />

          <CreatorProfileHero
            name={profile.name}
            tagline={profile.niche}
            avatarMono={profile.avatarMono}
            avatarColor={profile.avatarColor}
            verified={profile.verified}
            subscribeLabel={subscribeLabel}
            onSubscribe={openSubscribe}
            subscribeDisabled={busyPlan !== null}
            priceHint={isOwnProfile ? undefined : `$${profile.startingPrice}/mo`}
          />

          <StudioSummaryGrid columns={4} items={summaryItems} />

          <Tabs
            tabs={PROFILE_TABS}
            value={tab}
            onChange={setTab}
            ariaLabel="Creator profile sections"
          />

          <StudioDashLayout>
            <StudioDashCol span={8}>
              <Stack gap={8}>
                {tab === 'overview' ? (
                  <CreatorProfileAbout
                    title={`About ${profile.name}`}
                    bio={profile.bio}
                    includes={INCLUDED_FEATURES}
                    highlightLabel="Recent success"
                    highlightValue={last10Highlight}
                    highlightSub={last10Highlight ? 'Last 10 graded picks' : undefined}
                  />
                ) : null}

                {tab === 'products' ? (
                  <Stack gap={6}>
                    <Heading level={2} size="xl">
                      Choose your plan
                    </Heading>
                    <Grid cols={3} gap={5} stagger={false}>
                      {tiers.map((t) => (
                        <PriceCard
                          key={t.plan}
                          name={t.name}
                          price={t.price}
                          period={t.period}
                          features={t.features}
                          featured={t.featured}
                          cta={
                            <Button
                              variant={t.featured ? 'primary' : 'outline'}
                              block
                              iconRight="arrow-right"
                              disabled={t.available === false || busyPlan !== null}
                              onClick={() =>
                                isOwnProfile
                                  ? navigate('/dashboard/products')
                                  : handleSubscribe(t.plan)
                              }
                            >
                              {isOwnProfile
                                ? 'Manage in studio'
                                : t.available === false
                                  ? 'Not available'
                                  : t.plan === 'free'
                                    ? 'Follow free'
                                    : busyPlan === t.plan
                                      ? 'Opening checkout…'
                                      : 'Subscribe'}
                            </Button>
                          }
                        />
                      ))}
                    </Grid>
                  </Stack>
                ) : null}

                {tab === 'overview' || tab === 'picks' ? (
                  <Stack gap={4}>
                    <Heading level={2} size="xl">
                      Recent analysis & picks
                    </Heading>
                    {recent.length > 0 ? (
                      <Stack gap={4}>
                        {recent.map((p) => (
                          <PickCard
                            key={p._id}
                            creatorName={profile.name}
                            creatorHandle={profile.handle}
                            creatorMono={profile.avatarMono}
                            creatorColor={profile.avatarColor}
                            creatorVerified={profile.verified}
                            access={p.access}
                            sport={p.sport}
                            event={p.eventName}
                            eventTime={p.eventTime}
                            posted={new Date(p.publishedAt ?? p.createdAt).toLocaleDateString()}
                            title={p.title}
                            market={p.market}
                            selection={p.selection}
                            odds={p.odds}
                            units={p.units}
                            body={p.body}
                            teaser={p.teaser}
                            status={p.grade ?? 'pending'}
                            aiSummary={p.aiSummary}
                            aiConfidence={p.aiConfidence}
                            aiReasoning={p.aiReasoning}
                            aiModel={p.aiModel}
                            locked={p.access !== 'free' && !hasFullAccess}
                            onOpen={() =>
                              p.access !== 'free' && !hasFullAccess ? openSubscribe() : undefined
                            }
                          />
                        ))}
                      </Stack>
                    ) : (
                      <EmptyState
                        icon="inbox"
                        title="No public picks yet"
                        subtitle={
                          isOwnProfile
                            ? 'Publish picks from creator studio to show them on your public profile.'
                            : 'Subscribe to see premium picks the moment they go live.'
                        }
                        action={
                          <Button variant="primary" iconRight="arrow-right" onClick={openSubscribe}>
                            {isOwnProfile ? 'Go to creator studio' : subscribeLabel}
                          </Button>
                        }
                      />
                    )}
                  </Stack>
                ) : null}
              </Stack>
            </StudioDashCol>

            <StudioDashCol span={4}>
              <CreatorProfileStickyAside>
                {isOwnProfile ? (
                  <Stack gap={4}>
                    <Heading level={3} size="sm">
                      Your public profile
                    </Heading>
                    <Muted>
                      Subscribers see this page. Manage picks, pricing, and branding in creator
                      studio.
                    </Muted>
                    <Button
                      variant="primary"
                      block
                      iconRight="arrow-right"
                      onClick={() => navigate('/dashboard')}
                    >
                      Open creator studio
                    </Button>
                  </Stack>
                ) : (
                  <CreatorSubscribeCard
                    price={`$${profile.startingPrice}`}
                    features={SUBSCRIBE_FEATURES}
                    onSubscribe={openSubscribe}
                    disabled={busyPlan !== null}
                    subscribeLabel={isSubscribed ? 'Manage subscription' : 'Get full access now'}
                  />
                )}

                {performanceItems.length > 0 ? (
                  <CreatorPerformanceHighlights items={performanceItems} />
                ) : null}

                {others.length > 0 ? (
                  <Stack gap={4}>
                    <Heading level={3} size="sm">
                      Recommended experts
                    </Heading>
                    <Stack gap={2}>
                      {others.map((c) => (
                        <PersonRow
                          key={c._id}
                          name={c.name}
                          sub={c.niche}
                          mono={c.avatarMono}
                          color={c.avatarColor}
                          trailing={<Icon name="chevron-right" size={16} />}
                          onClick={() => navigate(`/creators/${c.handle}`)}
                        />
                      ))}
                    </Stack>
                  </Stack>
                ) : null}
              </CreatorProfileStickyAside>
            </StudioDashCol>
          </StudioDashLayout>

          {error ? <EmptyState icon="alert" title="Something went wrong" subtitle={error} /> : null}

          <Spacer />
        </Stack>
      </Container>

      {!isOwnProfile ? (
        <PricingModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          creatorName={profile.name}
          tiers={tiers}
          onSubscribe={handleSubscribe}
          busyPlan={busyPlan}
        />
      ) : null}
    </main>
  );
}
