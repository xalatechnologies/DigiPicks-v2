import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Card,
  Button,
  Tabs,
  Search,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  SportTag,
  EventSourceBadge,
  Badge,
  Mono,
  Muted,
  FilterChips,
  TitleSub,
  EmptyState,
  StudioPageHeader,
  StudioRefineCard,
  type EventSourceType,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { STUDIO } from '../../lib/studioRoutes';

const SPORTS = [
  'Soccer',
  'Cricket',
  'Tennis',
  'Basketball',
  'Football',
  'Hockey',
  'Baseball',
  'MMA',
  'Rugby',
];

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending review', value: 'creator_submitted' },
  { label: 'Approved', value: 'admin_verified' },
  { label: 'Rejected', value: 'unverified' },
];

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function verificationBadge(status: string | undefined) {
  if (status === 'admin_verified' || status === 'source_verified') {
    return (
      <Badge tone="green" dot>
        Approved
      </Badge>
    );
  }
  if (status === 'creator_submitted') {
    return (
      <Badge tone="amber" dot>
        Pending
      </Badge>
    );
  }
  if (status === 'unverified') {
    return (
      <Badge tone="red" dot>
        Rejected
      </Badge>
    );
  }
  return <Badge tone="mute">{status ?? '—'}</Badge>;
}

export function MyEvents() {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState('all');
  const [sport, setSport] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');

  const events = useQuery(api.events.byCreator, { limit: 100 });

  const filtered = (events ?? []).filter((e) => {
    if (tab !== 'all' && e.verificationStatus !== tab) return false;
    if (sport && e.sport !== sport) return false;
    if (query) {
      const q = query.toLowerCase();
      const title = (e.title ?? `${e.home} vs ${e.away}`).toLowerCase();
      if (!title.includes(q) && !e.league.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Events"
          title="Custom events"
          sub="Events you've authored — pending review, approved, and rejected. Approved events surface on the public feed and can be linked from picks."
          actions={
            <Button variant="primary" iconLeft="plus" onClick={() => navigate(STUDIO.createEvent)}>
              Create event
            </Button>
          }
        />

        <StudioRefineCard
          title="Refine events"
          sub="Filter by verification status, sport, or search."
          summary={`${filtered.length} event${filtered.length === 1 ? '' : 's'}`}
          onReset={
            tab !== 'all' || sport || query
              ? () => {
                  setTab('all');
                  setSport(null);
                  setQuery('');
                }
              : undefined
          }
        >
          <Stack gap={3}>
            <Tabs tabs={TABS} value={tab} onChange={setTab} ariaLabel="Event verification status" />
            <Search
              placeholder="Search events"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search events"
            />
            <FilterChips options={SPORTS} value={sport} onChange={setSport} allLabel="All sports" />
          </Stack>
        </StudioRefineCard>

        {events === undefined ? (
          <Card pad="sm">
            <EmptyState icon="calendar" title="Loading events…" />
          </Card>
        ) : filtered.length === 0 ? (
          <Card pad="sm">
            <EmptyState
              icon="calendar"
              title={
                events.length === 0
                  ? "You haven't created any events yet."
                  : 'No events match those filters.'
              }
              subtitle={
                events.length === 0
                  ? "Add a local match, tournament, or livestream event the providers don't cover."
                  : 'Try a different tab or sport — or create a new event.'
              }
              action={
                <Button
                  variant="primary"
                  iconLeft="plus"
                  onClick={() => navigate(STUDIO.createEvent)}
                >
                  Create event
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
                  <Th>League</Th>
                  <Th>Source</Th>
                  <Th>Starts</Th>
                  <Th>Status</Th>
                  <Th>Review</Th>
                </Tr>
              </THead>
              <TBody>
                {filtered.map((e) => (
                  <Tr key={e._id}>
                    <Td>
                      <TitleSub title={e.title ?? `${e.home} vs ${e.away}`} sub={e.time} />
                    </Td>
                    <Td>
                      <SportTag sport={e.sport} />
                    </Td>
                    <Td>{e.league}</Td>
                    <Td>
                      <EventSourceBadge source={(e.sourceType ?? 'creator') as EventSourceType} />
                    </Td>
                    <Td>
                      <Muted>{formatDate(e.startsAt)}</Muted>
                    </Td>
                    <Td>
                      <Mono>{e.status}</Mono>
                    </Td>
                    <Td>{verificationBadge(e.verificationStatus)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
