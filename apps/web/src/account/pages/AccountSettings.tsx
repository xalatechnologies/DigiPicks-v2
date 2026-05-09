import React from 'react';
import { useMutation, useQuery } from 'convex/react';
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
  Select,
  Muted,
  Divider,
  SwitchRow,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

type Locale = 'en' | 'nb';

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'nb', label: 'Norsk bokmål' },
];

interface NotificationToggle {
  id: 'pickAlerts' | 'billingAlerts' | 'growthAlerts';
  label: string;
  sub: string;
}

const NOTIFICATIONS: NotificationToggle[] = [
  {
    id: 'pickAlerts',
    label: 'New pick alerts',
    sub: 'When a subscribed creator publishes a new pick',
  },
  {
    id: 'billingAlerts',
    label: 'Billing alerts',
    sub: 'Failed payments, renewals, refunds',
  },
  {
    id: 'growthAlerts',
    label: 'Weekly digest',
    sub: 'Top picks, new creators, and win-rate movers',
  },
];

export function AccountSettings() {
  const me = useQuery(api.users.me);
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = React.useState('');
  const [locale, setLocale] = React.useState<Locale>('en');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const [toggles, setToggles] = React.useState<Record<NotificationToggle['id'], boolean>>({
    pickAlerts: true,
    billingAlerts: true,
    growthAlerts: false,
  });

  React.useEffect(() => {
    if (me?.name) setName(me.name);
    if (me?.locale) setLocale(me.locale);
  }, [me?.name, me?.locale]);

  const setToggle = (id: NotificationToggle['id']) => (next: boolean) => {
    setToggles((prev) => ({ ...prev, [id]: next }));
  };

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateProfile({ name, locale });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        crumbs={[{ label: 'Account' }, { label: 'Settings' }]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Icon name="check" size={13} />
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

      <Container size="xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Account"
            title="Settings"
            sub="Account, notifications, and responsible-betting preferences."
          />

          {error && <Muted>{error}</Muted>}
          {saved && <Muted>Profile saved.</Muted>}

          <Row gap={5} wrap>
            <Col gap={4}>
              <Card>
                <CardHead title="Profile" sub="Your account details" />
                <Stack gap={4}>
                  <Field label="Display name" required>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <Input value={me?.email ?? ''} readOnly />
                  </Field>
                  <Field label="Locale">
                    <Select
                      value={locale}
                      onChange={(e) => setLocale(e.target.value as Locale)}
                    >
                      {LOCALE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </Stack>
              </Card>

              <Card>
                <CardHead title="Notifications" sub="How we reach you about activity" />
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
                <CardHead title="Responsible betting" sub="Optional safeguards" />
                <Stack gap={3}>
                  <SwitchRow
                    label="Weekly play cap"
                    sub="Limit the number of plays you follow per week"
                    checked={false}
                    onChange={() => {}}
                  />
                  <Divider />
                  <SwitchRow
                    label="Cooldown period"
                    sub="After a losing streak, pause new follows for 24h"
                    checked={false}
                    onChange={() => {}}
                  />
                  <Divider />
                  <Muted>
                    These tools are optional and can be turned off at any time. For
                    more resources visit the responsible gambling page.
                  </Muted>
                </Stack>
              </Card>

              <Card>
                <CardHead title="Privacy" sub="Control your visibility" />
                <Stack gap={3}>
                  <SwitchRow
                    label="Private profile"
                    sub="Hide your followed plays from other users"
                    checked={false}
                    onChange={() => {}}
                  />
                </Stack>
              </Card>

              <Card>
                <CardHead title="Danger zone" />
                <Stack gap={2}>
                  <Muted>
                    Pausing your account hides your activity. You can reactivate
                    at any time. Deleting is permanent.
                  </Muted>
                  <Row gap={2}>
                    <Button variant="outline" size="sm">
                      Pause account
                    </Button>
                    <Button variant="danger" size="sm">
                      Delete account
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
