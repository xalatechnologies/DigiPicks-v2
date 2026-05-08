import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Topbar,
  Container,
  Stack,
  Row,
  Col,
  Card,
  CardHead,
  Button,
  Icon,
  Field,
  Input,
  Select,
  TextArea,
  Segmented,
  PickCard,
  PageHead,
  Breadcrumb,
  Muted,
  Eyebrow,
  Divider,
} from '@digipicks/ds';
import { CREATORS, SPORTS, creatorById } from '../data/mock';

type PickAccess = 'free' | 'premium' | 'vip';

const ACCESS_OPTIONS = [
  { label: 'Free', value: 'free' },
  { label: 'Premium', value: 'premium' },
  { label: 'VIP', value: 'vip' },
];

const CONFIDENCE_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function CreatePick() {
  const navigate = useNavigate();

  const [sport, setSport] = React.useState('NBA');
  const [market, setMarket] = React.useState('1H Over/Under');
  const [selection, setSelection] = React.useState('Over 112.5');
  const [odds, setOdds] = React.useState('-110');
  const [units, setUnits] = React.useState('2u');
  const [confidence, setConfidence] = React.useState('high');
  const [title, setTitle] = React.useState(
    'Lakers vs Nuggets — First Half Total Over 112.5',
  );
  const [body, setBody] = React.useState(
    'Both teams hovering 53–55% pace tier vs quality defenses. Denver on a back-to-back, Murray played 38 minutes Thursday.\n\nLakers 6-1 on H1 over at home this season when line sits 110.5–113.5.',
  );
  const [access, setAccess] = React.useState<PickAccess>('premium');

  const me = creatorById('courtvision') ?? CREATORS[0];

  return (
    <>
      <Topbar
        title="Create pick"
        crumb={
          <Breadcrumb
            items={[
              { label: 'Studio' },
              { label: 'Posts & Picks' },
              { label: 'New' },
            ]}
          />
        }
        actions={
          <Row gap={2}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/picks')}>
              Cancel
            </Button>
            <Button variant="outline" size="sm">
              Save draft
            </Button>
            <Button variant="primary" size="sm">
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
                      <Field label="Market">
                        <Select value={market} onChange={(e) => setMarket(e.target.value)}>
                          <option>1H Over/Under</option>
                          <option>Spread</option>
                          <option>Moneyline</option>
                          <option>Player Prop</option>
                          <option>Goalscorer</option>
                          <option>Goalie Saves O/U</option>
                        </Select>
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
                      onChange={(e) => setConfidence(e.target.value)}
                    >
                      {CONFIDENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </Field>

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
                creatorName={me.name}
                creatorHandle={me.handle}
                creatorMono={me.avatar.mono}
                creatorColor={me.avatar.color}
                creatorVerified={me.verified}
                access={access}
                sport={sport}
                event="Lakers vs Nuggets"
                eventTime="Tonight 7:30 PM ET"
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
