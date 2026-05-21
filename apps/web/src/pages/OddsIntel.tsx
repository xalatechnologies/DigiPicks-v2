import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Grid,
  Card,
  CardHead,
  Button,
  Badge,
  Icon,
  type IconName,
  Mono,
  Muted,
  Heading,
  EventCard,
  EmptyState,
  FilterChips,
  OddsGrid,
  Sparkline,
  OddsIntelDirectoryHero,
  type OddsBook,
  type OddsRow,
} from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';
import type { Doc, Id } from '../../../../convex/_generated/dataModel';
import { teamLogo } from '../lib/teamLogo';

type OddsSnapshot = Doc<'oddsSnapshots'>;
type EventDoc = Doc<'events'>;

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

function matchesSearch(ev: EventDoc, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    ev.home.toLowerCase().includes(needle) ||
    ev.away.toLowerCase().includes(needle) ||
    ev.league.toLowerCase().includes(needle) ||
    ev.sport.toLowerCase().includes(needle) ||
    (ev.title?.toLowerCase().includes(needle) ?? false)
  );
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
  const [sport, setSport] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<Id<'events'> | null>(null);
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

  const applySearch = (list: EventDoc[]) => {
    const q = search.trim();
    if (!q) return list;
    return list.filter((e) => matchesSearch(e, q));
  };

  const featured = useMemo(
    () => applySearch((featuredEvents ?? []).filter((e) => !sport || e.sport === sport)),
    [featuredEvents, sport, search],
  );
  const live = useMemo(
    () => applySearch((liveEvents ?? []).filter((e) => !sport || e.sport === sport)),
    [liveEvents, sport, search],
  );
  const rest = useMemo(() => {
    const base = (allEvents ?? []).filter(
      (e) =>
        !featured.some((f) => f._id === e._id) &&
        !live.some((l) => l._id === e._id) &&
        (!sport || e.sport === sport),
    );
    return applySearch(base);
  }, [allEvents, featured, live, sport, search]);
  const recent = useMemo(() => applySearch(recentEvents ?? []), [recentEvents, search]);

  React.useEffect(() => {
    const candidates = [...live, ...featured, ...rest];
    if (candidates.length === 0) return;
    if (!activeId || !candidates.some((e) => e._id === activeId)) {
      setActiveId(candidates[0]!._id);
    }
  }, [activeId, live, featured, rest]);

  const active =
    [...(allEvents ?? []), ...(recentEvents ?? [])].find((e) => e._id === activeId) ?? null;

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
        <Stack gap={8}>
          <OddsIntelDirectoryHero
            subtitle="Live moneyline, spread, and totals across major sportsbooks — sourced from The Odds API. Best price per row is highlighted; line movement plotted from the captured snapshot history."
            searchValue={search}
            onSearchChange={setSearch}
            filters={
              <FilterChips
                options={SPORT_FILTERS}
                value={sport}
                onChange={setSport}
                allLabel="All sports"
              />
            }
            headAside={
              <>
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
              </>
            }
          />

          {isLoading && <EmptyState icon="chart" title="Loading events…" />}

          {!isLoading && filteredEmpty && (
            <EmptyState
              icon="calendar"
              title="Nothing on the slate."
              subtitle="No events scheduled for this filter — try a different sport, clear search, or check back when tonight's slate is loaded."
              action={
                search.trim() || sport ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSport(null);
                      setSearch('');
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          )}

          {active && (
            <Stack gap={4}>
              <Heading level={2} size="2xl">
                {active.title ?? `${active.home} vs ${active.away}`}
              </Heading>
              <Muted>Now showing · compare lines across books</Muted>
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
                      <Stack gap={3}>
                        <Muted>{homeMoneylineHistory.length} snapshots over time</Muted>
                        <Mono>
                          first{' '}
                          {fmtOdds(homeMoneylineHistory[homeMoneylineHistory.length - 1]!.price)} ·
                          latest {fmtOdds(homeMoneylineHistory[0]!.price)}
                        </Mono>
                        <Sparkline
                          values={homeMoneylineHistory
                            .slice()
                            .reverse()
                            .map((h) => h.price)}
                          color={lineDelta.dir === 'down' ? 'var(--red)' : 'var(--green)'}
                          width={280}
                          height={56}
                        />
                      </Stack>
                    </Card>
                  )}
                </Stack>
              </div>
            </Stack>
          )}

          {live.length > 0 && (
            <Stack gap={4}>
              <Heading level={2} size="2xl">
                Live now
              </Heading>
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
            </Stack>
          )}

          {featured.length > 0 && (
            <Stack gap={4}>
              <Heading level={2} size="2xl">
                Marquee matchups
              </Heading>
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
            </Stack>
          )}

          {Object.entries(byLeague).map(([league, events]) => {
            const isExpanded = expandedLeagues.has(league);
            const visible = isExpanded ? events : events.slice(0, INITIAL_PER_LEAGUE);
            const hasMore = events.length > INITIAL_PER_LEAGUE;
            const sport0 = events[0]?.sport ?? '';

            return (
              <Stack key={league} gap={4}>
                <Row between>
                  <Stack gap={1}>
                    <Heading level={2} size="2xl">
                      {league}
                    </Heading>
                    <Muted>
                      {events.length} {events.length === 1 ? 'match' : 'matches'} scheduled
                    </Muted>
                  </Stack>
                  <Badge tone="blue" icon={<Icon name={sportIcon(sport0)} size={12} />}>
                    League
                  </Badge>
                </Row>
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
            );
          })}

          {recent.length > 0 && !sport && (
            <Stack gap={4}>
              <Heading level={2} size="2xl">
                Final scores
              </Heading>
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
            </Stack>
          )}
        </Stack>
      </Container>
    </main>
  );
}
