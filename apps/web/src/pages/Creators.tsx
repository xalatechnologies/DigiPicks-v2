import React, { useState, useMemo } from 'react';
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
  Search,
  FilterChips,
  CreatorCard,
  ResponsibleSection,
} from '@digipicks/ds';

const SPORT_FILTERS = [
  { label: 'Soccer', value: 'Soccer', icon: <Icon name="soccer" size={14} /> },
  { label: 'Cricket', value: 'Cricket', icon: <Icon name="cricket" size={14} /> },
  { label: 'Tennis', value: 'Tennis', icon: <Icon name="tennis" size={14} /> },
];

const SORT_OPTIONS = [
  { label: 'Win Rate', value: 'winRate' },
  { label: 'Subscribers', value: 'subs' },
  { label: 'Price', value: 'price' },
  { label: 'Units', value: 'units' },
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
      list = list.filter((c) => c.sports.some((s: string) => s.toLowerCase().includes(sport.toLowerCase())));
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
    // Sort
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'winRate': return b.winRate - a.winRate;
        case 'subs': return b.subscriberCount - a.subscriberCount;
        case 'price': return a.startingPrice - b.startingPrice;
        case 'units': return parseFloat(b.units) - parseFloat(a.units);
        default: return 0;
      }
    });
    return list;
  }, [creators, sport, search, sort]);

  const total = (creators ?? []).length;

  return (
    <main>
      <Container size="xl">
        <PageHead
          eyebrow="The network"
          title="Verified creators."
          sub="Browse by sport, niche, win rate, or price — every record graded by the platform."
          actions={
            <Row gap={2}>
              <Badge tone="blue" dot>
                {total} creators
              </Badge>
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
          <Row gap={4}>
            <FilterChips
              options={SPORT_FILTERS}
              value={sport}
              onChange={setSport}
              allLabel="All sports"
            />
            <FilterChips
              options={SORT_OPTIONS}
              value={sort}
              onChange={setSort}
              allLabel="Default"
            />
            <Search
              placeholder="Search creators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Row>
        </Section>

        <Section
          eyebrow={sport ?? 'All creators'}
          title={`${filtered.length} ${filtered.length === 1 ? 'creator' : 'creators'} found.`}
        >
          <Grid cols={2} gap={5}>
            {filtered.map((c) => (
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
        </Section>

        <ResponsibleSection />
      </Container>
    </main>
  );
}
