import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Section,
  Hero,
  Stack,
  Row,
  Grid,
  Muted,
  Serif,
  Button,
  Badge,
  Icon,
  CreatorCard,
  EventCard,
  FeaturedEventCard,
  BigStat,
  FAQList,
  HeroLivePanel,
  TrustMarquee,
  PriceCard,
  Heading,
  Eyebrow,
  StepCard,
  Testimonial,
  SplitCTA,
  ResponsibleSection,
} from '@digipicks/ds';
import { CREATORS, EVENTS_TODAY } from '@/data/mock';

const TRUST_BRANDS = [
  'Action Network',
  'The Athletic',
  'Vegas Stats',
  'OddsJam',
  'Pinnacle Edge',
  'Bet Labs',
  'Sharper Edge',
  'BetIQ',
];

const HERO_LIVE_EVENTS = [
  { league: 'NBA', away: 'Celtics', home: 'Lakers', awayScore: 89, homeScore: 92, status: 'Q3 · 4:21' },
  { league: 'NFL', away: 'Bills', home: 'Chiefs', awayScore: 17, homeScore: 14, status: 'Q2 · 1:08' },
  { league: 'NHL', away: 'Rangers', home: 'Bruins', awayScore: 2, homeScore: 3, status: 'P3 · 7:45' },
];

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
    body:
      'Browse 142 verified operators across NFL, NBA, NHL, MLB, soccer, tennis, and UFC. Filter by sport, win rate, and pricing.',
    iconName: 'compass',
    tone: 'primary',
    hint: 'Takes ~2 minutes',
  },
  {
    step: 2,
    title: 'Subscribe and unlock their picks.',
    body:
      'Pay once, monthly, or by season. Get full reasoning, units, and confidence — delivered the moment a pick goes live.',
    iconName: 'card',
    tone: 'violet',
    hint: 'Cancel anytime',
  },
  {
    step: 3,
    title: 'Track every play, transparently.',
    body:
      'Wins, losses, and pushes are graded by the platform. Your portfolio, ROI, and CLV are tracked automatically.',
    iconName: 'chart',
    tone: 'green',
    hint: 'Independent grading',
  },
];

