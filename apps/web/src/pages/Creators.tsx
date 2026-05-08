import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Section,
  PageHead,
  Row,
  Stack,
  Grid,
  Button,
  Search,
  CreatorCard,
  ResponsibleSection,
} from '@digipicks/ds';
import { CREATORS } from '@/data/mock';

export function Creators() {
  const navigate = useNavigate();

  return (
    <main>
      <Container size="xl">
        <PageHead
          eyebrow="The network"
          title="Verified creators."
          sub="Browse by sport, niche, win rate, or price — every record graded by the platform."
          actions={
            <Row gap={2}>
              <Button variant="outline" onClick={() => navigate('/events')}>
                Tonight's events
              </Button>
              <Button
                variant="primary"
                iconRight="arrow-right"
                onClick={() => navigate('/apply')}
              >
                Apply as a creator
              </Button>
            </Row>
          }
        />

        <Section>
          <Stack gap={5}>
            <Search placeholder="Search creators by name, handle, sport, or niche..." />

            <Grid cols={2} gap={5}>
              {CREATORS.map((c) => (
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
          </Stack>
        </Section>

        <ResponsibleSection />
      </Container>
    </main>
  );
}
