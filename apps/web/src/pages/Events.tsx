import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Section,
  PageHead,
  Row,
  Stack,
  Spacer,
  Grid,
  Button,
  Icon,
  EventCard,
  FeaturedEventCard,
  ResponsibleNote,
} from '@digipicks/ds';
import { CREATORS, EVENTS_TODAY } from '@/data/mock';

export function Events() {
  const navigate = useNavigate();
  const featured = EVENTS_TODAY.filter((e) => e.featured);
  const rest = EVENTS_TODAY.filter((e) => !e.featured);

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
              <Button variant="primary" onClick={() => navigate('/apply')}>
                Get started
                <Icon name="arrow-right" size={13} />
              </Button>
            </Row>
          }
        />

        {featured.length > 0 && (
          <Section eyebrow="Featured tonight" title="Marquee matchups.">
            <Stack gap={4}>
              {featured.map((ev) => (
                <FeaturedEventCard
                  key={ev.id}
                  sport={ev.sport}
                  league={ev.league}
                  time={ev.time}
                  home={ev.home}
                  away={ev.away}
                  creators={ev.creators}
                  picks={ev.picks}
                  creatorsAvatars={CREATORS.slice(0, 4).map((c) => ({
                    mono: c.avatar.mono,
                    color: c.avatar.color,
                  }))}
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
                key={ev.id}
                sport={ev.sport}
                league={ev.league}
                time={ev.time}
                home={ev.home}
                away={ev.away}
                creators={ev.creators}
                picks={ev.picks}
              />
            ))}
          </Grid>
        </Section>

        <Section>
          <ResponsibleNote />
          <Spacer />
        </Section>
      </Container>
    </main>
  );
}
