import React from 'react';
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
  PageHead,
  Breadcrumb,
  Field,
  Input,
  TextArea,
  Select,
  Switch,
  Muted,
  KV,
  Mono,
  Divider,
} from '@digipicks/ds';

export function Settings() {
  const [pickAlerts, setPickAlerts] = React.useState(true);
  const [billingAlerts, setBillingAlerts] = React.useState(true);
  const [growthAlerts, setGrowthAlerts] = React.useState(false);
  const [name, setName] = React.useState('CourtVision Pro');
  const [handle, setHandle] = React.useState('@courtvisionpro');
  const [bio, setBio] = React.useState(
    'Player props specialist. Pace and matchup-driven. Pre-game only, no live bets.',
  );

  return (
    <>
      <Topbar
        title="Settings"
        crumb={<Breadcrumb items={[{ label: 'Account' }, { label: 'Settings' }]} />}
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
                      <option>NBA Player Props</option>
                      <option>NFL Sides &amp; Totals</option>
                      <option>Cross-sport Props</option>
                      <option>Soccer &amp; Tennis</option>
                    </Select>
                  </Field>
                </Stack>
              </Card>

              <Card>
                <CardHead title="Notifications" sub="Where to send alerts about activity in your studio" />
                <Stack gap={3}>
                  <Row gap={3} between>
                    <Stack gap={0}>
                      <span>Pick alerts</span>
                      <Muted>When a pick auto-grades or hits cutoff</Muted>
                    </Stack>
                    <Switch checked={pickAlerts} onChange={setPickAlerts} />
                  </Row>
                  <Divider />
                  <Row gap={3} between>
                    <Stack gap={0}>
                      <span>Billing alerts</span>
                      <Muted>Failed payments, refunds, payout updates</Muted>
                    </Stack>
                    <Switch checked={billingAlerts} onChange={setBillingAlerts} />
                  </Row>
                  <Divider />
                  <Row gap={3} between>
                    <Stack gap={0}>
                      <span>Growth opportunities</span>
                      <Muted>Weekly digest of new growth ideas</Muted>
                    </Stack>
                    <Switch checked={growthAlerts} onChange={setGrowthAlerts} />
                  </Row>
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
