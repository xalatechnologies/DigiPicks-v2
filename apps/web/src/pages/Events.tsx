import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import {
  Container,
  Section,
  Row,
  Stack,
  Grid,
  Button,
  Badge,
  Icon,
  type IconName,
  Eyebrow,
  Heading,
  Muted,
  EventCard,
  EmptyState,
  FilterChips,
  Reveal,
  ResponsibleSection,
} from '@digipicks/ds';
import { teamLogo } from '../lib/teamLogo';

const SPORT_FILTERS = [
  { label: 'Soccer', value: 'Soccer', icon: <Icon name="soccer" size={14} /> },
  { label: 'Cricket', value: 'Cricket', icon: <Icon name="cricket" size={14} /> },
  { label: 'Tennis', value: 'Tennis', icon: <Icon name="tennis" size={14} /> },
];

const INITIAL_PER_LEAGUE = 6;

/** Map a sport name to a DS icon. Falls back to a calendar glyph for unknowns. */
function sportIcon(sport: string): IconName {
  const key = sport.toLowerCase();
  if (key === 'soccer') return 'soccer';
  if (key === 'cricket') return 'cricket';
  if (key === 'tennis') return 'tennis';
  return 'calendar';
}

export function Events() {
  const navigate = useNavigate();
  const [sport, setSport] = useState<string | null>(null);
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());

  const allEvents = useQuery(api.events.today, sport ? { sport } : {});
  const featuredEvents = useQuery(api.events.featured, {});
  const liveEvents = useQuery(api.events.live, {});
  const recentEvents = useQuery(api.events.recent, {});
  const creators = useQuery(api.creators.list, { verified: true });

  const featured = (featuredEvents ?? []).filter((e) => !sport || e.sport === sport);
  const live = (liveEvents ?? []).filter((e) => !sport || e.sport === sport);
  const rest = (allEvents ?? []).filter(
    (e) => !featured.some((f) => f._id === e._id) && !live.some((l) => l._id === e._id),
  );
  const recent = recentEvents ?? [];

  const avatars = (creators ?? []).slice(0, 4).map((c) => ({
    mono: c.avatarMono,
    color: c.avatarColor,
  }));

  // Group remaining events by league
  const byLeague = rest.reduce<Record<string, typeof rest>>((acc, ev) => {
    (acc[ev.league] ??= []).push(ev);
    return acc;
  }, {});

  const totalEvents = (allEvents ?? []).length;
  const heroFeatured = featured[0];
  const otherFeatured = featured.slice(1);

  // Prefer the backend-resolved logo URLs (downloaded into Convex storage
  // by `internal.teamLogos.resolveOne`) and fall back to the synchronous
  // hand-curated mapping for teams that haven't been resolved yet.
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

  const isLoading = allEvents === undefined;
  const filteredEmpty =
    allEvents !== undefined && featured.length === 0 && live.length === 0 && rest.length === 0;

  return (
    <main>
      <Container size="xl" pad="page">
        <Reveal direction="up">
          <Section>
            <Row between gap={3}>
              <Stack gap={2} maxWidth="prose">
                <Eyebrow>Events</Eyebrow>
                <Heading level={1} size="4xl" weight="bold">
                  Every game on the board.
                </Heading>
                <Muted>
                  Live and upcoming events across Soccer, Cricket, and Tennis — with creator
                  coverage.
                </Muted>
              </Stack>
              <Row gap={2}>
                <Badge tone="blue" dot>
                  {totalEvents} events
                </Badge>
                <Button
                  variant="primary"
                  iconRight="arrow-right"
                  onClick={() => navigate('/apply')}
                >
                  Get started
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
            <EmptyState icon="calendar" title="Loading events…" />
          </Section>
        )}

        {!isLoading && filteredEmpty && (
          <Section>
            <EmptyState
              icon="calendar"
              title="Nothing on the slate."
              subtitle="No events scheduled for this filter."
            />
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
                  />
                );
              })}
            </Grid>
          </Section>
        )}

        {heroFeatured && (
          <Section eyebrow="Featured" title="Marquee matchups.">
            <Stack gap={4}>
              <EventCard
                featured
                key={heroFeatured._id}
                sport={heroFeatured.sport}
                league={heroFeatured.league}
                time={heroFeatured.time}
                home={heroFeatured.home}
                away={heroFeatured.away}
                homeLogo={logoFor(heroFeatured).homeLogo}
                awayLogo={logoFor(heroFeatured).awayLogo}
                creators={heroFeatured.creatorCount}
                picks={heroFeatured.pickCount}
                sourceType={heroFeatured.sourceType}
                creatorsAvatars={avatars}
              />
              {otherFeatured.length > 0 && (
                <Grid cols={2} gap={4}>
                  {otherFeatured.map((ev) => {
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
                        creatorsAvatars={avatars}
                      />
                    );
                  })}
                </Grid>
              )}
            </Stack>
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
                  />
                );
              })}
            </Grid>
          </Section>
        )}

        <ResponsibleSection />
      </Container>
    </main>
  );
}
