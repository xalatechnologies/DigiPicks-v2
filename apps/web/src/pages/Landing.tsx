import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { useConvexAuth } from '../auth/convexAuth';
import { api } from '../../../../convex/_generated/api';
import { becomeCreatorCtaLabel, navigateBecomeCreator } from '../lib/becomeCreator';
import { buildLandingProofMetrics, pickSpotlightCreators } from '../lib/landingMetrics';
import {
  Container,
  Section,
  Hero,
  Stack,
  Row,
  Grid,
  Button,
  Badge,
  Icon,
  CreatorDirectoryCompactCard,
  EventCard,
  FAQList,
  HeroLivePanel,
  PriceCard,
  Heading,
  Eyebrow,
  StepCard,
  Testimonial,
  SplitCTA,
  TrendingCarousel,
  MarketingProofStrip,
  LandingLiveChapter,
  CreatorsHorizontalRail,
  CreatorsHorizontalRailItem,
  type TrendingItem,
} from '@digipicks/ds';

const STEPS: Array<{
  step: number;
  title: string;
  body: string;
  iconName: string;
  tone: 'primary' | 'violet' | 'green';
  hint: React.ReactNode;
}> = [
  {
    step: 1,
    title: 'Find a creator that fits your edge.',
    body: 'Browse verified creators across soccer, cricket, and tennis. Filter by sport, win rate, and pricing.',
    iconName: 'compass',
    tone: 'primary',
    hint: 'Takes ~2 minutes',
  },
  {
    step: 2,
    title: 'Subscribe and unlock their picks.',
    body: 'Pay monthly or by season. Get full reasoning, units, and confidence — delivered when a pick goes live.',
    iconName: 'card',
    tone: 'violet',
    hint: 'Cancel anytime',
  },
  {
    step: 3,
    title: 'Track every play, transparently.',
    body: 'Wins, losses, and pushes are graded by the platform. Portfolio, ROI, and CLV update automatically.',
    iconName: 'chart',
    tone: 'green',
    hint: 'Independent grading',
  },
];

const TESTIMONIALS = [
  {
    quote:
      "First platform where my real CLV-tracked record actually matters. The grading is independent — my numbers can't be massaged.",
    name: 'CourtVision Pro',
    role: 'Soccer props · Creator since Mar 2025',
    mono: 'CV',
    color: '#1c9cf0',
    verified: true,
    statValue: '+18.4u',
    statLabel: '90-day ROI',
  },
  {
    quote:
      'Two creators, $48 a month, and I finally stopped chasing Discord screenshots. Picks land before kick with sized units.',
    name: 'Daniel R.',
    role: 'Subscriber · Atlanta, GA',
    mono: 'DR',
    color: '#7a4dd9',
    verified: false,
    statValue: '+412u',
    statLabel: 'tracked YTD',
  },
  {
    quote:
      'I came over from a private Telegram with 4,000 followers. Migration was a Sunday afternoon — the dashboard is the cleanest in the space.',
    name: 'SharpEdge Bets',
    role: 'Tennis sides · Creator since Jan 2026',
    mono: 'SE',
    color: '#00ba7c',
    verified: true,
    statValue: '92%',
    statLabel: 'subscriber retention',
  },
];

const FAQ_ITEMS = [
  {
    q: 'How are picks graded?',
    a: 'Every pick is graded by the platform, not by the creator. We use closing odds and resulted markets from our independent data provider — no creator can edit a pick after it has been posted.',
  },
  {
    q: 'What does verification involve?',
    a: 'We verify identity, prior track record, source of audience, and review content samples. Creators must agree to our publishing standards before going live.',
  },
  {
    q: 'Can I cancel any time?',
    a: 'Yes. Cancellations are immediate. You keep access until the end of your current billing period.',
  },
  {
    q: 'Is this gambling?',
    a: 'No — DigiPicks is an information and creator network. We do not take wagers and we do not pay out winnings. Picks are research and opinion.',
  },
  {
    q: "What's the creator revenue split?",
    a: 'Creators keep 87% of subscription revenue. The platform takes 10%. Stripe processing is roughly 3%.',
  },
];

