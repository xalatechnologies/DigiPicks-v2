import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import {
  PageHeader,
  PageHead,
  Container,
  Stack,
  Row,
  Grid,
  Badge,
  Button,
  Icon,
  Search,
  Select,
  FilterChips,
  CreatorCard,
  EmptyState,
} from '@digipicks/ds';

const SPORT_FILTERS = [
  { label: 'Soccer', value: 'Soccer', icon: <Icon name="soccer" size={14} /> },
  { label: 'Cricket', value: 'Cricket', icon: <Icon name="cricket" size={14} /> },
  { label: 'Tennis', value: 'Tennis', icon: <Icon name="tennis" size={14} /> },
];

const SORT_OPTIONS = [
  { label: 'Win rate', value: 'winRate' },
  { label: 'Subscribers', value: 'subs' },
  { label: 'Price (low)', value: 'priceLow' },
  { label: 'Net units', value: 'units' },
];

export function Discover() {
  const navigate = useNavigate();
  const creators = useQuery(api.creators.list, {});
  const [sport, setSport] = useState<string | null>(null);
  const [sort, setSort] = useState('winRate');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = creators ?? [];

    if (sport) {
      list = list.filter((c) =>
        c.sports.some((s: string) => s.toLowerCase().includes(sport.toLowerCase())),
      );
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

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'winRate':
          return b.winRate - a.winRate;
        case 'subs':
          return b.subscriberCount - a.subscriberCount;
        case 'priceLow':
          return a.startingPrice - b.startingPrice;
        case 'units':
          return parseFloat(b.units) - parseFloat(a.units);
        default:
          return 0;
      }
    });

    return list;
  }, [creators, sport, search, sort]);

  const total = (creators ?? []).length;
  const isLoading = creators === undefined;

  return (
    <>
      <PageHeader
        title="Discover"
        crumbs={[{ label: 'Account' }, { label: 'Discover' }]}
        actions={
          <Row gap={2}>
            <Badge tone="blue" dot>
              {total} creators
            </Badge>
            <Button
              variant="primary"
              size="sm"
              iconRight="arrow-right"
              onClick={() => navigate('/apply')}
            >
              Apply as creator
            </Button>
          </Row>
        }
      />

      <Container size="2xl">
        <Stack gap={6}>
          <PageHead
            eyebrow="Discover"
            title="Find your next edge"
            sub={
              isLoading
                ? 'Loading creators across every sport on the platform…'
                : `${filtered.length} of ${total} creators · sorted by ${SORT_OPTIONS.find((o) => o.value === sort)?.label?.toLowerCase() ?? 'default'}`
            }
          />

          <Row gap={3} wrap>
            <FilterChips
              options={SPORT_FILTERS}
              value={sport}
              onChange={setSport}
              allLabel="All sports"
            />
            <Search
              placeholder="Search creators…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort creators"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Row>

          {isLoading && <EmptyState icon="compass" title="Loading creators…" />}

          {!isLoading && filtered.length === 0 && (
            <EmptyState
              icon="search"
              title="No creators match your filters."
              subtitle="Try adjusting your search or sport filter."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSport(null);
                    setSearch('');
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          )}

          {!isLoading && filtered.length > 0 && (
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
          )}
        </Stack>
      </Container>
    </>
  );
}
