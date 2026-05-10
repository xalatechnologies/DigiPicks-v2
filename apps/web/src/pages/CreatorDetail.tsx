import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useConvexAuth } from '@convex-dev/auth/react';
import {
  Container,
  Section,
  Stack,
  Row,
  Col,
  Grid,
  Spacer,
  Avatar,
  Badge,
  Button,
  Mono,
  Muted,
  Heading,
  Eyebrow,
  Card,
  CardHead,
  Metric,
  PriceCard,
  PickCard,
  PricingModal,
  CreatorCard,
  EmptyState,
  ResponsibleSection,
  Tag,
  Sparkline,
  Breadcrumb,
  Divider,
  StreamEmbed,
  FollowButton,
  TrustScoreBadge,
  type PricingPlan,
  type PricingTier,
} from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';

function formatWinRate(v: number): string {
  const pct = v <= 1 ? v * 100 : v;
  return `${pct.toFixed(1)}%`;
}

function formatSubs(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return v.toLocaleString();
}

function buildTrend(seed: number): number[] {
  const out: number[] = [];
  let v = 0;
  for (let i = 0; i < 30; i++) {
    v += (Math.sin(seed + i * 0.6) + (i % 3 === 0 ? 0.6 : -0.2)) * 0.8;
    out.push(v);
  }
  return out;
}

