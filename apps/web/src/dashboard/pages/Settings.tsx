import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useAction } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Col,
  Card,
  CardHead,
  Button,
  Icon,
  Heading,
  Eyebrow,
  Field,
  Input,
  Muted,
  KV,
  Mono,
  Divider,
  SwitchRow,
  PushNotificationPrompt,
  QuickActionGrid,
  MfaEnrollmentCard,
  type PushPermissionState,
  type MfaEnrollmentSecrets,
  type MfaState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { urlBase64ToUint8Array } from '../../lib/pushKey';
import { STUDIO } from '../../lib/studioRoutes';
import { studioCrossLinks } from '../../lib/studioCrossLinks';

interface NotificationToggle {
  id: 'pickPublished' | 'pickGraded' | 'lineMoved';
  label: string;
  sub: string;
}

const NOTIFICATIONS: NotificationToggle[] = [
  {
    id: 'pickPublished',
    label: 'New picks',
    sub: 'Fires the moment a creator publishes a pick',
  },
  {
    id: 'pickGraded',
    label: 'Grading results',
    sub: 'Win / loss / push outcomes for picks you saved or follow',
  },
  {
    id: 'lineMoved',
    label: 'Line movement',
    sub: 'Significant odds shifts on events you have picks on',
  },
];

export function Settings() {
  const navigate = useNavigate();
  const me = useQuery(api.users.me);
  const creator = useQuery(api.creators.get, me?.creatorId ? { id: me.creatorId } : 'skip');
  const setDiscordWebhook = useMutation(api.discordSettings.setWebhookUrl);
  const testDiscordWebhook = useAction(api.discordSettings.testWebhook);
  const exportMyData = useAction(api.gdpr.exportMyData);
  const deleteMyAccount = useMutation(api.gdpr.deleteMyAccount);

  const mfaStatus = useQuery(api.mfa.status);
  const mfaEnroll = useAction(api.mfa.enrollStart);
  const mfaVerifySetup = useAction(api.mfa.verifySetup);
  const mfaVerify = useAction(api.mfa.verify);
  const mfaDisable = useMutation(api.mfa.disable);
  const [mfaSecrets, setMfaSecrets] = React.useState<MfaEnrollmentSecrets | null>(null);
  const [mfaBusy, setMfaBusy] = React.useState(false);
  const [mfaError, setMfaError] = React.useState<string | null>(null);

  const mfaState: MfaState = mfaSecrets ? 'enrolling' : mfaStatus?.enrolled ? 'enrolled' : 'idle';

  async function handleMfaStart() {
    setMfaError(null);
    setMfaBusy(true);
    try {
      const result = await mfaEnroll({});
      setMfaSecrets(result);
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Could not start MFA enrollment.');
    } finally {
      setMfaBusy(false);
    }
  }

  async function handleMfaConfirm(code: string) {
    setMfaError(null);
    setMfaBusy(true);
    try {
      const { ok } = await mfaVerifySetup({ code });
      if (!ok) {
        setMfaError('Code did not match — try again with a fresh one.');
        return;
      }
      setMfaSecrets(null);
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'MFA confirmation failed.');
    } finally {
      setMfaBusy(false);
    }
  }

  async function handleMfaVerify(code: string) {
    setMfaError(null);
    setMfaBusy(true);
    try {
      const { ok } = await mfaVerify({ code });
      if (!ok) setMfaError('Code did not match.');
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setMfaBusy(false);
    }
  }

  async function handleMfaDisable() {
    if (!window.confirm('Turn off two-factor? Sensitive actions will skip the gate.')) return;
    setMfaError(null);
    setMfaBusy(true);
    try {
      await mfaDisable({ code: 'confirmed' });
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Could not disable MFA.');
    } finally {
      setMfaBusy(false);
    }
  }
  const myPrefs = useQuery(api.notify.myPrefs);
  const updatePrefs = useMutation(api.notify.updatePrefs);
  const startTelegramLink = useMutation(api.notify.startTelegramLink);
  const pushVapidKey = useQuery(api.pushSubscriptions.publicKey);
  const subscribePush = useMutation(api.pushSubscriptions.subscribe);
  const unsubscribePush = useMutation(api.pushSubscriptions.unsubscribe);

  const [error, setError] = React.useState<string | null>(null);

  // Discord state
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [webhookSaving, setWebhookSaving] = React.useState(false);
  const [webhookTesting, setWebhookTesting] = React.useState(false);
  const [webhookMsg, setWebhookMsg] = React.useState<string | null>(null);

  // GDPR state
  const [gdprBusy, setGdprBusy] = React.useState<'idle' | 'exporting' | 'deleting'>('idle');
  const [gdprMsg, setGdprMsg] = React.useState<string | null>(null);

  // Push state — derived from the browser + Convex.
  const [pushState, setPushState] = React.useState<PushPermissionState>('unknown');
  const [pushBusy, setPushBusy] = React.useState(false);

  // Telegram link state.
  const [tgCode, setTgCode] = React.useState<string | null>(null);
  const [tgMsg, setTgMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      !('serviceWorker' in navigator)
    ) {
      setPushState('unsupported');
      return;
    }
    setPushState(
      Notification.permission === 'granted'
        ? 'granted'
        : Notification.permission === 'denied'
          ? 'denied'
          : 'unknown',
    );
  }, []);

  React.useEffect(() => {
    if (creator?.discordWebhookUrl) setWebhookUrl(creator.discordWebhookUrl);
  }, [creator?.discordWebhookUrl]);

  const prefs = myPrefs?.prefs ?? {};
  const toggleValue = (id: NotificationToggle['id']): boolean => prefs[id] !== false;

  const setToggle = (id: NotificationToggle['id']) => async (next: boolean) => {
    try {
      await updatePrefs({ [id]: next });
    } catch (err) {
      console.warn('updatePrefs failed:', err);
    }
  };

  async function handleEnablePush() {
    if (!pushVapidKey) {
      console.warn('VAPID public key not configured');
      return;
    }
    setPushBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushState(permission === 'denied' ? 'denied' : 'unknown');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pushVapidKey) as BufferSource,
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
      await subscribePush({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: navigator.userAgent,
      });
      await updatePrefs({ push: true });
      setPushState('granted');
    } catch (err) {
      console.warn('enable push failed:', err);
    } finally {
      setPushBusy(false);
    }
  }

  async function handleDisablePush() {
    setPushBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      await updatePrefs({ push: false });
    } catch (err) {
      console.warn('disable push failed:', err);
    } finally {
      setPushBusy(false);
    }
  }

  async function handleLinkTelegram() {
    setTgMsg(null);
    try {
      const { code } = await startTelegramLink({});
      setTgCode(code);
      setTgMsg('Open Telegram and send this code to the DigiPicks bot.');
    } catch (err) {
      setTgMsg(err instanceof Error ? err.message : 'Could not start Telegram link.');
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
    <Container size="xl">
      <Stack gap={8}>
        <Row between wrap>
          <Stack gap={2}>
            <Eyebrow>Studio · Settings</Eyebrow>
            <Heading level={1} size="2xl">
              Settings
            </Heading>
            <Muted>Notifications, integrations, security, and account data.</Muted>
          </Stack>
          <Button variant="outline" size="sm" onClick={() => navigate(STUDIO.profile)}>
            Edit profile
          </Button>
        </Row>

        {error ? <Muted>{error}</Muted> : null}

        <Row gap={5} wrap>
          <Col gap={4}>
            <Card>
              <CardHead
                title="Notifications"
                sub="What you get pinged for, and where the alerts land"
              />
              <Stack gap={3}>
                <PushNotificationPrompt
                  state={pushState}
                  onEnable={handleEnablePush}
                  onDisable={handleDisablePush}
                  busy={pushBusy}
                />
                <Divider />
                {NOTIFICATIONS.map((n, i) => (
                  <React.Fragment key={n.id}>
                    {i > 0 && <Divider />}
                    <SwitchRow
                      label={n.label}
                      sub={n.sub}
                      checked={toggleValue(n.id)}
                      onChange={setToggle(n.id)}
                    />
                  </React.Fragment>
                ))}
                <Divider />
                <SwitchRow
                  label="Telegram"
                  sub={
                    myPrefs?.telegramLinked
                      ? 'Linked — toggle to pause Telegram delivery'
                      : 'Link the DigiPicks bot to receive alerts in Telegram'
                  }
                  checked={Boolean(prefs.telegram) && Boolean(myPrefs?.telegramLinked)}
                  onChange={(next) => updatePrefs({ telegram: next })}
                  disabled={!myPrefs?.telegramLinked}
                />
                {!myPrefs?.telegramLinked && (
                  <Row gap={2}>
                    <Button variant="secondary" size="sm" onClick={handleLinkTelegram}>
                      <Icon name="link" size={13} />
                      {tgCode ? 'Refresh code' : 'Link Telegram'}
                    </Button>
                    {tgCode && <Mono>{`/start ${tgCode}`}</Mono>}
                  </Row>
                )}
                {tgMsg && <Muted>{tgMsg}</Muted>}
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
                  <Button variant="secondary" size="sm" onClick={() => navigate(STUDIO.payouts)}>
                    View payouts
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
                {me?.discordUsername && <KV k="Discord" v={<Mono>{me.discordUsername}</Mono>} />}
              </Stack>
            </Card>

            <Card>
              <CardHead
                title="Advanced Discord"
                sub="Connect your guild for inbound messages, channel mapping, alert rules, and thread linking."
              />
              <Stack gap={2}>
                <Muted>
                  The advanced surface uses a full OAuth-installed bot — keep the legacy webhook
                  above active until you migrate.
                </Muted>
                <Row gap={2}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(STUDIO.settingsDiscord)}
                  >
                    <Icon name="discord" size={13} />
                    Open advanced
                  </Button>
                </Row>
              </Stack>
            </Card>

            <MfaEnrollmentCard
              state={mfaState}
              secrets={mfaSecrets ?? undefined}
              remainingRecoveryCodes={mfaStatus?.remainingRecoveryCodes}
              lastVerifiedAt={mfaStatus?.lastVerifiedAt ?? null}
              busy={mfaBusy}
              error={mfaError}
              onStartEnroll={handleMfaStart}
              onConfirmEnroll={handleMfaConfirm}
              onVerify={handleMfaVerify}
              onDisable={handleMfaDisable}
            />

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
                <Muted>
                  Pausing hides your profile and stops new sign-ups. Existing subs keep access.
                </Muted>
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

        <QuickActionGrid title="Related" items={studioCrossLinks('settings', navigate)} />
      </Stack>
    </Container>
  );
}