const TESTIMONIALS = [
  {
    quote:
      "First platform where my real CLV-tracked record actually matters. The grading is independent — my numbers can't be massaged. Subscribers know exactly what they're paying for.",
    name: 'CourtVision Pro',
    role: 'NBA props · Creator since Mar 2025',
    mono: 'CV',
    color: '#1c9cf0',
    verified: true,
    statValue: '+18.4u',
    statLabel: '90-day ROI',
  },
  {
    quote:
      'Two creators, $48 a month, and I finally stopped chasing Discord screenshots. Picks land before kick, units are sized, and the live tracker is genuinely useful for in-play.',
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
      "I came over from a private Telegram with 4,000 followers. Migration was a Sunday afternoon — and I'm finally keeping more than a takerate. The dashboard is the cleanest in the space.",
    name: 'SharpEdge Bets',
    role: 'NFL sides & totals · Creator since Jan 2026',
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
    a: 'Yes. Cancellations are immediate. You keep access until the end of your current billing period — no haggling, no retention loops.',
  },
  {
    q: 'Is this gambling?',
    a: 'No — DigiPicks is an information and creator network. We do not take wagers and we do not pay out winnings. Picks are research and opinion.',
  },
  {
    q: "What's the creator revenue split?",
    a: 'Creators keep 87% of subscription revenue. The platform takes 10%. Stripe processing is roughly 3%. No hidden fees and no upsell games.',
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
    cta: 'Sign up',
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

export function Landing() {
  const navigate = useNavigate();
  const featuredEvent = EVENTS_TODAY.find((e) => e.featured) ?? EVENTS_TODAY[0];
  const otherEvents = EVENTS_TODAY.filter((e) => e.id !== featuredEvent.id).slice(0, 6);
  const heroCreators = CREATORS.slice(0, 4).map((c) => ({
    mono: c.avatar.mono,
    color: c.avatar.color,
  }));

  return (
    <main>
      {/* ── 01 · Hero — single confident lead-in with live signal ──────── */}
      <Hero
        eyebrow={
          <Row gap={2}>
            <Badge tone="green" dot>
              Now onboarding · Spring '26 cohort
            </Badge>
            <Muted>142 verified creators</Muted>
          </Row>
        }
        title={
          <>
            Follow verified <em>sports creators</em>.<br />
            Track every play.
          </>
        }
        subtitle="A curated network for sports betting creators and the subscribers who back their edge."
        actions={
          <>
            <Button
              variant="primary"
              size="lg"
              iconRight="arrow-right"
              onClick={() => navigate('/creators')}
            >
              Discover creators
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/apply')}>
              Apply as a creator
            </Button>
          </>
        }
        trust={[
          { icon: <Icon name="verified" size={14} />, label: 'Manual verification' },
          { icon: <Icon name="chart" size={14} />, label: 'Independent grading' },
          { icon: <Icon name="shield" size={14} />, label: 'Stripe-backed billing' },
        ]}
        panel={
          <HeroLivePanel
            events={HERO_LIVE_EVENTS}
            creators={heroCreators}
            creatorsCount={28}
            ctaLabel="Open live tracker"
            onCta={() => navigate('/events')}
          />
        }
      />

      {/* ── 02 · Brand trust marquee ───────────────────────────────────── */}
      <TrustMarquee
        items={TRUST_BRANDS.map((b) => (
          <Serif as="span">{b}</Serif>
        ))}
      />

      <Container size="xl">
        {/* ── 03 · How it works (narrative bridge) ─────────────────────── */}
        <Section
          eyebrow="How it works"
          title="Three steps to your edge."
          sub="No Discord screenshots, no parlays-as-content, no hidden upsells — just a focused product for the people who do the research and the ones who follow them."
          action={
            <Badge tone="blue" dot>
              Avg. setup &lt; 5 min
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

        {/* ── 04 · By the numbers (was floating BigStats) ──────────────── */}
        <Section
          eyebrow="By the numbers"
          title="Numbers that earn the network."
          action={
            <Badge tone="blue" dot>
              Updated weekly
            </Badge>
          }
        >
          <Grid cols={4} gap={5}>
            <BigStat
              label="Verified creators"
              value="142"
              sub="across 7 major sports"
            />
            <BigStat
              label="Network win rate"
              value="58.4%"
              sub="rolling 90-day, units-weighted"
            />
            <BigStat
              label="Active subscribers"
              value="38,420"
              sub="paying for premium picks this week"
            />
            <BigStat
              label="Tracked plays"
              value="2.1M"
              sub="graded by the platform since launch"
            />
          </Grid>
        </Section>

        {/* ── 05 · Featured creators (spotlight pair) ─────────────────── */}
        <Section
          eyebrow="Featured creators"
          title="Verified, transparent, and actually good."
          sub="Two of the network's standout operators. Win rates are independently graded — every record is real, every line has CLV behind it."
          action={
            <Button
              variant="outline"
              iconRight="arrow-right"
              onClick={() => navigate('/creators')}
            >
              Browse all 142 creators
            </Button>
          }
        >
          <Grid cols={2} gap={6}>
            {CREATORS.slice(0, 2).map((c) => (
              <CreatorCard
                key={c.id}
                name={c.name}
                handle={c.handle}
                mono={c.avatar.mono}
                color={c.avatar.color}
                verified={c.verified}
                bio={c.bio}
                winRate={c.winRate}
                record={c.record}
                units={c.units}
                subs={c.subs}
                last10={c.last10}
                streak={c.streak}
                trending={c.trending}
                startingPrice={c.startingPrice}
                tags={c.tags}
                onClick={() => navigate(`/creators/${c.id}`)}
              />
            ))}
          </Grid>
        </Section>

        {/* ── 06 · Tonight's slate ────────────────────────────────────── */}
        <Section
          eyebrow="Tonight's slate"
          title="Tonight's biggest plays."
          sub="The marquee games on tonight's board — every creator covering them, every pick they're calling."
          action={
            <Button
              variant="ghost"
              iconRight="arrow-right"
              onClick={() => navigate('/events')}
            >
              See full slate
            </Button>
          }
        >
          <Stack gap={4}>
            <FeaturedEventCard
              sport={featuredEvent.sport}
              league={featuredEvent.league}
              time={featuredEvent.time}
              home={featuredEvent.home}
              away={featuredEvent.away}
              creators={featuredEvent.creators}
              picks={featuredEvent.picks}
              creatorsAvatars={CREATORS.slice(0, 4).map((c) => ({
                mono: c.avatar.mono,
                color: c.avatar.color,
              }))}
              onClick={() => navigate('/events')}
            />

            <Grid cols={3} gap={4}>
              {otherEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  sport={ev.sport}
                  league={ev.league}
                  time={ev.time}
                  home={ev.home}
                  away={ev.away}
                  creators={ev.creators}
                  picks={ev.picks}
                  onClick={() => navigate('/events')}
                />
              ))}
            </Grid>
          </Stack>
        </Section>

        {/* ── 07 · Testimonials (social proof) ────────────────────────── */}
        <Section
          eyebrow="What people say"
          title="Both sides, winning."
          sub="From the creators publishing the picks and the subscribers backing them."
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

        {/* ── 08 · Pricing ────────────────────────────────────────────── */}
        <Section
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
                    onClick={() => navigate('/apply')}
                  >
                    {t.cta}
                  </Button>
                }
              />
            ))}
          </Grid>
        </Section>

        {/* ── 09 · Split CTA — creator vs subscriber path ─────────────── */}
        <Section eyebrow="Two ways in" title="Pick your side.">
          <SplitCTA
            panels={[
              {
                variant: 'creators',
                icon: <Icon name="sparkles" size={22} />,
                eyebrow: 'For creators',
                title: 'Bring your edge — keep more of it.',
                body:
                  'Apply once, get verified, start publishing. Stripe-backed weekly payouts and real records that build your audience.',
                bullets: [
                  '87% revenue share, no tiered take-rate',
                  'Independent grading and CLV tracking',
                  'Smart pricing tools and churn analytics',
                ],
                actions: (
                  <>
                    <Button variant="primary" size="lg" onClick={() => navigate('/apply')}>
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
                title: "Follow the sharps you actually trust.",
                body:
                  'Subscribe to up to 5 creators on Premium, unlimited on VIP. Your portfolio, ROI, and CLV are tracked automatically.',
                bullets: [
                  'Picks delivered before the line moves',
                  'Live tracker for tonight\'s slate',
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

        {/* ── 10 · Responsible-gambling notice (legally important, modern card) ── */}
        <ResponsibleSection noReveal pad={false} />

        {/* ── 11 · FAQ (2-col split) ──────────────────────────────────── */}
        <Section>
          <Grid cols={2} gap={10}>
            <Stack gap={5}>
              <Eyebrow>FAQ · For creators &amp; subscribers</Eyebrow>
              <Heading level={2} size="3xl" balance>
                Questions, answered straight.
              </Heading>
              <Muted>
                No fine-print games. If something is unclear, the answer is here —
                or one click away in our docs.
              </Muted>
              <Row gap={3} wrap>
                <Button
                  variant="outline"
                  iconRight="arrow-right"
                  onClick={() => navigate('/apply')}
                >
                  Read full docs
                </Button>
                <Button variant="ghost" onClick={() => navigate('/apply')}>
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
