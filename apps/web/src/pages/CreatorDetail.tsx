import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  CreatorCard,
  EmptyState,
  ResponsibleSection,
  Tag,
  Sparkline,
  Breadcrumb,
  Divider,
} from '@digipicks/ds';
import { CREATORS, FEED_PICKS, type Creator } from '@/data/mock';

function formatWinRate(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function formatSubs(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return v.toLocaleString();
}

function buildTiers(c: Creator) {
  const base = c.startingPrice;
  return [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Public picks and grades',
        'Win-rate transparency',
        'Notification preferences',
      ],
      cta: 'Follow',
      featured: false,
    },
    {
      name: 'Premium',
      price: `$${base}`,
      period: 'per month',
      features: [
        'Every pre-game pick',
        'Full reasoning + units sizing',
        'Confidence + CLV tracking',
        'Priority pick alerts',
      ],
      cta: 'Subscribe',
      featured: true,
    },
    {
      name: 'VIP',
      price: `$${base + 40}`,
      period: 'per month',
      features: [
        'Everything in Premium',
        'Real-time DMs with the creator',
        'VIP-only chat room',
        'Tax-ready unit reports',
      ],
      cta: 'Go VIP',
      featured: false,
    },
  ];
}

// Synthetic sparkline trend (last 30 graded picks rolling units).
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
  const creator = CREATORS.find((c) => c.id === id) ?? CREATORS[0];

  const others = CREATORS.filter((c) => c.id !== creator.id).slice(0, 3);
  const recent = FEED_PICKS.filter((p) => p.creator === creator.id).slice(0, 4);
  const tiers = buildTiers(creator);
  const trend = buildTrend(creator.id.charCodeAt(0) + creator.id.length);
  const cssVars = { '--av-color': creator.avatar.color } as React.CSSProperties;
  const streakDown = creator.streak.startsWith('L');
  const unitsDown = creator.units.startsWith('-');

  return (
    <main>
      <Container size="xl">
        {/* ── Crumbs ────────────────────────────────────────────────────── */}
        <Section noReveal>
          <Breadcrumb
            items={[
              { label: 'Creators', href: '/creators' },
              { label: creator.name },
            ]}
          />
        </Section>

        {/* ── Profile hero — split: identity + key stats ────────────────── */}
        <Section noReveal>
          <Card pad="xl" style={cssVars}>
            <Grid cols={2} gap={8} stagger={false}>
              {/* left: identity */}
              <Stack gap={5}>
                <Row gap={5}>
                  <Avatar
                    mono={creator.avatar.mono}
                    color={creator.avatar.color}
                    size={88}
                  />
                  <Stack gap={2}>
                    <Row gap={2} wrap>
                      {creator.trending && (
                        <Badge tone="gold" icon="flame">Trending</Badge>
                      )}
                      <Badge tone={streakDown ? 'red' : 'green'} dot>
                        Streak {creator.streak}
                      </Badge>
                      {creator.verified && (
                        <Badge tone="blue" icon="verified">Verified</Badge>
                      )}
                    </Row>
                    <Heading level={1} size="3xl" balance>
                      {creator.name}
                    </Heading>
                    <Row gap={2} wrap>
                      <Mono>{creator.handle}</Mono>
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

                <Row gap={3} wrap>
                  <Button variant="primary" iconRight="arrow-right">
                    Subscribe — ${creator.startingPrice}/mo
                  </Button>
                  <Button variant="outline" iconLeft="bell">
                    Notify me
                  </Button>
                  <Button variant="ghost" iconLeft="bookmark">
                    Save
                  </Button>
                </Row>
              </Stack>

              {/* right: key stats grid */}
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
                  <Metric label="Subscribers" value={formatSubs(creator.subs)} />
                  <Metric
                    label="W·L·P record"
                    value={creator.record}
                  />
                </Grid>
                <Card pad="md">
                  <Row between>
                    <Stack gap={1}>
                      <Eyebrow>Rolling units</Eyebrow>
                      <Mono>last 30 graded picks</Mono>
                    </Stack>
                    <Sparkline
                      values={trend}
                      color="var(--green)"
                      width={160}
                      height={42}
                    />
                  </Row>
                </Card>
              </Stack>
            </Grid>
          </Card>
        </Section>

        {/* ── Recent picks (feed) ─────────────────────────────────────────── */}
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
                  key={p.id}
                  creatorName={creator.name}
                  creatorHandle={creator.handle}
                  creatorMono={creator.avatar.mono}
                  creatorColor={creator.avatar.color}
                  creatorVerified={creator.verified}
                  access={p.access}
                  sport={p.sport}
                  event={p.event}
                  eventTime={p.eventTime}
                  posted={p.posted}
                  title={p.title}
                  market={p.market}
                  selection={p.selection}
                  odds={p.odds}
                  units={p.units}
                  body={p.body}
                  teaser={p.teaser}
                  status={p.status}
                  locked={p.access !== 'free'}
                />
              ))}
            </Stack>
          ) : (
            <EmptyState
              icon="inbox"
              title="No public picks yet."
              subtitle="This creator hasn't posted a public pick recently. Subscribe to see premium picks the moment they go live."
              action={
                <Button variant="primary" iconRight="arrow-right">
                  Subscribe — ${creator.startingPrice}/mo
                </Button>
              }
            />
          )}
        </Section>

        {/* ── Performance breakdown ─────────────────────────────────────── */}
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
                  {creator.last10.split('').map((c, i) => (
                    <Badge
                      key={i}
                      tone={c === 'W' ? 'green' : c === 'L' ? 'red' : 'mute'}
                    >
                      {c}
                    </Badge>
                  ))}
                </Row>
                <Divider />
                <Row between>
                  <Muted>Current streak</Muted>
                  <Badge tone={streakDown ? 'red' : 'green'} dot>
                    {creator.streak}
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

        {/* ── Subscribe ─────────────────────────────────────────────────── */}
        <Section
          eyebrow="Subscribe"
          title={`Pick a plan that fits how you follow ${creator.name}.`}
          sub="Cancel anytime. No retention games. 87% goes to the creator."
        >
          <Grid cols={3} gap={5}>
            {tiers.map((t) => (
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
                    block
                    iconRight="arrow-right"
                  >
                    {t.cta}
                  </Button>
                }
              />
            ))}
          </Grid>
        </Section>

        {/* ── Similar creators ─────────────────────────────────────────── */}
        <Section
          eyebrow="Similar creators"
          title="Other operators worth following."
          action={
            <Button
              variant="outline"
              onClick={() => navigate('/creators')}
              iconRight="arrow-right"
            >
              Browse all 142
            </Button>
          }
        >
          <Grid cols={3} gap={5}>
            {others.map((c) => (
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

        <ResponsibleSection />
      </Container>
    </main>
  );
}

// Reserve unused imports.
void Col;
