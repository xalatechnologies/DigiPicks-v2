import React from 'react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Col,
  Card,
  CardHead,
  Button,
  Icon,
  PageHead,
  Field,
  Input,
  TextArea,
  Select,
  Muted,
  KV,
  Mono,
  Divider,
  SwitchRow,
} from '@digipicks/ds';

const NICHE_OPTIONS = [
  'NBA Player Props',
  'NFL Sides & Totals',
  'Cross-sport Props',
  'Soccer & Tennis',
];

interface NotificationToggle {
  id: 'pickAlerts' | 'billingAlerts' | 'growthAlerts';
  label: string;
  sub: string;
}

const NOTIFICATIONS: NotificationToggle[] = [
  {
    id: 'pickAlerts',
    label: 'Pick alerts',
    sub: 'When a pick auto-grades or hits cutoff',
  },
  {
    id: 'billingAlerts',
    label: 'Billing alerts',
    sub: 'Failed payments, refunds, payout updates',
  },
  {
    id: 'growthAlerts',
    label: 'Growth opportunities',
    sub: 'Weekly digest of new growth ideas',
  },
];

export function Settings() {
  const [name, setName] = React.useState('CourtVision Pro');
  const [handle, setHandle] = React.useState('@courtvisionpro');
  const [bio, setBio] = React.useState(
    'Player props specialist. Pace and matchup-driven. Pre-game only, no live bets.',
  );
  const [toggles, setToggles] = React.useState<Record<NotificationToggle['id'], boolean>>({
    pickAlerts: true,
    billingAlerts: true,
    growthAlerts: false,
  });

  const setToggle = (id: NotificationToggle['id']) => (next: boolean) => {
    setToggles((prev) => ({ ...prev, [id]: next }));
  };

  return (
    <>
      <PageHeader
        title="Settings"
        crumbs={[{ label: 'Account' }, { label: 'Settings' }]}
        actions={
          <Button variant="primary" size="sm">
            <Icon name="check" size={13} />
            Save changes
          </Button>
        }
      />

      <Container size="xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Account"
            title="Settings"
            sub="Public profile, payout details, and notification preferences."
          />

          <Row gap={5} wrap>
            <Col gap={4}>
              <Card>
                <CardHead title="Public profile" sub="What subscribers see on your creator page" />
                <Stack gap={4}>
                  <Field label="Display name" required>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Handle">
                    <Input value={handle} onChange={(e) => setHandle(e.target.value)} />
                  </Field>
                  <Field label="Bio" help="Up to 280 characters.">
                    <TextArea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
                  </Field>
                  <Field label="Niche">
                    <Select defaultValue="NBA Player Props">
                      {NICHE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </Stack>
              </Card>

              <Card>
                <CardHead title="Notifications" sub="Where to send alerts about activity in your studio" />
                <Stack gap={3}>
                  {NOTIFICATIONS.map((n, i) => (
                    <React.Fragment key={n.id}>
                      {i > 0 && <Divider />}
                      <SwitchRow
                        label={n.label}
                        sub={n.sub}
                        checked={toggles[n.id]}
                        onChange={setToggle(n.id)}
                      />
                    </React.Fragment>
                  ))}
                </Stack>
              </Card>
            </Col>

            <Col gap={4}>
              <Card>
                <CardHead title="Payout" sub="Current default destination" />
                <Stack gap={2}>
                  <KV k="Bank" v="Chase Business Checking" />
                  <KV k="Account" v={<Mono>•••• 4391</Mono>} />
                  <KV k="Schedule" v="1st of each month" />
                  <Row gap={2}>
                    <Button variant="secondary" size="sm">
                      Change method
                    </Button>
                  </Row>
                </Stack>
              </Card>

              <Card>
                <CardHead title="Verification" sub="Your platform status" />
                <Stack gap={2}>
                  <KV k="Identity" v="Verified · Apr 2024" />
                  <KV k="Track record" v="Verified · 2 years public log" />
                  <KV k="Content review" v="Approved" />
                </Stack>
              </Card>

              <Card>
                <CardHead title="Danger zone" />
                <Stack gap={2}>
                  <Muted>Pausing hides your profile and stops new sign-ups. Existing subs keep access.</Muted>
                  <Row gap={2}>
                    <Button variant="outline" size="sm">
                      Pause profile
                    </Button>
                    <Button variant="danger" size="sm">
                      Close studio
                    </Button>
                  </Row>
                </Stack>
              </Card>
            </Col>
          </Row>
        </Stack>
      </Container>
    </>
  );
}
