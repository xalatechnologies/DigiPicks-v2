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
  TextArea,
  Select,
  Muted,
  KV,
  Mono,
  Divider,
  SwitchRow,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

const NICHE_OPTIONS = [
  'Soccer Goalscorer Props',
  'Cricket Match Totals',
  'Tennis Sides & Totals',
  'Cross-sport Props',
];

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

// TODO: convex — notification preferences need a real
// api.users.notificationPrefs query + mutation.
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
  const me = useQuery(api.users.me);
  const creator = useQuery(
    api.creators.get,
    me?.creatorId ? { id: me.creatorId } : 'skip',
  );
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = React.useState('');
  const [locale, setLocale] = React.useState<Locale>('en');
  const [bio, setBio] = React.useState('');
  const [niche, setNiche] = React.useState(NICHE_OPTIONS[0]!);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const [toggles, setToggles] = React.useState<Record<NotificationToggle['id'], boolean>>({
    pickAlerts: true,
    billingAlerts: true,
    growthAlerts: false,
  });

  // Hydrate from Convex once the queries land.
  React.useEffect(() => {
    if (me?.name) setName(me.name);
    if (me?.locale) setLocale(me.locale);
  }, [me?.name, me?.locale]);

  React.useEffect(() => {
    if (creator?.bio) setBio(creator.bio);
    if (creator?.niche) setNiche(creator.niche);
  }, [creator?.bio, creator?.niche]);

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
            sub="Public profile, payout details, and notification preferences."
          />

          {error && <Muted>{error}</Muted>}
          {saved && <Muted>Profile saved.</Muted>}

          <Row gap={5} wrap>
            <Col gap={4}>
              <Card>
                <CardHead title="Public profile" sub="What subscribers see on your creator page" />
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
                  {/* TODO: convex — bio + niche need api.creators.updateProfile. */}
                  <Field label="Bio" help="Up to 280 characters.">
                    <TextArea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
                  </Field>
                  <Field label="Niche">
                    <Select value={niche} onChange={(e) => setNiche(e.target.value)}>
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
              {/* TODO: convex — payout method needs api.payouts.method. */}
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
                  <KV
                    k="Identity"
                    v={creator?.verified ? 'Verified' : 'Not verified'}
                  />
                  <KV k="Status" v={creator?.status ?? '—'} />
                  <KV k="Handle" v={creator?.handle ?? '—'} />
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
