import React from 'react';
import { useMutation, useQuery, useAction } from 'convex/react';
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
  const setDiscordWebhook = useMutation(api.discordSettings.setWebhookUrl);
  const testDiscordWebhook = useAction(api.discordSettings.testWebhook);
  const exportMyData = useAction(api.gdpr.exportMyData);
  const deleteMyAccount = useMutation(api.gdpr.deleteMyAccount);

  const [name, setName] = React.useState('');
  const [locale, setLocale] = React.useState<Locale>('en');
  const [bio, setBio] = React.useState('');
  const [niche, setNiche] = React.useState(NICHE_OPTIONS[0]!);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  // Discord state
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [webhookSaving, setWebhookSaving] = React.useState(false);
  const [webhookTesting, setWebhookTesting] = React.useState(false);
  const [webhookMsg, setWebhookMsg] = React.useState<string | null>(null);

  // GDPR state
  const [gdprBusy, setGdprBusy] = React.useState<'idle' | 'exporting' | 'deleting'>('idle');
  const [gdprMsg, setGdprMsg] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    if (creator?.discordWebhookUrl) setWebhookUrl(creator.discordWebhookUrl);
  }, [creator?.discordWebhookUrl]);

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

  async function handleSaveWebhook() {
    if (!creator) return;
    setWebhookMsg(null);
    setWebhookSaving(true);
    try {
      await setDiscordWebhook({
        creatorId: creator._id,
        webhookUrl: webhookUrl || undefined,
      });
      setWebhookMsg('Webhook URL saved.');
    } catch (err) {
      setWebhookMsg(err instanceof Error ? err.message : 'Could not save webhook URL.');
    } finally {
      setWebhookSaving(false);
    }
  }

  async function handleTestWebhook() {
    if (!creator || !webhookUrl) return;
    setWebhookMsg(null);
    setWebhookTesting(true);
    try {
      await testDiscordWebhook({
        creatorId: creator._id,
        webhookUrl,
      });
      setWebhookMsg('Test embed sent — check your Discord channel.');
    } catch (err) {
      setWebhookMsg(err instanceof Error ? err.message : 'Webhook test failed.');
    } finally {
      setWebhookTesting(false);
    }
  }

  async function handleExportData() {
    setGdprMsg(null);
    setGdprBusy('exporting');
    try {
      const data = await exportMyData({});
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `digipicks-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setGdprMsg('Export downloaded. Includes every record we hold about your account.');
    } catch (err) {
      setGdprMsg(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setGdprBusy('idle');
    }
  }

  async function handleDeleteAccount() {
    if (
      !window.confirm(
        'Delete your account permanently? This anonymizes your profile, cancels active subscriptions, and clears saved picks. Audit history is retained but no longer linked to identifying data.',
      )
    ) {
      return;
    }
    setGdprMsg(null);
    setGdprBusy('deleting');
    try {
      await deleteMyAccount({ confirm: 'DELETE' });
      setGdprMsg('Account deleted. You will be signed out shortly.');
    } catch (err) {
      setGdprMsg(err instanceof Error ? err.message : 'Account deletion failed.');
    } finally {
      setGdprBusy('idle');
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
                <CardHead
                  title="Discord Integration"
                  sub="Deliver pick notifications to your Discord server"
                />
                <Stack gap={3}>
                  <Field
                    label="Webhook URL"
                    help="Paste a Discord webhook URL from Server Settings → Integrations → Webhooks."
                  >
                    <Input
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                  </Field>
                  {webhookMsg && <Muted>{webhookMsg}</Muted>}
                  <Row gap={2}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveWebhook}
                      disabled={webhookSaving}
                    >
                      <Icon name="check" size={13} />
                      {webhookSaving ? 'Saving…' : 'Save webhook'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleTestWebhook}
                      disabled={webhookTesting || !webhookUrl}
                    >
                      <Icon name="discord" size={13} />
                      {webhookTesting ? 'Sending…' : 'Test webhook'}
                    </Button>
                  </Row>
                  {me?.discordUsername && (
                    <KV k="Discord" v={<Mono>{me.discordUsername}</Mono>} />
                  )}
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
                <CardHead
                  title="Privacy & data"
                  sub="Export everything we have on you, or remove your account entirely (GDPR Articles 15 & 17)."
                />
                <Stack gap={3}>
                  {gdprMsg && <Muted>{gdprMsg}</Muted>}
                  <Row gap={2}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExportData}
                      disabled={gdprBusy !== 'idle'}
                    >
                      <Icon name="arrow-down" size={13} />
                      {gdprBusy === 'exporting' ? 'Preparing…' : 'Export my data'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDeleteAccount}
                      disabled={gdprBusy !== 'idle'}
                    >
                      <Icon name="trash" size={13} />
                      {gdprBusy === 'deleting' ? 'Deleting…' : 'Delete my account'}
                    </Button>
                  </Row>
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
