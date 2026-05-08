import React from 'react';
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
  EventCard,
  FeaturedEventCard,
  ResponsibleSection,
} from '@digipicks/ds';

export function Events() {
  const navigate = useNavigate();
  const allEvents = useQuery(api.events.today, {});
  const featuredEvents = useQuery(api.events.featured, {});
  const creators = useQuery(api.creators.list, { verified: true });

  const featured = featuredEvents ?? [];
  const rest = (allEvents ?? []).filter(
    (e) => !featured.some((f) => f._id === e._id),
  );

  const avatars = (creators ?? []).slice(0, 4).map((c) => ({
    mono: c.avatarMono,
    color: c.avatarColor,
  }));

  return (
    <main>
      <Container size="xl">
        <PageHead
          eyebrow="Today's slate"
          title="Every game on the board, every pick that matters."
          sub="Tonight's events with creator coverage and pick volume — pre-game only, graded by the platform."
          actions={
            <Row gap={2}>
              <Button variant="outline" onClick={() => navigate('/creators')}>
                Browse creators
              </Button>
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

        {featured.length > 0 && (
          <Section eyebrow="Featured tonight" title="Marquee matchups.">
            <Stack gap={4}>
              {featured.map((ev) => (
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
          </Section>
        )}

        <Section
          eyebrow="The rest of the slate"
          title="All other games tonight."
          sub="Click any event to see every pick from every creator covering it."
        >
          <Grid cols={3} gap={4}>
            {rest.map((ev) => (
              <EventCard
                key={ev._id}
                sport={ev.sport}
                league={ev.league}
                time={ev.time}
                home={ev.home}
                away={ev.away}
                creators={ev.creatorCount}
                picks={ev.pickCount}
              />
            ))}
          </Grid>
        </Section>

        <ResponsibleSection />
      </Container>
    </main>
  );
}