export function CreatorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();

  const creator = useQuery(api.creators.getByHandle, id ? { handle: id } : 'skip');
  const recentPicks = useQuery(
    api.picks.byCreator,
    creator?._id ? { creatorId: creator._id, limit: 4 } : 'skip',
  );
  const allCreators = useQuery(api.creators.list, {});
  const trust = useQuery(api.trust.get, creator?._id ? { creatorId: creator._id } : 'skip');
  const isFollowing = useQuery(
    api.followedCreators.isFollowing,
    creator?._id ? { creatorId: creator._id } : 'skip',
  );
  const followCreator = useMutation(api.followedCreators.follow);
  const unfollowCreator = useMutation(api.followedCreators.unfollow);
  const [followBusy, setFollowBusy] = React.useState(false);

  const handleFollowToggle = React.useCallback(
    async (next: boolean) => {
      if (!creator?._id) return;
      setFollowBusy(true);
      try {
        if (next) await followCreator({ creatorId: creator._id });
        else await unfollowCreator({ creatorId: creator._id });
      } finally {
        setFollowBusy(false);
      }
    },
    [creator?._id, followCreator, unfollowCreator],
  );

  const isSubscribed = useQuery(
    api.subscriptions.isSubscribed,
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
        <Container size="xl">
          <Section>
            <EmptyState
              icon="search"
              title="Creator not found."
              subtitle={`We couldn't find a creator with the handle "${id}". They may have changed their handle or moved their profile.`}
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
        <Container size="xl">
          <Section>
            <EmptyState icon="user" title="Loading creator…" />
          </Section>
        </Container>
      </main>
    );
  }

  const others = (allCreators ?? []).filter((c) => c._id !== creator._id).slice(0, 3);
  const recent = recentPicks ?? [];
  const trend = buildTrend(creator.handle.charCodeAt(0) + creator.handle.length);
  const cssVars = { '--av-color': creator.avatarColor } as React.CSSProperties;
  const streakDown = creator.streak.startsWith('L');
  const unitsDown = creator.units.startsWith('-');

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
      price: `$${creator.startingPrice}`,
      period: 'mo',
      features: [
        'Every pre-game pick',
        'Full reasoning + units sizing',
        'Confidence + CLV tracking',
        'Priority pick alerts',
      ],
      featured: true,
      available: Boolean(creator.stripePriceIdPremium),
    },
    {
      plan: 'vip',
      name: 'VIP',
      price: `$${creator.startingPrice + 40}`,
      period: 'mo',
      features: [
        'Everything in Premium',
        'Real-time DMs with the creator',
        'VIP-only chat room',
        'Tax-ready unit reports',
      ],
      featured: false,
      available: Boolean(creator.stripePriceIdVip),
    },
  ];

  async function handleSubscribe(plan: PricingPlan) {
    if (!isAuthenticated) {
      navigate(`/auth?next=/creators/${creator!.handle}`);
      return;
    }
    setError(null);
    setBusyPlan(plan);
    try {
      if (plan === 'free') {
        await subscribeFree({ creatorId: creator!._id, plan: 'free' });
        setModalOpen(false);
      } else {
        const { url } = await createCheckout({
          creatorId: creator!._id,
          plan,
        });
        window.location.assign(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.');
    } finally {
      setBusyPlan(null);
    }
  }

  function openSubscribe() {
    if (!isAuthenticated) {
      navigate(`/auth?next=/creators/${creator!.handle}`);
      return;
    }
    setError(null);
    setModalOpen(true);
  }

  return (
    <main>
      <Container size="xl">
        <Section noReveal>
          <Breadcrumb items={[{ label: 'Creators', href: '/creators' }, { label: creator.name }]} />
        </Section>

        <Section noReveal>
          <Card pad="xl" style={cssVars}>
            <Grid cols={2} gap={8} stagger={false}>
              <Stack gap={5}>
                <Row gap={5}>
                  <Avatar mono={creator.avatarMono} color={creator.avatarColor} size={88} />
                  <Stack gap={2}>
                    <Row gap={2} wrap>
                      {creator.trending && (
                        <Badge tone="gold" icon="flame">
                          Trending
                        </Badge>
                      )}
                      <Badge tone={streakDown ? 'red' : 'green'} dot>
                        Streak {creator.streak || '—'}
                      </Badge>
                      {creator.verified && (
                        <Badge tone="blue" icon="verified">
                          Verified
                        </Badge>
                      )}
                      {isSubscribed && (
                        <Badge tone="violet" dot>
                          Subscribed
                        </Badge>
                      )}
                      <TrustScoreBadge size="sm" score={trust?.score ?? null} />
                    </Row>
                    <Heading level={1} size="3xl" balance>
                      {creator.name}
                    </Heading>
                    <Row gap={2} wrap>
                      <Mono>@{creator.handle}</Mono>
                      <Muted>·</Muted>
                      <Muted>{creator.niche}</Muted>
                    </Row>
                  </Stack>
                </Row>

                <Muted>{creator.bio}</Muted>

                <Row gap={2} wrap>
                  {creator.sports.map((sp) => (
                    <Tag key={sp}>{sp}</Tag>
                  ))}
                  {creator.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </Row>

                {error && <Muted>{error}</Muted>}

                <Row gap={3} wrap>
                  <Button
                    variant="primary"
                    iconRight="arrow-right"
                    onClick={openSubscribe}
                    disabled={busyPlan !== null}
                  >
                    {isSubscribed
                      ? 'Manage subscription'
                      : `Subscribe — $${creator.startingPrice}/mo`}
                  </Button>
                  <Button variant="outline" iconLeft="bell">
                    Notify me
                  </Button>
                  <FollowButton
                    following={Boolean(isFollowing)}
                    onToggle={handleFollowToggle}
                    size="md"
                    disabled={followBusy}
                  />
                </Row>
              </Stack>

              <Stack gap={4}>
                <Eyebrow>Performance · 90 days</Eyebrow>
                <Grid cols={2} gap={4} stagger={false}>
                  <Metric
                    label="Win rate"
                    value={formatWinRate(creator.winRate)}
                    delta={{ value: '+1.2%', dir: 'up' }}
                  />
                  <Metric
                    label="Net units"
                    value={creator.units}
                    delta={{ value: unitsDown ? '-' : '+', dir: unitsDown ? 'down' : 'up' }}
                  />
                  <Metric label="Subscribers" value={formatSubs(creator.subscriberCount)} />
                  <Metric label="W·L·P record" value={creator.record} />
                </Grid>
                <Card pad="md">
                  <Row between>
                    <Stack gap={1}>
                      <Eyebrow>Rolling units</Eyebrow>
                      <Mono>last 30 graded picks</Mono>
                    </Stack>
                    <Sparkline values={trend} color="var(--green)" width={160} height={42} />
                  </Row>
                </Card>
              </Stack>
            </Grid>
          </Card>
        </Section>

        <Section
          eyebrow="Recent picks"
          title={`What ${creator.name} is calling now.`}
          sub="Pre-game only · graded by the platform · published in real time."
          action={
            <Button variant="ghost" iconRight="arrow-right" onClick={() => navigate('/events')}>
              See tonight's slate
            </Button>
          }
        >
          {recent.length > 0 ? (
            <Stack gap={4}>
              {recent.map((p) => (
                <PickCard
                  key={p._id}
                  creatorName={creator.name}
                  creatorHandle={creator.handle}
                  creatorMono={creator.avatarMono}
                  creatorColor={creator.avatarColor}
                  creatorVerified={creator.verified}
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
                  locked={p.access !== 'free' && !isSubscribed}
                  onOpen={() =>
                    p.access !== 'free' && !isSubscribed ? openSubscribe() : undefined
                  }
                />
              ))}
            </Stack>
          ) : (
            <EmptyState
              icon="inbox"
              title="No public picks yet."
              subtitle="This creator hasn't posted a public pick recently. Subscribe to see premium picks the moment they go live."
              action={
                <Button variant="primary" iconRight="arrow-right" onClick={openSubscribe}>
                  Subscribe — ${creator.startingPrice}/mo
                </Button>
              }
            />
          )}
        </Section>

        {creator.streamPlatform && creator.streamHandle && (
          <Section
            eyebrow="Live stream"
            title={`Watch ${creator.name} on ${creator.streamPlatform}.`}
            sub="Embedded directly so you can follow live commentary without leaving DigiPicks."
          >
            <Card pad="md">
              <StreamEmbed platform={creator.streamPlatform} handle={creator.streamHandle} />
            </Card>
          </Section>
        )}

        <Section
          eyebrow="Performance breakdown"
          title="Independently graded — every record real."
          sub="Win rates use closing odds and resulted markets from our independent data provider. Creators cannot edit a pick after it has been posted."
        >
          <Grid cols={3} gap={5} stagger={false}>
            <Card pad="lg">
              <CardHead title="Last 10 results" sub="Oldest left, newest right" />
              <Stack gap={4}>
                <Row gap={1} wrap>
                  {(creator.last10 || '').split('').map((c, i) => (
                    <Badge key={i} tone={c === 'W' ? 'green' : c === 'L' ? 'red' : 'mute'}>
                      {c}
                    </Badge>
                  ))}
                </Row>
                <Divider />
                <Row between>
                  <Muted>Current streak</Muted>
                  <Badge tone={streakDown ? 'red' : 'green'} dot>
                    {creator.streak || '—'}
                  </Badge>
                </Row>
              </Stack>
            </Card>

            <Card pad="lg">
              <CardHead
                title="Pricing"
                sub="Entry-level subscription"
                action={<Badge tone="gold">87% to creator</Badge>}
              />
              <Stack gap={3}>
                <Row gap={2}>
                  <Mono>From</Mono>
                  <Heading level={3} size="2xl">
                    ${creator.startingPrice}
                  </Heading>
                  <Muted>/mo</Muted>
                </Row>
                <Muted>Cancel any time — no retention loops, no email gauntlet.</Muted>
              </Stack>
            </Card>

            <Card pad="lg">
              <CardHead title="Specialties" sub="Markets they focus on" />
              <Row gap={2} wrap>
                {creator.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </Row>
              <Spacer />
              <Divider />
              <Row gap={2} wrap>
                {creator.sports.map((sp) => (
                  <Badge key={sp} tone="blue">
                    {sp}
                  </Badge>
                ))}
              </Row>
            </Card>
          </Grid>
        </Section>

        <Section
          eyebrow="Subscribe"
          title={`Pick a plan that fits how you follow ${creator.name}.`}
          sub="Cancel anytime. No retention games. 87% goes to the creator."
        >
          <Grid cols={3} gap={5}>
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
                    onClick={() => handleSubscribe(t.plan)}
                  >
                    {t.available === false
                      ? 'Not available'
                      : t.plan === 'free'
                        ? 'Follow'
                        : busyPlan === t.plan
                          ? 'Opening checkout…'
                          : 'Subscribe'}
                  </Button>
                }
              />
            ))}
          </Grid>
        </Section>

        <Section
          eyebrow="Similar creators"
          title="Other operators worth following."
          action={
            <Button variant="outline" onClick={() => navigate('/creators')} iconRight="arrow-right">
              Browse all creators
            </Button>
          }
        >
          <Grid cols={3} gap={5}>
            {others.map((c) => (
              <CreatorCard
                key={c._id}
                name={c.name}
                handle={c.handle}
                mono={c.avatarMono}
                color={c.avatarColor}
                verified={c.verified}
                bio={c.bio}
                winRate={c.winRate}
                record={c.record}
                units={c.units}
                subs={c.subscriberCount}
                last10={c.last10}
                streak={c.streak}
                trending={c.trending}
                startingPrice={c.startingPrice}
                tags={c.tags}
                onClick={() => navigate(`/creators/${c.handle}`)}
              />
            ))}
          </Grid>
        </Section>

        <ResponsibleSection />
      </Container>

      <PricingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        creatorName={creator.name}
        tiers={tiers}
        onSubscribe={handleSubscribe}
        busyPlan={busyPlan}
      />
    </main>
  );
}

void Col;