const PRICING_TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Browse all verified creators',
      'Public picks and grades',
      "Tonight's slate visibility",
      'Notification preferences',
    ],
    cta: 'Sign up free',
    featured: false,
  },
  {
    name: 'Premium',
    price: '$24',
    period: 'per month',
    features: [
      'Everything in Free',
      'Subscribe to up to 5 creators',
      'Unit-sized picks with reasoning',
      "Live tracker for tonight's slate",
      'Priority pick notifications',
    ],
    cta: 'Start premium',
    featured: true,
  },
  {
    name: 'VIP',
    price: '$79',
    period: 'per month',
    features: [
      'Everything in Premium',
      'Unlimited creator subscriptions',
      'VIP-only chat rooms',
      'Real-time creator DMs',
      'Tax-ready unit reports',
    ],
    cta: 'Go VIP',
    featured: false,
  },
];

function TrendingPicksRail() {
  const navigate = useNavigate();
  const data = useQuery(api.trending.trending, { limit: 12 });
  const items: TrendingItem[] = (data ?? []).map(({ pick, creator }) => ({
    id: pick._id,
    title: pick.title,
    sub: creator ? `${creator.name} · ${pick.eventName}` : pick.eventName,
    sport: pick.sport,
    score: pick.trendingScore,
    onClick: () => navigate(creator ? `/creators/${creator.handle}` : '/feed'),
  }));
  return <TrendingCarousel items={items} loading={data === undefined} hideHeader />;
}

