import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import {
  Container,
  Section,
  PageHead,
  Row,
  Stack,
  Grid,
  Button,
  Badge,
  Icon,
  EventCard,
  FeaturedEventCard,
  FilterChips,
  ResponsibleSection,
} from '@digipicks/ds';

const SPORT_FILTERS = [
  { label: 'Soccer', value: 'Soccer' },
  { label: 'Cricket', value: 'Cricket' },
  { label: 'Tennis', value: 'Tennis' },
];

const INITIAL_FEATURED = 3;
const INITIAL_PER_LEAGUE = 6;

export function Events() {
  const navigate = useNavigate();
  const [sport, setSport] = useState<string | null>(null);
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());

  const allEvents = useQuery(api.events.today, sport ? { sport } : {});
  const featuredEvents = useQuery(api.events.featured, {});
  const recentEvents = useQuery(api.events.recent, {});
  const creators = useQuery(api.creators.list, { verified: true });

  const featured = (featuredEvents ?? []).filter(
    (e) => !sport || e.sport === sport,
  );
  const rest = (allEvents ?? []).filter(
    (e) => !featured.some((f) => f._id === e._id),
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
  const visibleFeatured = showAllFeatured ? featured : featured.slice(0, INITIAL_FEATURED);

  const toggleLeague = (league: string) => {
    setExpandedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(league)) next.delete(league);
      else next.add(league);
      return next;
    });
  };

  return (
    <main>
      <Container size="xl">
        <PageHead
          eyebrow="Events"
          title="Every game on the board."
          sub="Live and upcoming events across Soccer, Cricket, and Tennis — with creator coverage."
          actions={
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
          }
        />

        <Section>
          <FilterChips
            options={SPORT_FILTERS}
            value={sport}
            onChange={setSport}
            allLabel="All sports"
          />
        </Section>

        {visibleFeatured.length > 0 && (
          <Section eyebrow="Featured" title="Marquee matchups.">
            <Stack gap={4}>
              {visibleFeatured.map((ev) => (
                <FeaturedEventCard
                  key={ev._id}
                  sport={ev.sport}
                  league={ev.league}
                  time={ev.time}
                  home={ev.home}
                  away={ev.away}
                  creators={ev.creatorCount}
                  picks={ev.pickCount}
                  creatorsAvatars={avatars}
                />
              ))}
            </Stack>
            {featured.length > INITIAL_FEATURED && !showAllFeatured && (
              <Row gap={2}>
                <Button variant="outline" onClick={() => setShowAllFeatured(true)}>
                  Show {featured.length - INITIAL_FEATURED} more
                </Button>
              </Row>
            )}
          </Section>
        )}

        {Object.entries(byLeague).map(([league, events]) => {
          const isExpanded = expandedLeagues.has(league);
          const visible = isExpanded ? events : events.slice(0, INITIAL_PER_LEAGUE);
          const hasMore = events.length > INITIAL_PER_LEAGUE;

          return (
            <Section
              key={league}
              eyebrow={league}
              title={`${events.length} ${events.length === 1 ? 'match' : 'matches'} scheduled.`}
            >
              <Grid cols={3} gap={4}>
                {visible.map((ev) => (
                  <EventCard
                    key={ev._id}
                    sport={ev.sport}
                    league={ev.league}
                    time={ev.time}
                    home={ev.home}
                    away={ev.away}
                    creators={ev.creatorCount}
                    picks={ev.pickCount}
                    compact
                  />
                ))}
              </Grid>
              {hasMore && !isExpanded && (
                <Row gap={2}>
                  <Button variant="outline" onClick={() => toggleLeague(league)}>
                    Show {events.length - INITIAL_PER_LEAGUE} more
                  </Button>
                </Row>
              )}
            </Section>
          );
        })}

        {recent.length > 0 && !sport && (
          <Section
            eyebrow="Recently concluded"
            title="Final scores."
          >
            <Grid cols={3} gap={4}>
              {recent.map((ev) => (
                <EventCard
                  key={ev._id}
                  sport={ev.sport}
                  league={ev.league}
                  time={ev.gameStatus ?? 'Final'}
                  home={ev.home}
                  away={ev.away}
                  creators={ev.creatorCount}
                  picks={ev.pickCount}
                  compact
                />
              ))}
            </Grid>
          </Section>
        )}

        <ResponsibleSection />
      </Container>
    </main>
  );
}
