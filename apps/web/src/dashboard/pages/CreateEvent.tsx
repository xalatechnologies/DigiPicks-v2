import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Col,
  Card,
  CardHead,
  Button,
  StudioPageHeader,
  QuickActionGrid,
  EventCard,
  EventForm,
  EventSourceBadge,
  Muted,
  Eyebrow,
  Badge,
  type EventFormValue,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { studioCrossLinks } from '../../lib/studioCrossLinks';

const SPORTS = [
  'Soccer',
  'Cricket',
  'Tennis',
  'Basketball',
  'Football',
  'Tennis',
  'Hockey',
  'Baseball',
  'MMA',
  'Rugby',
];

const INITIAL_VALUE: EventFormValue = {
  sport: 'Soccer',
  league: '',
  home: '',
  away: '',
  time: '',
  startsAt: 0,
  title: '',
  sourceUrl: '',
  visibility: 'public',
};

export function CreateEvent() {
  const navigate = useNavigate();

  const me = useQuery(api.users.meSafe);
  const creator = useQuery(api.creators.get, me?.creatorId ? { id: me.creatorId } : 'skip');
  const createEvent = useMutation(api.events.createByCreator);

  const [value, setValue] = React.useState<EventFormValue>(INITIAL_VALUE);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const canSubmit =
    value.sport.length > 0 &&
    value.league.length > 0 &&
    value.home.length > 0 &&
    value.away.length > 0 &&
    value.time.length > 0 &&
    value.startsAt > 0;

  async function handleSubmit() {
    if (!canSubmit) {
      setError('Fill sport, league, both participants, start time, and display time.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createEvent({
        sport: value.sport,
        league: value.league,
        home: value.home,
        away: value.away,
        time: value.time,
        startsAt: value.startsAt,
        title: value.title || undefined,
        sourceUrl: value.sourceUrl || undefined,
        visibility: value.visibility,
      });
      navigate('/dashboard/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save event.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container size="xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Events"
          title="Add a custom event"
          sub="Create local matches, tournaments, or livestream events. Submitted events go through admin review before they surface on the public feed."
          actions={
            <Row gap={2}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/dashboard/events')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || !canSubmit || !creator}
              >
                Submit for review
              </Button>
            </Row>
          }
        />

        {error && (
          <Card>
            <Row gap={3}>
              <Badge tone="red" dot>
                Error
              </Badge>
              <Muted>{error}</Muted>
            </Row>
          </Card>
        )}

        <Row gap={5} wrap>
          <Col gap={4}>
            <Card>
              <CardHead title="Event details" sub="Source, participants, and visibility" />
              <EventForm value={value} onChange={setValue} sports={SPORTS} disabled={submitting} />
            </Card>
          </Col>

          <Col gap={4}>
            <Stack gap={2}>
              <Eyebrow>Live preview</Eyebrow>
              <Muted>
                This is roughly how the event will appear to subscribers once an admin approves it.
              </Muted>
            </Stack>

            <EventCard
              sport={value.sport || 'Sport'}
              league={value.league}
              home={value.home || 'Home'}
              away={value.away || 'Away'}
              time={value.time || 'TBD'}
              sourceType="creator"
            />

            <Stack gap={2}>
              <Eyebrow>Review status</Eyebrow>
              <Row gap={2}>
                <Badge tone="amber" dot>
                  Pending review
                </Badge>
                <EventSourceBadge source="creator" />
              </Row>
              <Muted>
                After submission, an admin will verify the event before it surfaces publicly. You'll
                see it in your "My Events" list with status updates.
              </Muted>
            </Stack>
          </Col>
        </Row>

        <QuickActionGrid title="Related" items={studioCrossLinks('createEvent', navigate)} />
      </Stack>
    </Container>
  );
}