export function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');

  const creators = useQuery(api.creators.list, {});
  const allEvents = useQuery(api.events.today, {});
  const featuredEvents = useQuery(api.events.featured, {});
  const trendingData = useQuery(api.trending.trending, { limit: 12 });
  const liveEvents = useQuery(api.events.live, {});
  const upcomingEvents = useQuery(api.events.featured, {});

  const creatorList = creators ?? [];
  const heroCreators = creatorList.slice(0, 4).map((c) => ({
    mono: c.avatarMono,
    color: c.avatarColor,
  }));
  const featuredEvent = (featuredEvents ?? [])[0] ?? (allEvents ?? [])[0];
  const otherEvents = (allEvents ?? []).filter((e) => e._id !== featuredEvent?._id).slice(0, 4);

  const hasLive = (liveEvents ?? []).length > 0;
  const panelEvents = hasLive ? liveEvents! : (upcomingEvents ?? []);
  const heroLiveEvents = panelEvents.slice(0, 3).map((e) => ({
    league: e.league,
    away: e.away,
    home: e.home,
    awayScore: e.awayScore ?? 0,
    homeScore: e.homeScore ?? 0,
    status: e.gameStatus ?? e.time,
  }));

  const proof = buildLandingProofMetrics({
    creators,
    allEvents,
    liveEvents,
    trendingCount: trendingData?.length,
  });

  const spotlight = pickSpotlightCreators(creatorList, 6);

  return (
    <main>
      <Hero
        eyebrow={
          <Badge tone="violet" dot>
            Creator network · Independently graded
          </Badge>
        }
        title={
          <>
            Follow verified <em>sports creators.</em>
            <br />
            Track every play.
          </>
        }
        subtitle={
          <>
            Every pick ships with platform-graded records and transparent units.{' '}
            <em>Subscribe to the sharpest minds in sports</em> — or apply to publish your own edge.
          </>
        }
        actions={
          <>
            <Button
              variant="primary"
              size="lg"
              iconRight="arrow-right"
              onClick={() => navigate('/creators')}
            >
              Browse creators
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                navigateBecomeCreator(navigate, {
                  isAuthenticated,
                  creatorId: me?.creatorId ?? null,
                })
              }
            >
              {becomeCreatorCtaLabel(me?.creatorId ?? null)}
            </Button>
          </>
        }
        trust={[
          {
            icon: <Icon name="verified" size={14} />,
            label: proof.loading
              ? 'Loading network stats…'
              : `${proof.verifiedCreators} verified creators`,
          },
          {
            icon: <Icon name="chart" size={14} />,
            label: proof.loading ? '—' : `${proof.networkWinRate} network win rate`,
          },
          {
            icon: <Icon name="calendar" size={14} />,
            label: proof.loading
              ? '—'
              : hasLive
                ? `${proof.liveEvents} live now`
                : `${proof.eventsTonight} events tonight`,
          },
        ]}
        panel={
          <HeroLivePanel
            events={heroLiveEvents}
            live={hasLive}
            creators={heroCreators}
            creatorsCount={creatorList.length > 0 ? creatorList.length : undefined}
            ctaLabel={hasLive ? 'Open live tracker' : 'View all events'}
            onCta={() => navigate('/events')}
          />
        }
      />

      <MarketingProofStrip
        loading={proof.loading}
        items={[
          {
            label: 'Verified creators',
            value: proof.loading ? '—' : proof.verifiedCreators,
            sub: proof.loading ? 'Syncing directory…' : `${proof.totalCreators} on the network`,
          },
          {
            label: 'Network win rate',
            value: proof.networkWinRate,
            sub: 'Rolling average, units-weighted',
          },
          {
            label: hasLive ? 'Live right now' : 'Events tonight',
            value: proof.loading ? '—' : hasLive ? proof.liveEvents : proof.eventsTonight,
            sub: hasLive ? 'Tracked on the live board' : 'Across all major leagues',
          },
          {
            label: 'Trending picks',
            value: proof.loading ? '—' : proof.trendingPicks,
            sub: 'Hot on the network today',
          },
        ]}
        footnote="Independent grading · Stripe-backed billing"
        action={
          <Button
            variant="ghost"
            size="sm"
            iconRight="arrow-right"
            onClick={() => navigate('/creators')}
          >
            Explore the directory
          </Button>
        }
      />

      <LandingLiveChapter
        live={hasLive}
        eyebrow="Live network"
        title="What's moving right now."
        sub="Trending picks from verified creators, plus tonight's marquee on the board."
        trendingSub="Updated every 12 hours · independently graded"
        headerAction={
          <Button variant="outline" iconRight="arrow-right" onClick={() => navigate('/events')}>
            Full slate
          </Button>
        }
        trending={<TrendingPicksRail />}
        featuredLabel={hasLive ? 'Live on the board' : "Tonight's marquee"}
        featuredLoading={allEvents === undefined}
        featured={
          featuredEvent ? (
            <EventCard
              featured
              sport={featuredEvent.sport}
              league={featuredEvent.league}
              time={featuredEvent.time}
              home={featuredEvent.home}
              away={featuredEvent.away}
              homeLogo={featuredEvent.homeLogo}
              awayLogo={featuredEvent.awayLogo}
              creators={featuredEvent.creatorCount}
              picks={featuredEvent.pickCount}
              sourceType={featuredEvent.sourceType}
              creatorsAvatars={heroCreators}
              onClick={() => navigate('/events')}
            />
          ) : null
        }
        featuredAction={
          <Button variant="ghost" block iconRight="arrow-right" onClick={() => navigate('/events')}>
            {hasLive ? 'Open live tracker' : "See tonight's slate"}
          </Button>
        }
      />

      <Container size="2xl">
        <Section
          eyebrow="How it works"
          title="Three steps to your edge."
          sub="No Discord screenshots or hidden upsells — a focused product for researchers and the people who follow them."
          action={
            <Badge tone="blue" dot>
              Avg. setup under 5 min
            </Badge>
          }
        >
          <Grid cols={3} gap={5}>
            {STEPS.map((step, i) => (
              <StepCard
                key={step.step}
                step={step.step}
                title={step.title}
                body={step.body}
                icon={<Icon name={step.iconName} size={16} />}
                tone={step.tone}
                hint={
                  <>
                    {step.hint}
                    {i < STEPS.length - 1 && <Icon name="arrow-right" size={12} />}
                  </>
                }
              />
            ))}
          </Grid>
        </Section>

        <Section
          eyebrow="Featured creators"
          title="Verified, transparent, and worth following."
          sub="A sample of the network — win rates and units are graded independently, not self-reported."
          action={
            <Button variant="outline" iconRight="arrow-right" onClick={() => navigate('/creators')}>
              {proof.loading ? 'View creators' : `View all ${proof.totalCreators} creators`}
            </Button>
          }
        >
          <CreatorsHorizontalRail eyebrow="Spotlight" title="Top operators this week">
            {spotlight.map((c) => (
              <CreatorsHorizontalRailItem key={c._id}>
                <CreatorDirectoryCompactCard
                  name={c.name}
                  handle={c.handle}
                  mono={c.avatarMono}
                  color={c.avatarColor}
                  verified={c.verified}
                  bio={c.bio}
                  units={c.units}
                  startingPrice={c.startingPrice}
                  onClick={() => navigate(`/creators/${c.handle}`)}
                />
              </CreatorsHorizontalRailItem>
            ))}
          </CreatorsHorizontalRail>
        </Section>

        <Section
          tone="inset"
          eyebrow="Tonight's slate"
          title="Games on the board tonight."
          sub="Every matchup creators are covering — picks and reasoning land before kickoff."
          action={
            <Button variant="ghost" iconRight="arrow-right" onClick={() => navigate('/events')}>
              See full slate
            </Button>
          }
        >
          <Grid cols={2} gap={4}>
            {otherEvents.map((ev) => (
              <EventCard
                key={ev._id}
                sport={ev.sport}
                league={ev.league}
                time={ev.time}
                home={ev.home}
                away={ev.away}
                homeLogo={ev.homeLogo}
                awayLogo={ev.awayLogo}
                creators={ev.creatorCount}
                picks={ev.pickCount}
                sourceType={ev.sourceType}
                onClick={() => navigate('/events')}
              />
            ))}
          </Grid>
        </Section>
      </Container>

      <Section
        tone="elevated"
        eyebrow="What people say"
        title="Both sides, winning."
        sub="From the creators publishing picks and the subscribers backing them."
      >
        <Grid cols={3} gap={5}>
          {TESTIMONIALS.map((t) => (
            <Testimonial
              key={t.name}
              quote={t.quote}
              authorName={t.name}
              authorRole={t.role}
              authorMono={t.mono}
              authorColor={t.color}
              authorVerified={t.verified}
              statValue={t.statValue}
              statLabel={t.statLabel}
            />
          ))}
        </Grid>
      </Section>

      <Section
        tone="elevated"
        eyebrow="Simple pricing"
        title="Plans that fit your edge."
        sub="Cancel anytime. No retention loops. No hidden fees."
      >
        <Grid cols={3} gap={5}>
          {PRICING_TIERS.map((t) => (
            <PriceCard
              key={t.name}
              name={t.name}
              price={t.price}
              period={t.period}
              features={t.features}
              featured={t.featured}
              cta={
                <Button
                  variant={t.featured ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => navigate('/auth')}
                >
                  {t.cta}
                </Button>
              }
            />
          ))}
        </Grid>
      </Section>

      <Container size="2xl">
        <Section eyebrow="Two ways in" title="Pick your side.">
          <SplitCTA
            panels={[
              {
                variant: 'creators',
                icon: <Icon name="sparkles" size={22} />,
                eyebrow: 'For creators',
                title: 'Bring your edge — keep more of it.',
                body: 'Apply once, get verified, start publishing. Stripe-backed weekly payouts and records that build your audience.',
                bullets: [
                  '87% revenue share, no tiered take-rate',
                  'Independent grading and CLV tracking',
                  'Smart pricing tools and churn analytics',
                ],
                actions: (
                  <>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() =>
                        navigateBecomeCreator(navigate, {
                          isAuthenticated,
                          creatorId: me?.creatorId ?? null,
                        })
                      }
                    >
                      Apply for access
                    </Button>
                    <Button variant="ghost" size="lg" onClick={() => navigate('/creators')}>
                      See current creators
                    </Button>
                  </>
                ),
              },
              {
                variant: 'subscribers',
                icon: <Icon name="bookmark" size={22} />,
                eyebrow: 'For subscribers',
                title: 'Follow the sharps you trust.',
                body: 'Subscribe to creators on Premium or VIP. Your portfolio, ROI, and CLV are tracked automatically.',
                bullets: [
                  'Picks delivered before the line moves',
                  "Live tracker for tonight's slate",
                  'Cancel anytime — no retention games',
                ],
                actions: (
                  <>
                    <Button variant="primary" size="lg" onClick={() => navigate('/creators')}>
                      Browse creators
                    </Button>
                    <Button variant="ghost" size="lg" onClick={() => navigate('/events')}>
                      See tonight's slate
                    </Button>
                  </>
                ),
              },
            ]}
          />
        </Section>

        <Section>
          <Grid cols={2} gap={10}>
            <Stack gap={5}>
              <Eyebrow>FAQ · For creators &amp; subscribers</Eyebrow>
              <Heading level={2} size="3xl" balance>
                Questions, answered straight.
              </Heading>
              <Row gap={3} wrap>
                <Button
                  variant="outline"
                  iconRight="arrow-right"
                  onClick={() => navigate('/trust/verification')}
                >
                  How we verify creators
                </Button>
                <Button variant="ghost" onClick={() => navigate('/contact')}>
                  Contact support
                </Button>
              </Row>
            </Stack>
            <FAQList items={FAQ_ITEMS} />
          </Grid>
        </Section>
      </Container>
    </main>
  );
}
