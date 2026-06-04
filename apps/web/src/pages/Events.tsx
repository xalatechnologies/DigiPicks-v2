import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Doc, Id } from '../../../../convex/_generated/dataModel';
import {
  Container,
  Stack,
  Grid,
  Spacer,
  Button,
  Icon,
  EmptyState,
  FilterChips,
  Heading,
  Search,
  StudioPageHeader,
  AccountRefineCard,
  StudioFilterPills,
  StudioDashLayout,
  StudioDashCol,
  CreatorProfileStickyAside,
  EventsDirectoryHero,
  EventsLiveStrip,
  EventMarqueeCard,
  EventScheduleRow,
  EventsPickHighlight,
  EventsCreatorSpotlight,
  CreatorsHorizontalRail,
  CreatorsHorizontalRailItem,
} from '@digipicks/ds';
import { teamLogo } from '../lib/teamLogo';
import { accountLayoutPaths, type LayoutContext } from '../lib/accountLayoutPaths';
import { ACCOUNT } from '../lib/accountRoutes';

type EventDoc = Doc<'events'>;

export interface EventsProps {
  layoutContext?: LayoutContext;
}

const SPORT_FILTERS = [
  { label: 'Soccer', value: 'Soccer', icon: <Icon name="soccer" size={14} /> },
  { label: 'Cricket', value: 'Cricket', icon: <Icon name="cricket" size={14} /> },
  { label: 'Tennis', value: 'Tennis', icon: <Icon name="tennis" size={14} /> },
];

const VIEW_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Featured', value: 'featured' },
  { label: 'Live now', value: 'live' },
  { label: 'Starting soon', value: 'soon' },
  { label: 'Today', value: 'today' },
];

const SOON_MS = 3 * 60 * 60 * 1000;

function logoFor(ev: Pick<EventDoc, 'sport' | 'home' | 'away' | 'homeLogo' | 'awayLogo'>) {
  return {
    homeLogo: ev.homeLogo ?? teamLogo(ev.sport, ev.home),
    awayLogo: ev.awayLogo ?? teamLogo(ev.sport, ev.away),
  };
}

function scoreDisplay(ev: EventDoc): string | undefined {
  if (ev.awayScore != null && ev.homeScore != null) {
    return `${ev.awayScore} - ${ev.homeScore}`;
  }
  return undefined;
}

function stripLabel(ev: EventDoc): string {
  const away = ev.away.slice(0, 3).toUpperCase();
  const home = ev.home.slice(0, 3).toUpperCase();
  return `${away} vs ${home}`;
}

function stripStatus(ev: EventDoc): { status: string; live?: boolean } {
  if (ev.status === 'live') {
    return { status: ev.gameStatus ?? 'Live', live: true };
  }
  if (ev.status === 'completed') return { status: 'Final' };
  return { status: ev.time };
}

function matchesSearch(ev: EventDoc, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    ev.home.toLowerCase().includes(needle) ||
    ev.away.toLowerCase().includes(needle) ||
    ev.league.toLowerCase().includes(needle) ||
    ev.sport.toLowerCase().includes(needle)
  );
}

function filterByView(list: EventDoc[], view: string, featuredIds: Set<Id<'events'>>): EventDoc[] {
  const now = Date.now();
  switch (view) {
    case 'featured':
      return list.filter((e) => featuredIds.has(e._id) || e.featured);
    case 'live':
      return list.filter((e) => e.status === 'live');
    case 'soon':
      return list.filter(
        (e) =>
          e.status === 'upcoming' &&
          e.startsAt != null &&
          e.startsAt > now &&
          e.startsAt - now <= SOON_MS,
      );
    case 'today':
    case 'all':
    default:
      return list;
  }
}

function groupBySport(events: EventDoc[]): { sport: string; events: EventDoc[] }[] {
  const map = new Map<string, EventDoc[]>();
  for (const ev of events) {
    const bucket = map.get(ev.sport) ?? [];
    bucket.push(ev);
    map.set(ev.sport, bucket);
  }
  return [...map.entries()]
    .map(([sport, list]) => ({ sport, events: list }))
    .sort((a, b) => b.events.length - a.events.length);
}

