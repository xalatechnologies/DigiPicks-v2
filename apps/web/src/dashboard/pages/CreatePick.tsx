import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Col,
  Card,
  CardHead,
  Button,
  Field,
  Input,
  Select,
  TextArea,
  Segmented,
  PickCard,
  PageHead,
  Muted,
  Eyebrow,
  Divider,
  Badge,
  AIAssistPanel,
  type AISuggestion,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

const SPORTS = ['Soccer', 'Cricket', 'Tennis'];

type PickAccess = 'free' | 'premium' | 'vip';
type PickConfidence = 'Low' | 'Medium' | 'High';

const ACCESS_OPTIONS: { label: string; value: PickAccess }[] = [
  { label: 'Free', value: 'free' },
  { label: 'Premium', value: 'premium' },
  { label: 'VIP', value: 'vip' },
];

const CONFIDENCE_OPTIONS: { value: PickConfidence; label: string }[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

const MARKET_OPTIONS = [
  '1H Over/Under',
  'Spread',
  'Moneyline',
  'Player Prop',
  'Goalscorer',
  'Goalie Saves O/U',
];

export function CreatePick() {
  const navigate = useNavigate();

  const me = useQuery(api.users.meSafe);
  const creator = useQuery(
    api.creators.get,
    me?.creatorId ? { id: me.creatorId } : 'skip',
  );
  const createPick = useMutation(api.picks.create);

  const [sport, setSport] = React.useState('Soccer');
  const [league, setLeague] = React.useState('Premier League');
  const [eventName, setEventName] = React.useState('Arsenal vs Chelsea');
  const [eventTime, setEventTime] = React.useState('Saturday 3:00 PM');
  const [market, setMarket] = React.useState('1H Over/Under');
  const [selection, setSelection] = React.useState('Over 112.5');
  const [odds, setOdds] = React.useState('-110');
  const [units, setUnits] = React.useState('2u');
  const [confidence, setConfidence] = React.useState<PickConfidence>('High');
  const [title, setTitle] = React.useState(
    'Lakers vs Nuggets — First Half Total Over 112.5',
  );
  const [body, setBody] = React.useState(
    'Both teams hovering 53–55% pace tier vs quality defenses. Denver on a back-to-back, Murray played 38 minutes Thursday.\n\nLakers 6-1 on H1 over at home this season when line sits 110.5–113.5.',
  );
  const [access, setAccess] = React.useState<PickAccess>('premium');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const suggestPick = useAction(api.ai.suggestPick);
  const [aiSuggestion, setAiSuggestion] = React.useState<AISuggestion | null>(null);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);

  async function handleSuggest() {
    setAiError(null);
    setAiBusy(true);
    try {
      const result = await suggestPick({
        sport,
        league,
        eventName,
        market,
        selection,
        odds,
        units,
        body: body || undefined,
      });
      setAiSuggestion({
        summary: result.summary,
        confidence: result.confidence,
        reasoning: result.reasoning,
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Suggest failed.');
    } finally {
      setAiBusy(false);
    }
  }

  function handleAccept(s: AISuggestion) {
    // Pre-fill summary into title (or body if title already set) and body
    // with the reasoning. Confidence maps to creator confidence buckets.
    if (!body) setBody(s.reasoning);
    setConfidence(
      s.confidence >= 75 ? 'High' : s.confidence >= 50 ? 'Medium' : 'Low',
    );
    setAiSuggestion(null);
  }

  async function handleSubmit(status: 'draft' | 'published') {
    if (!creator?._id) {
      setError('No creator profile is attached to your account yet.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createPick({
        creatorId: creator._id,
        access,
        sport,
        league,
        eventName,
        eventTime,
        title,
        market,
        selection,
        odds,
        units,
        confidence,
        body: body || undefined,
        status,
      });
      navigate('/dashboard/picks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save pick.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Create pick"
        crumbs={[
          { label: 'Studio' },
          { label: 'Posts & Picks' },
          { label: 'New' },
        ]}
        actions={
          <Row gap={2}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/dashboard/picks')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit('draft')}
              disabled={submitting || !creator}
            >
              Save draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSubmit('published')}
              disabled={submitting || !creator}
            >
              Publish now
            </Button>
          </Row>
        }
      />

      <Container size="xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="New post"
            title="Create a pick"
            sub="Compose, attach analysis, set access — preview live as you write."
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
                <CardHead title="Pick details" sub="The matchup and the wager" />
                <Stack gap={4}>
                  <Field label="Title" required>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="A short, scannable headline"
                    />
                  </Field>

                  <Row gap={3} wrap>
                    <Col gap={0}>
                      <Field label="Sport">
                        <Select value={sport} onChange={(e) => setSport(e.target.value)}>
                          {SPORTS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </Col>
                    <Col gap={0}>
                      <Field label="League">
                        <Input
                          value={league}
                          onChange={(e) => setLeague(e.target.value)}
                          placeholder="e.g. EPL"
                        />
                      </Field>
                    </Col>
                    <Col gap={0}>
                      <Field label="Market">
                        <Select value={market} onChange={(e) => setMarket(e.target.value)}>
                          {MARKET_OPTIONS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </Col>
                  </Row>

                  <Row gap={3} wrap>
                    <Col gap={0}>
                      <Field label="Event" required>
                        <Input
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          placeholder="Lakers vs Nuggets"
                        />
                      </Field>
                    </Col>
                    <Col gap={0}>
                      <Field label="Event time">
                        <Input
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          placeholder="Tonight 7:30 PM ET"
                        />
                      </Field>
                    </Col>
                  </Row>

                  <Row gap={3} wrap>
                    <Col gap={0}>
                      <Field label="Selection" required>
                        <Input
                          value={selection}
                          onChange={(e) => setSelection(e.target.value)}
                          placeholder="e.g. Over 112.5"
                        />
                      </Field>
                    </Col>
                    <Col gap={0}>
                      <Field label="Odds">
                        <Input
                          value={odds}
                          onChange={(e) => setOdds(e.target.value)}
                          placeholder="-110"
                        />
                      </Field>
                    </Col>
                    <Col gap={0}>
                      <Field label="Units">
                        <Input
                          value={units}
                          onChange={(e) => setUnits(e.target.value)}
                          placeholder="2u"
                        />
                      </Field>
                    </Col>
                  </Row>

                  <Field label="Confidence">
                    <Select
                      value={confidence}
                      onChange={(e) => setConfidence(e.target.value as PickConfidence)}
                    >
                      {CONFIDENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <AIAssistPanel
                    suggestion={aiSuggestion}
                    busy={aiBusy}
                    error={aiError}
                    onSuggest={handleSuggest}
                    onAccept={handleAccept}
                    onDismiss={() => setAiSuggestion(null)}
                  />

                  <Field
                    label="Analysis"
                    help="Reasoning subscribers see — markdown supported."
                  >
                    <TextArea
                      rows={6}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </Field>

                  <Divider />

                  <Field
                    label="Access"
                    help="Free picks are public. Premium and VIP require an active plan."
                  >
                    <Segmented
                      options={ACCESS_OPTIONS}
                      value={access}
                      onChange={(v) => setAccess(v as PickAccess)}
                      ariaLabel="Access level"
                    />
                  </Field>
                </Stack>
              </Card>
            </Col>

            <Col gap={4}>
              <Stack gap={2}>
                <Eyebrow>Live preview</Eyebrow>
                <Muted>This is what subscribers will see in their feed.</Muted>
              </Stack>

              <PickCard
                creatorName={creator?.name ?? me?.name ?? 'You'}
                creatorHandle={creator?.handle ?? ''}
                creatorMono={creator?.avatarMono ?? ''}
                creatorColor={creator?.avatarColor ?? ''}
                creatorVerified={creator?.verified ?? false}
                access={access}
                sport={sport}
                event={eventName}
                eventTime={eventTime}
                posted="just now"
                title={title || 'Untitled pick'}
                market={market}
                selection={selection || '—'}
                odds={odds || '—'}
                units={units || '—'}
                body={body}
                status="pending"
              />
            </Col>
          </Row>
        </Stack>
      </Container>
    </>
  );
}
