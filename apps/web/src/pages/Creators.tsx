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
  Search,
  CreatorCard,
  ResponsibleSection,
} from '@digipicks/ds';

export function Creators() {
  const navigate = useNavigate();
  const creators = useQuery(api.creators.list, {});

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
              {(creators ?? []).map((c) => (
                <CreatorCard
                  key={c._id}
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
              ))}
            </Grid>
          </Stack>
        </Section>

        <ResponsibleSection />
      </Container>
    </main>
  );
}
