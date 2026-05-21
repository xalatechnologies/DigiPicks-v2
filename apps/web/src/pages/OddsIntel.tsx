import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Section,
  Row,
  Stack,
  Grid,
  Card,
  CardHead,
  Button,
  Badge,
  Icon,
  type IconName,
  Mono,
  Muted,
  Eyebrow,
  Heading,
  EventCard,
  EmptyState,
  FilterChips,
  OddsGrid,
  Sparkline,
  Reveal,
  type OddsBook,
  type OddsRow,
} from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';
import type { Doc, Id } from '../../../../convex/_generated/dataModel';
import { teamLogo } from '../lib/teamLogo';

type OddsSnapshot = Doc<'oddsSnapshots'>;

const SPORT_FILTERS = [
  { label: 'Soccer', value: 'Soccer', icon: <Icon name="soccer" size={14} /> },
  { label: 'Cricket', value: 'Cricket', icon: <Icon name="cricket" size={14} /> },
  { label: 'Tennis', value: 'Tennis', icon: <Icon name="tennis" size={14} /> },
];

const MARKET_LABEL: Record<string, string> = {
  h2h: 'Moneyline',
  spreads: 'Spread',
  totals: 'Total',
};

const INITIAL_PER_LEAGUE = 6;

function sportIcon(sport: string): IconName {
  const key = sport.toLowerCase();
  if (key === 'soccer') return 'soccer';
  if (key === 'cricket') return 'cricket';
  if (key === 'tennis') return 'tennis';
  return 'calendar';
}

function buildGridData(snapshots: OddsSnapshot[] | undefined): {
  books: OddsBook[];
  rows: OddsRow[];
} {
  if (!snapshots || snapshots.length === 0) return { books: [], rows: [] };

  const bookMap = new Map<string, OddsBook>();
  const rowMap = new Map<string, OddsRow>();

  for (const snap of snapshots) {
    if (!bookMap.has(snap.book)) {
      bookMap.set(snap.book, { key: snap.book, title: snap.bookTitle });
    }
    const rowKey = `${snap.market}|${snap.side}|${snap.point ?? ''}`;
    const rowLabel = (() => {
      const market = MARKET_LABEL[snap.market] ?? snap.market;
      if (snap.market === 'totals' && snap.point !== undefined) {
        return `${snap.side} ${snap.point}`;
      }
      if (snap.market === 'spreads' && snap.point !== undefined) {
        const sign = snap.point > 0 ? `+${snap.point}` : `${snap.point}`;
        return `${snap.side} ${sign}`;
      }
      return `${market} · ${snap.side}`;
    })();
    if (!rowMap.has(rowKey)) {
      rowMap.set(rowKey, {
        market: snap.market,
        side: snap.side,
        label: rowLabel,
        cells: {},
      });
    }
    rowMap.get(rowKey)!.cells[snap.book] = {
      price: snap.price,
      point: snap.point,
    };
  }

  const books = Array.from(bookMap.values()).sort((a, b) => a.title.localeCompare(b.title));
  const rows = Array.from(rowMap.values());
  return { books, rows };
}

function fmtOdds(n: number): string {
  return n.toFixed(2);
}

function relTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 30_000) return 'just now';
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export function OddsIntel() {
  const navigate = useNavigate();
  const [sport, setSport] = React.useState<string | null>(null);
  const [activeId, setActiveId] = React.useState<Id<'events'> | null>(null);
  const [expandedLeagues, setExpandedLeagues] = React.useState<Set<string>>(new Set());
  const featuredRef = React.useRef<HTMLDivElement | null>(null);

  const allEvents = useQuery(api.events.today, sport ? { sport } : {});
  const featuredEvents = useQuery(api.events.featured, {});
  const liveEvents = useQuery(api.events.live, {});
  const recentEvents = useQuery(api.events.recent, {});

  const snapshots = useQuery(
    api.odds.byEvent,
    activeId ? { eventId: activeId, limit: 200 } : 'skip',
  );

  const featured = (featuredEvents ?? []).filter((e) => !sport || e.sport === sport);
  const live = (liveEvents ?? []).filter((e) => !sport || e.sport === sport);
  const rest = (allEvents ?? []).filter(
    (e) => !featured.some((f) => f._id === e._id) && !live.some((l) => l._id === e._id),
  );
  const recent = recentEvents ?? [];

  React.useEffect(() => {
    const candidates = [...live, ...featured, ...rest];
    if (candidates.length === 0) return;
    if (!activeId || !candidates.some((e) => e._id === activeId)) {
      setActiveId(candidates[0]!._id);
    }
  }, [activeId, live, featured, rest]);

  const active = [...(allEvents ?? []), ...(recent ?? [])].find((e) => e._id === activeId) ?? null;

  const { books, rows } = buildGridData(snapshots ?? undefined);

  const homeMoneylineHistory = useQuery(
    api.odds.lineMovement,
    activeId && active
      ? {
          eventId: activeId,
          market: 'h2h',
          book: snapshots?.[0]?.book ?? 'fanduel',
          side: active.home,
          limit: 60,
        }
      : 'skip',
  );

  const lineDelta: { value: string; dir: 'up' | 'down' | 'flat' } = (() => {
    const h = homeMoneylineHistory;
    if (!h || h.length < 2) return { value: '—', dir: 'flat' };
    const first = h[h.length - 1]!.price;
    const last = h[0]!.price;
    const pct = ((last - first) / first) * 100;
    if (Math.abs(pct) < 0.5) return { value: `${pct.toFixed(1)}%`, dir: 'flat' };
    return {
      value: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`,
      dir: pct > 0 ? 'up' : 'down',
    };
  })();

  const lastCapturedAt = snapshots?.[0]?.capturedAt;
  const liveSnapshots = Boolean(snapshots && snapshots.length > 0);

  const logoFor = (ev: {
    sport: string;
    home: string;
    away: string;
    homeLogo?: string;
    awayLogo?: string;
  }) => ({
    homeLogo: ev.homeLogo ?? teamLogo(ev.sport, ev.home),
    awayLogo: ev.awayLogo ?? teamLogo(ev.sport, ev.away),
  });

  const toggleLeague = (league: string) => {
    setExpandedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(league)) next.delete(league);
      else next.add(league);
      return next;
    });
  };

  const focusFeatured = (id: Id<'events'>) => {
    setActiveId(id);
    setTimeout(() => {
      featuredRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const byLeague = rest.reduce<Record<string, typeof rest>>((acc, ev) => {
    (acc[ev.league] ??= []).push(ev);
    return acc;
  }, {});

  const totalEvents = (allEvents ?? []).length;
  const isLoading = allEvents === undefined;
  const filteredEmpty =
    allEvents !== undefined && featured.length === 0 && live.length === 0 && rest.length === 0;

  return (
    <main>
      <Container size="2xl" pad="page">
        <Reveal direction="up">
          <Section>
            <Row between gap={3}>
              <Stack gap={2} maxWidth="prose">
                <Eyebrow>Odds intelligence</Eyebrow>
                <Heading level={1} size="4xl" weight="bold">
                  Compare the books.
                </Heading>
                <Muted>
                  Live moneyline, spread, and totals across major sportsbooks — sourced from The
                  Odds API. Best price per row is highlighted; line movement plotted from the
                  captured snapshot history.
                </Muted>
              </Stack>
              <Row gap={2}>
                {liveSnapshots ? (
                  <Badge tone="green" dot>
                    Live · {lastCapturedAt ? relTime(lastCapturedAt) : 'now'}
                  </Badge>
                ) : (
                  <Badge tone="mute" dot>
                    {totalEvents} events
                  </Badge>
                )}
                <Button variant="secondary" iconLeft="calendar" onClick={() => navigate('/events')}>
                  Today&apos;s events
                </Button>
              </Row>
            </Row>
          </Section>
        </Reveal>

        <Section>
          <FilterChips
            options={SPORT_FILTERS}
            value={sport}
            onChange={setSport}
            allLabel="All sports"
          />
        </Section>

        {isLoading && (
          <Section>
            <EmptyState icon="chart" title="Loading events…" />
          </Section>
        )}

        {!isLoading && filteredEmpty && (
          <Section>
            <EmptyState
              icon="calendar"
              title="Nothing on the slate."
              subtitle="No events scheduled for this filter — try a different sport or check back when tonight's slate is loaded."
            />
          </Section>
        )}

        {active && (
          <Section eyebrow="Now showing" title={active.title ?? `${active.home} vs ${active.away}`}>
            <div ref={featuredRef}>
              <Stack gap={4}>
                <Card>
                  <CardHead
                    title={
                      <>
                        {active.home} <Muted>vs</Muted> {active.away}
                      </>
                    }
                    sub={
                      <>
                        <Mono>{active.time}</Mono>
                        {' · '}
                        {active.sport}
                        {' · '}
                        {active.league}
                      </>
                    }
                    action={
                      snapshots !== undefined && snapshots.length > 0 ? (
                        <Badge tone="green" dot>
                          {books.length} books · {snapshots.length} snaps
                        </Badge>
                      ) : (
                        <Badge tone="mute">No odds yet</Badge>
                      )
                    }
                  />
                  {snapshots === undefined ? (
                    <EmptyState icon="chart" title="Loading odds…" />
                  ) : snapshots.length === 0 ? (
                    <EmptyState
                      icon="chart"
                      title="No odds captured yet."
                      subtitle="Set ODDS_SNAPSHOTS_ENABLED=true in Convex env and run pollOddsSnapshots to start collecting lines for this event."
                    />
                  ) : (
                    <OddsGrid books={books} rows={rows} highlightBest />
                  )}
                </Card>

                {homeMoneylineHistory && homeMoneylineHistory.length > 1 && (
                  <Card>
                    <CardHead
                      title="Line movement"
                      sub={
                        <>
                          {active.home} moneyline · {snapshots?.[0]?.bookTitle ?? 'first book'}
                        </>
                      }
                      action={
                        <Badge
                          tone={
                            lineDelta.dir === 'up'
                              ? 'green'
                              : lineDelta.dir === 'down'
                                ? 'red'
                                : 'mute'
                          }
                        >
                          {lineDelta.dir === 'up' ? '▲' : lineDelta.dir === 'down' ? '▼' : '—'}{' '}
                          {lineDelta.value}
                        </Badge>
                      }
                    />
                    <Row between>
                      <Stack gap={1}>
                        <Muted>{homeMoneylineHistory.length} snapshots over time</Muted>
                        <Mono>
                          first{' '}
                          {fmtOdds(homeMoneylineHistory[homeMoneylineHistory.length - 1]!.price)} ·
                          latest {fmtOdds(homeMoneylineHistory[0]!.price)}
                        </Mono>
                      </Stack>
                      <Sparkline
                        values={homeMoneylineHistory
                          .slice()
                          .reverse()
                          .map((h) => h.price)}
                        color={lineDelta.dir === 'down' ? 'var(--red)' : 'var(--green)'}
                        width={280}
                        height={56}
                      />
                    </Row>
                  </Card>
                )}
              </Stack>
            </div>
          </Section>
        )}

        {live.length > 0 && (
          <Section eyebrow="Live now" title="In progress.">
            <Grid cols={2} gap={4}>
              {live.map((ev) => {
                const { homeLogo, awayLogo } = logoFor(ev);
                return (
                  <EventCard
                    key={ev._id}
                    sport={ev.sport}
                    league={ev.league}
                    time={ev.gameStatus ?? ev.time}
                    home={ev.home}
                    away={ev.away}
                    homeLogo={homeLogo}
                    awayLogo={awayLogo}
                    creators={ev.creatorCount}
                    picks={ev.pickCount}
                    sourceType={ev.sourceType}
                    live
                    onClick={() => focusFeatured(ev._id)}
                  />
                );
              })}
            </Grid>
          </Section>
        )}

        {featured.length > 0 && (
          <Section eyebrow="Featured" title="Marquee matchups.">
            <Grid cols={2} gap={4}>
              {featured.map((ev) => {
                const { homeLogo, awayLogo } = logoFor(ev);
                return (
                  <EventCard
                    featured
                    key={ev._id}
                    sport={ev.sport}
                    league={ev.league}
                    time={ev.time}
                    home={ev.home}
                    away={ev.away}
                    homeLogo={homeLogo}
                    awayLogo={awayLogo}
                    creators={ev.creatorCount}
                    picks={ev.pickCount}
                    sourceType={ev.sourceType}
                    onClick={() => focusFeatured(ev._id)}
                  />
                );
              })}
            </Grid>
          </Section>
        )}

        {Object.entries(byLeague).map(([league, events]) => {
          const isExpanded = expandedLeagues.has(league);
          const visible = isExpanded ? events : events.slice(0, INITIAL_PER_LEAGUE);
          const hasMore = events.length > INITIAL_PER_LEAGUE;
          const sport0 = events[0]?.sport ?? '';

          return (
            <Section
              key={league}
              eyebrow={league}
              title={`${events.length} ${events.length === 1 ? 'match' : 'matches'} scheduled.`}
              action={
                <Badge tone="blue" icon={<Icon name={sportIcon(sport0)} size={12} />}>
                  League
                </Badge>
              }
            >
              <Stack gap={4}>
                <Grid cols={2} gap={4}>
                  {visible.map((ev) => {
                    const { homeLogo, awayLogo } = logoFor(ev);
                    return (
                      <EventCard
                        key={ev._id}
                        sport={ev.sport}
                        league={ev.league}
                        time={ev.time}
                        home={ev.home}
                        away={ev.away}
                        homeLogo={homeLogo}
                        awayLogo={awayLogo}
                        creators={ev.creatorCount}
                        picks={ev.pickCount}
                        sourceType={ev.sourceType}
                        compact
                        onClick={() => focusFeatured(ev._id)}
                      />
                    );
                  })}
                </Grid>
                {hasMore && (
                  <Button
                    variant="outline"
                    block
                    iconRight={isExpanded ? 'arrow-up' : 'arrow-down'}
                    onClick={() => toggleLeague(league)}
                  >
                    {isExpanded
                      ? `Show fewer ${league} matches`
                      : `Show ${events.length - INITIAL_PER_LEAGUE} more ${league} matches`}
                  </Button>
                )}
              </Stack>
            </Section>
          );
        })}

        {recent.length > 0 && !sport && (
          <Section eyebrow="Recently concluded" title="Final scores.">
            <Grid cols={2} gap={4}>
              {recent.map((ev) => {
                const { homeLogo, awayLogo } = logoFor(ev);
                return (
                  <EventCard
                    key={ev._id}
                    sport={ev.sport}
                    league={ev.league}
                    time={ev.gameStatus ?? 'Final'}
                    home={ev.home}
                    away={ev.away}
                    homeLogo={homeLogo}
                    awayLogo={awayLogo}
                    creators={ev.creatorCount}
                    picks={ev.pickCount}
                    sourceType={ev.sourceType}
                    compact
                    onClick={() => focusFeatured(ev._id)}
                  />
                );
              })}
            </Grid>
          </Section>
        )}
      </Container>
    </main>
  );
}
