import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import {
  Container,
  Section,
  Row,
  Stack,
  Grid,
  Col,
  Card,
  Button,
  Badge,
  Icon,
  Mono,
  Eyebrow,
  Heading,
  Muted,
  Search,
  FilterChips,
  CreatorCard,
  EmptyState,
  MetricGrid,
  Reveal,
  Stagger,
  StaggerItem,
  ResponsibleSection,
} from '@digipicks/ds';

const SPORT_FILTERS = [
  { label: 'Soccer', value: 'Soccer', icon: <Icon name="soccer" size={14} /> },
  { label: 'Cricket', value: 'Cricket', icon: <Icon name="cricket" size={14} /> },
  { label: 'Tennis', value: 'Tennis', icon: <Icon name="tennis" size={14} /> },
  { label: 'NFL', value: 'NFL', icon: <Icon name="football" size={14} /> },
  { label: 'NBA', value: 'NBA', icon: <Icon name="basketball" size={14} /> },
];

const SORT_OPTIONS = [
  { label: 'Win rate', value: 'winRate' },
  { label: 'Subscribers', value: 'subs' },
  { label: 'Price', value: 'price' },
  { label: 'Units', value: 'units' },
  { label: 'Newest', value: 'newest' },
];

export function Creators() {
  const navigate = useNavigate();
  const creators = useQuery(api.creators.list, {});
  const [sport, setSport] = useState<string | null>(null);
  const [sort, setSort] = useState<string | null>('winRate');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = creators ?? [];
    if (sport) {
      list = list.filter((c) =>
        c.sports.some((s: string) => s.toLowerCase().includes(sport.toLowerCase())),
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.handle.toLowerCase().includes(q) ||
          c.niche.toLowerCase().includes(q) ||
          c.sports.some((s: string) => s.toLowerCase().includes(q)) ||
          c.tags.some((t: string) => t.toLowerCase().includes(q)),
      );
    }
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'winRate':
          return b.winRate - a.winRate;
        case 'subs':
          return b.subscriberCount - a.subscriberCount;
        case 'price':
          return a.startingPrice - b.startingPrice;
        case 'units':
          return parseFloat(b.units) - parseFloat(a.units);
        case 'newest':
          return b.createdAt - a.createdAt;
        default:
          return 0;
      }
    });
    return list;
  }, [creators, sport, search, sort]);

  // ── Stats ribbon — derived from the unfiltered list so the metrics
  //    don't whiplash as the user filters. ──
  const all = creators ?? [];
  const total = all.length;
  const verified = all.filter((c) => c.verified).length;
  const trending = all.filter((c) => c.trending).length;
  const avgWinRate = total
    ? Math.round((all.reduce((sum, c) => sum + c.winRate, 0) / total) * 10) / 10
    : 0;

  // ── Trending strip — top 3 trending creators, falling back to
  //    highest-win-rate when no trending flag is set anywhere. ──
  const trendingPicks = useMemo(() => {
    const t = all.filter((c) => c.trending).slice(0, 3);
    if (t.length > 0) return t;
    return [...all].sort((a, b) => b.winRate - a.winRate).slice(0, 3);
  }, [all]);

  const isLoading = creators === undefined;
  const isEmpty = !isLoading && total === 0;

  return (
    <main>
      <Container size="xl" pad="page">
        {/* ── Hero ────────────────────────────────────────────────── */}
        <Reveal direction="up">
          <Section>
            <Row between gap={3}>
              <Stack gap={2} maxWidth="prose">
                <Eyebrow>The network · verified analysts</Eyebrow>
                <Heading level={1} size="4xl" weight="bold">
                  The roster.
                </Heading>
                <Muted>
                  Every creator's record is graded on-platform. Win rate, units, last-10, streak —
                  all derived from finalized picks. No screenshots. No promises.
                </Muted>
              </Stack>
              <Row gap={2}>
                <Badge tone="blue" dot>
                  {isLoading ? '…' : `${total} creators`}
                </Badge>
                <Button
                  variant="primary"
                  iconRight="arrow-right"
                  onClick={() => navigate('/apply')}
                >
                  Apply as a creator
                </Button>
              </Row>
            </Row>
          </Section>
        </Reveal>

        {/* ── Stats ribbon ────────────────────────────────────────── */}
        {!isEmpty && (
          <Reveal direction="up" delay={0.05}>
            <Section>
              <MetricGrid
                cols={4}
                items={[
                  {
                    id: 'total',
                    label: 'Verified analysts',
                    value: <Mono>{isLoading ? '—' : total}</Mono>,
                  },
                  {
                    id: 'verified',
                    label: 'Identity-verified',
                    value: <Mono>{isLoading ? '—' : verified}</Mono>,
                    delta:
                      total > 0
                        ? {
                            value: `${Math.round((verified / total) * 100)}% of network`,
                            dir: 'flat',
                          }
                        : undefined,
                  },
                  {
                    id: 'trending',
                    label: 'Trending now',
                    value: <Mono>{isLoading ? '—' : trending}</Mono>,
                    delta: trending ? { value: 'hot', dir: 'up' } : undefined,
                  },
                  {
                    id: 'winRate',
                    label: 'Network avg win rate',
                    value: <Mono>{isLoading ? '—' : `${avgWinRate}%`}</Mono>,
                  },
                ]}
              />
            </Section>
          </Reveal>
        )}

        {/* ── Trending strip ──────────────────────────────────────── */}
        {!isEmpty && trendingPicks.length > 0 && (
          <Reveal direction="up" delay={0.1}>
            <Section eyebrow="Trending" title="Hot this week">
              <Stagger>
                <Grid cols={3} gap={4}>
                  {trendingPicks.map((c) => (
                    <StaggerItem key={`trend-${c._id}`}>
                      <CreatorCard
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
                    </StaggerItem>
                  ))}
                </Grid>
              </Stagger>
            </Section>
          </Reveal>
        )}

        {/* ── Filters ─────────────────────────────────────────────── */}
        {!isEmpty && (
          <Reveal direction="up" delay={0.15}>
            <Section>
              <Card pad="sm">
                <Stack gap={3}>
                  <Row gap={3} wrap>
                    <Col gap={1}>
                      <Muted>Sport</Muted>
                      <FilterChips
                        options={SPORT_FILTERS}
                        value={sport}
                        onChange={setSport}
                        allLabel="All sports"
                      />
                    </Col>
                    <Col gap={1}>
                      <Muted>Sort by</Muted>
                      <FilterChips
                        options={SORT_OPTIONS}
                        value={sort}
                        onChange={setSort}
                        allLabel="Default"
                      />
                    </Col>
                  </Row>
                  <Search
                    placeholder="Search by name, handle, niche, sport, tag…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Stack>
              </Card>
            </Section>
          </Reveal>
        )}

        {/* ── Grid / states ───────────────────────────────────────── */}
        {isLoading ? (
          <Section>
            <Card>
              <EmptyState icon="users" title="Loading creators…" />
            </Card>
          </Section>
        ) : isEmpty ? (
          <Section>
            <Card>
              <Stack gap={3}>
                <EmptyState
                  icon="users"
                  title="No creators in this deployment yet."
                  subtitle="Run the seed mutation to populate ten verified creators with realistic records, niches, and pricing — then this page lights up."
                  action={
                    <Button
                      variant="secondary"
                      iconLeft="play"
                      onClick={() =>
                        window.open('https://dashboard.convex.dev', '_blank', 'noopener,noreferrer')
                      }
                    >
                      Open Convex dashboard
                    </Button>
                  }
                />
                <Muted>
                  In the Functions panel run <Mono>seed.seedAll</Mono> as a super_admin. Local-dev
                  alternative:
                </Muted>
                <Mono>npx convex run seed:seedAll</Mono>
              </Stack>
            </Card>
          </Section>
        ) : filtered.length === 0 ? (
          <Section>
            <Card>
              <EmptyState
                icon="search"
                title="No creators match those filters."
                subtitle="Try clearing the sport filter or the search box."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSport(null);
                      setSearch('');
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            </Card>
          </Section>
        ) : (
          <Section
            eyebrow={sport ?? 'All creators'}
            title={`${filtered.length} ${filtered.length === 1 ? 'creator' : 'creators'} found.`}
          >
            <Stagger>
              <Grid cols={2} gap={5}>
                {filtered.map((c) => (
                  <StaggerItem key={c._id}>
                    <CreatorCard
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
                  </StaggerItem>
                ))}
              </Grid>
            </Stagger>
          </Section>
        )}

        <ResponsibleSection />
      </Container>
    </main>
  );
}