export function Events({ layoutContext = 'public' }: EventsProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useConvexAuth();
  const paths = accountLayoutPaths(layoutContext);
  const isAccount = layoutContext === 'account';
  const [sport, setSport] = useState<string | null>(null);
  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<Id<'events'> | null>(null);

  React.useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (highlight) {
      setSelectedId(highlight as Id<'events'>);
    }
  }, [searchParams]);

  const allEvents = useQuery(api.events.today, sport ? { sport } : {});
  const featuredEvents = useQuery(api.events.featured, {});
  const liveEvents = useQuery(api.events.live, {});
  const recentEvents = useQuery(api.events.recent, {});
  const creators = useQuery(api.creators.list, { verified: true });
  const picks = useQuery(api.picks.feed, { limit: 24 });

  const featured = useMemo(
    () => (featuredEvents ?? []).filter((e) => !sport || e.sport === sport),
    [featuredEvents, sport],
  );
  const live = useMemo(
    () => (liveEvents ?? []).filter((e) => !sport || e.sport === sport),
    [liveEvents, sport],
  );
  const recent = useMemo(
    () => (recentEvents ?? []).filter((e) => !sport || e.sport === sport),
    [recentEvents, sport],
  );

  const featuredIds = useMemo(() => new Set(featured.map((e) => e._id)), [featured]);

  const pool = useMemo(() => {
    const base = allEvents ?? [];
    const merged = [
      ...live,
      ...featured.filter((f) => !live.some((l) => l._id === f._id)),
      ...base.filter(
        (e) => !live.some((l) => l._id === e._id) && !featured.some((f) => f._id === e._id),
      ),
    ];
    let list = filterByView(merged, view, featuredIds);
    if (search.trim()) list = list.filter((e) => matchesSearch(e, search.trim()));
    return list;
  }, [allEvents, live, featured, view, featuredIds, search]);

  const avatars = (creators ?? []).slice(0, 4).map((c) => ({
    mono: c.avatarMono,
    color: c.avatarColor,
  }));

  const stripItems = useMemo(() => {
    const stripPool = [...live, ...(allEvents ?? []).filter((e) => e.status === 'upcoming')];
    const seen = new Set<string>();
    const items: { id: string; label: string; status: string; live?: boolean; ev: EventDoc }[] = [];
    for (const ev of stripPool) {
      if (seen.has(ev._id)) continue;
      seen.add(ev._id);
      const { status, live: isLive } = stripStatus(ev);
      items.push({
        id: ev._id,
        label: stripLabel(ev),
        status,
        live: isLive,
        ev,
      });
      if (items.length >= 6) break;
    }
    return items;
  }, [live, allEvents]);

  const marqueeFeatured = featured.slice(0, 2);

  const sportSections = useMemo(() => {
    const rest = pool.filter((e) => !marqueeFeatured.some((f) => f._id === e._id));
    return groupBySport(rest);
  }, [pool, marqueeFeatured]);

  const selectedEvent = useMemo(() => {
    if (selectedId) {
      const hit =
        pool.find((e) => e._id === selectedId) ??
        live.find((e) => e._id === selectedId) ??
        featured.find((e) => e._id === selectedId);
      if (hit) return hit;
    }
    return marqueeFeatured[0] ?? live[0] ?? pool[0];
  }, [selectedId, pool, live, featured, marqueeFeatured]);

  const highlightPick = useMemo(() => {
    if (!selectedEvent || !picks) return picks?.[0];
    const match = picks.find(
      (p) =>
        p.eventName?.includes(selectedEvent.home) ||
        p.eventName?.includes(selectedEvent.away) ||
        p.sport === selectedEvent.sport,
    );
    return match ?? picks[0];
  }, [picks, selectedEvent]);

  const highlightCreator = useMemo(() => {
    if (!highlightPick) return creators?.[0];
    return (creators ?? []).find((c) => c._id === highlightPick.creatorId);
  }, [highlightPick, creators]);

  const creatorsToday = useMemo(() => {
    const sportsToday = new Set((allEvents ?? []).map((e) => e.sport));
    return (creators ?? [])
      .filter((c) => c.sports.some((s) => sportsToday.has(s)))
      .sort((a, b) => b.subscriberCount - a.subscriberCount)
      .slice(0, 4)
      .map((c) => ({
        ...c,
        eventsToday: (allEvents ?? []).filter((e) => c.sports.includes(e.sport)).length,
      }));
  }, [creators, allEvents]);

  const isLoading = allEvents === undefined;
  const filteredEmpty =
    !isLoading && pool.length === 0 && live.length === 0 && marqueeFeatured.length === 0;

  const selectEvent = (id: Id<'events'>) => setSelectedId(id);

  const hasActiveFilters = Boolean(sport || search.trim() || view !== 'all');

  function clearEventFilters() {
    setSport(null);
    setSearch('');
    setView('all');
  }

  return (
    <main>
      <Container size="2xl" pad={isAccount ? 'none' : 'page'}>
        <Stack gap={isAccount ? 6 : 8}>
          {isAccount ? (
            <>
              <StudioPageHeader
                eyebrow="Account · Events"
                title="Today's events"
                sub="Live slate, featured matchups, and creator picks for tonight."
                actions={
                  <Button variant="outline" onClick={() => navigate(paths.feed)}>
                    Dashboard
                  </Button>
                }
              />
              <AccountRefineCard
                sub="Search the slate, then filter by view and sport."
                summary={
                  isLoading
                    ? 'Loading events…'
                    : filteredEmpty
                      ? 'No events match'
                      : `${pool.length} event${pool.length === 1 ? '' : 's'} in view`
                }
                onReset={hasActiveFilters ? clearEventFilters : undefined}
              >
                <Search
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search teams, leagues, or sports"
                  aria-label="Search events"
                />
                <StudioFilterPills
                  options={VIEW_FILTERS}
                  value={view}
                  onChange={setView}
                  ariaLabel="Filter events by view"
                  nowrap
                />
                <FilterChips
                  options={SPORT_FILTERS}
                  value={sport}
                  onChange={setSport}
                  allLabel="All sports"
                />
              </AccountRefineCard>
            </>
          ) : (
            <>
              <EventsDirectoryHero
                searchValue={search}
                onSearchChange={setSearch}
                filterOptions={VIEW_FILTERS}
                filterValue={view}
                onFilterChange={setView}
                secondaryFilters={
                  <FilterChips
                    options={SPORT_FILTERS}
                    value={sport}
                    onChange={setSport}
                    allLabel="All sports"
                  />
                }
              />
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  iconRight="arrow-right"
                  onClick={() => navigate(ACCOUNT.events)}
                >
                  View in account
                </Button>
              ) : null}
            </>
          )}

          {stripItems.length > 0 ? (
            <EventsLiveStrip
              items={stripItems.map((item) => ({
                id: item.id,
                label: item.label,
                status: item.status,
                live: item.live,
                onClick: () => selectEvent(item.ev._id),
              }))}
            />
          ) : null}

          <StudioDashLayout>
            <StudioDashCol span={highlightPick && highlightCreator ? 10 : 12}>
              <Stack gap={10}>
                {isLoading ? (
                  <EmptyState icon="calendar" title="Loading events…" />
                ) : filteredEmpty ? (
                  <EmptyState
                    icon="calendar"
                    title="Nothing on the slate."
                    subtitle="No events match this filter. Try another sport or clear your search."
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSport(null);
                          setSearch('');
                          setView('all');
                        }}
                      >
                        Clear filters
                      </Button>
                    }
                  />
                ) : (
                  <>
                    {marqueeFeatured.length > 0 ? (
                      <Stack gap={4}>
                        <Heading level={2} size="2xl">
                          Featured matchups
                        </Heading>
                        <Grid cols={2} gap={6} stagger={false}>
                          {marqueeFeatured.map((ev) => {
                            const logos = logoFor(ev);
                            const score = scoreDisplay(ev);
                            return (
                              <EventMarqueeCard
                                key={ev._id}
                                sport={ev.sport}
                                league={ev.league}
                                home={ev.home}
                                away={ev.away}
                                homeLogo={logos.homeLogo}
                                awayLogo={logos.awayLogo}
                                timeLabel={ev.status === 'live' ? 'Live now' : ev.time}
                                live={ev.status === 'live'}
                                scoreDisplay={score}
                                clockLabel={ev.gameStatus ?? (score ? undefined : ev.time)}
                                creators={ev.creatorCount}
                                picks={ev.pickCount}
                                creatorsAvatars={avatars}
                                onClick={() => selectEvent(ev._id)}
                                onViewPicks={() => navigate(paths.feed)}
                              />
                            );
                          })}
                        </Grid>
                      </Stack>
                    ) : null}

                    {sportSections.map(({ sport: sectionSport, events }) => (
                      <Stack key={sectionSport} gap={4}>
                        <Heading level={2} size="lg">
                          {sectionSport}
                        </Heading>
                        <Grid cols={3} gap={4} stagger={false}>
                          {events.map((ev) => {
                            const logos = logoFor(ev);
                            const score = scoreDisplay(ev);
                            const picksActive =
                              ev.pickCount > 0 ? `${ev.pickCount} active` : undefined;
                            return (
                              <EventScheduleRow
                                key={ev._id}
                                dense
                                time={ev.time}
                                away={ev.away}
                                home={ev.home}
                                awayLogo={logos.awayLogo}
                                homeLogo={logos.homeLogo}
                                live={ev.status === 'live'}
                                scoreDisplay={score}
                                coverageLabel={
                                  ev.creatorCount > 0 ? `${ev.creatorCount} experts` : undefined
                                }
                                picksLabel={picksActive}
                                selected={selectedEvent?._id === ev._id}
                                onClick={() => selectEvent(ev._id)}
                              />
                            );
                          })}
                        </Grid>
                      </Stack>
                    ))}
                  </>
                )}

                {recent.length > 0 && !sport && view === 'all' ? (
                  <Stack gap={4}>
                    <Heading level={2} size="lg">
                      Recently concluded
                    </Heading>
                    <Grid cols={3} gap={4} stagger={false}>
                      {recent.map((ev) => {
                        const logos = logoFor(ev);
                        return (
                          <EventScheduleRow
                            key={ev._id}
                            dense
                            time="Final"
                            away={ev.away}
                            home={ev.home}
                            awayLogo={logos.awayLogo}
                            homeLogo={logos.homeLogo}
                            scoreDisplay={scoreDisplay(ev)}
                            coverageLabel={
                              ev.creatorCount > 0 ? `${ev.creatorCount} experts` : undefined
                            }
                            onClick={() => selectEvent(ev._id)}
                          />
                        );
                      })}
                    </Grid>
                  </Stack>
                ) : null}
              </Stack>
            </StudioDashCol>

            {highlightPick && highlightCreator ? (
              <StudioDashCol span={2}>
                <CreatorProfileStickyAside>
                  <EventsPickHighlight
                    creatorName={`@${highlightCreator.handle}`}
                    creatorSub={`${highlightCreator.name} · ${Math.round(highlightCreator.winRate <= 1 ? highlightCreator.winRate * 100 : highlightCreator.winRate)}% win rate`}
                    avatarMono={highlightCreator.avatarMono}
                    avatarColor={highlightCreator.avatarColor}
                    insight={
                      highlightPick.aiSummary ??
                      highlightPick.teaser ??
                      highlightPick.body ??
                      'Premium analysis available for this matchup.'
                    }
                    pickLabel={`${highlightPick.selection} · ${highlightPick.market}`}
                    pickOdds={highlightPick.odds}
                    consensusPercent={highlightPick.aiConfidence ?? 65}
                    consensusCaption={
                      highlightPick.aiConfidence != null
                        ? `${Math.round(highlightPick.aiConfidence)}% model confidence on this angle`
                        : undefined
                    }
                    onCta={() => navigate(paths.feed)}
                  />
                </CreatorProfileStickyAside>
              </StudioDashCol>
            ) : null}
          </StudioDashLayout>

          {creatorsToday.length > 0 ? (
            <CreatorsHorizontalRail title="Today's top creators">
              {creatorsToday.map((c) => (
                <CreatorsHorizontalRailItem key={c._id}>
                  <EventsCreatorSpotlight
                    name={c.name}
                    handle={c.handle}
                    mono={c.avatarMono}
                    color={c.avatarColor}
                    verified={c.verified}
                    tags={c.sports.slice(0, 2)}
                    eventsToday={c.eventsToday}
                    onClick={() => navigate(`/creators/${c.handle}`)}
                  />
                </CreatorsHorizontalRailItem>
              ))}
            </CreatorsHorizontalRail>
          ) : null}

          <Spacer />
        </Stack>
      </Container>
    </main>
  );
}
