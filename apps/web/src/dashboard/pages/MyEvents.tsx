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
  EventSourceBadge,
  Badge,
  Mono,
  Muted,
  PageHead,
  FilterChips,
  TitleSub,
  EmptyState,
  type EventSourceType,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

const SPORTS = ['Soccer', 'Cricket', 'Tennis', 'Basketball', 'Football', 'Hockey', 'Baseball', 'MMA', 'Rugby'];

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
    return <Badge tone="green" dot>Approved</Badge>;
  }
  if (status === 'creator_submitted') {
    return <Badge tone="amber" dot>Pending</Badge>;
  }
  if (status === 'unverified') {
    return <Badge tone="red" dot>Rejected</Badge>;
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
    <>
      <PageHeader
        title="My Events"
        crumbs={[{ label: 'Studio' }, { label: 'My Events' }]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard/events/new')}
          >
            <Icon name="plus" size={13} />
            Create event
          </Button>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Studio"
            title="Custom events"
            sub="Events you've authored — including pending review, approved, and rejected entries. Approved events surface on the public /events feed and can be linked from your picks."
            actions={
              <Row gap={2}>
                <Button variant="secondary" size="sm">
                  <Icon name="filter" size={13} />
                  Filters
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/dashboard/events/new')}
                >
                  <Icon name="plus" size={13} />
                  Create event
                </Button>
              </Row>
            }
          />

          <Row gap={3} between wrap>
            <Tabs
              tabs={TABS}
              value={tab}
              onChange={setTab}
              ariaLabel="Event verification status"
            />
            <Search
              placeholder="Search events"
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
                    ? 'Add a local match, tournament, or livestream event the providers don\'t cover.'
                    : 'Try a different tab or sport — or create a new event.'
                }
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/dashboard/events/new')}
                  >
                    <Icon name="plus" size={13} />
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
                        <TitleSub
                          title={e.title ?? `${e.home} vs ${e.away}`}
                          sub={e.time}
                        />
                      </Td>
                      <Td>
                        <SportTag sport={e.sport} />
                      </Td>
                      <Td>{e.league}</Td>
                      <Td>
                        <EventSourceBadge
                          source={(e.sourceType ?? 'creator') as EventSourceType}
                        />
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
    </>
  );
}
