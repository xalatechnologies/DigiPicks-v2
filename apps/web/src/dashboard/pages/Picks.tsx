import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
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
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

const SPORTS = ['Soccer', 'Cricket', 'Tennis'];

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
];

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function Picks() {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState('all');
  const [sport, setSport] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');

  const me = useQuery(api.users.meSafe);
  const creator = useQuery(
    api.creators.get,
    me?.creatorId ? { id: me.creatorId } : 'skip',
  );
  const picks = useQuery(
    api.picks.byCreator,
    creator?._id ? { creatorId: creator._id, limit: 100 } : 'skip',
  );

  const filtered = (picks ?? []).filter((p) => {
    if (tab !== 'all' && p.status !== tab) return false;
    if (sport && p.sport !== sport) return false;
    if (query) {
      const q = query.toLowerCase();
      if (
        !p.title.toLowerCase().includes(q) &&
        !p.market.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
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

          {picks === undefined ? (
            <Card pad="sm">
              <EmptyState icon="inbox" title="Loading picks…" />
            </Card>
          ) : filtered.length === 0 ? (
            <Card pad="sm">
              <EmptyState
                icon="inbox"
                title="No picks match those filters."
                subtitle="Try a different tab or sport — or publish a new pick."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/dashboard/create')}
                  >
                    <Icon name="plus" size={13} />
                    Create pick
                  </Button>
                }
              />
            </Card>
          ) : (
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
                    <Th>Status</Th>
                    <Th>Grade</Th>
                  </Tr>
                </THead>
                <TBody>
                  {filtered.map((p) => (
                    <Tr key={p._id}>
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
                        <Muted>{formatDate(p.createdAt)}</Muted>
                      </Td>
                      <Td>
                        <Mono>{p.status}</Mono>
                      </Td>
                      <Td>
                        <GradeBadge grade={p.grade ?? 'pending'} />
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}
        </Stack>
      </Container>
    </>
  );
}
