import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Card,
  Button,
  Icon,
  Tabs,
  Search,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  SportTag,
  AccessBadge,
  GradeBadge,
  Mono,
  Muted,
  PageHead,
  FilterChips,
  TitleSub,
} from '@digipicks/ds';
import { STUDIO_PICKS, SPORTS } from '../data/studio';

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
];

export function Picks() {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState('all');
  const [sport, setSport] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');

  const filtered = STUDIO_PICKS.filter((p) => {
    if (tab === 'all') {
      // include all
    } else if (tab === 'published') {
      if (!['win', 'loss', 'push', 'pending'].includes(p.status)) return false;
    } else if (tab === 'draft') {
      if (p.status !== 'draft') return false;
    } else if (tab === 'scheduled') {
      if (p.status !== 'scheduled') return false;
    }
    if (sport && p.sport !== sport) return false;
    if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Posts & Picks"
        crumbs={[{ label: 'Studio' }, { label: 'Posts & Picks' }]}
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/create')}>
            <Icon name="plus" size={13} />
            Create pick
          </Button>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Studio"
            title="All posts"
            sub="Drafts, scheduled, published, and graded picks — manage your full publishing pipeline."
            actions={
              <Row gap={2}>
                <Button variant="secondary" size="sm">
                  <Icon name="filter" size={13} />
                  Filters
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/create')}>
                  <Icon name="plus" size={13} />
                  Create pick
                </Button>
              </Row>
            }
          />

          <Row gap={3} between wrap>
            <Tabs tabs={TABS} value={tab} onChange={setTab} ariaLabel="Pick status" />
            <Search
              placeholder="Search picks"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Row>

          <FilterChips
            options={SPORTS}
            value={sport}
            onChange={setSport}
            allLabel="All sports"
          />

          <Card pad="sm">
            <Table>
              <THead>
                <Tr>
                  <Th>Title</Th>
                  <Th>Sport</Th>
                  <Th>Market</Th>
                  <Th>Access</Th>
                  <Th numeric>Stake</Th>
                  <Th numeric>Odds</Th>
                  <Th>Date</Th>
                  <Th numeric>Views</Th>
                  <Th numeric>Saves</Th>
                  <Th>Status</Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <TitleSub title={p.title} sub={p.market} />
                    </Td>
                    <Td>
                      <SportTag sport={p.sport} />
                    </Td>
                    <Td>{p.market}</Td>
                    <Td>
                      <AccessBadge access={p.access} />
                    </Td>
                    <Td numeric>
                      <Mono>{p.units}</Mono>
                    </Td>
                    <Td numeric>
                      <Mono>{p.odds}</Mono>
                    </Td>
                    <Td>
                      <Muted>{p.date}</Muted>
                    </Td>
                    <Td numeric>
                      <Mono>{p.views ? p.views.toLocaleString() : '—'}</Mono>
                    </Td>
                    <Td numeric>
                      <Mono>{p.saves ? p.saves.toLocaleString() : '—'}</Mono>
                    </Td>
                    <Td>
                      <GradeBadge grade={p.status} />
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>

          {filtered.length === 0 && <Muted>No picks match those filters.</Muted>}
        </Stack>
      </Container>
    </>
  );
}
