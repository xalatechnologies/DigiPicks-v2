import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConvexAuth } from 'convex/react';
import { useMutation, useQuery, useAction } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  StudioPageHeader,
  StudioSubNav,
  StudioSummaryGrid,
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
import { urlBase64ToUint8Array } from '../../lib/pushKey';
import { STUDIO } from '../../lib/studioRoutes';
import { studioCrossLinks } from '../../lib/studioCrossLinks';
import { useStudioContext } from '../useStudioContext';
import { StudioDevHint } from '../StudioDevHint';

const VIEW_TABS = [
  { label: 'Notifications', value: 'notifications' },
  { label: 'Integrations', value: 'integrations' },
  { label: 'Security', value: 'security' },
  { label: 'Account', value: 'account' },
];

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

function pushStatusLabel(state: PushPermissionState): string {
  if (state === 'granted') return 'Enabled';
  if (state === 'denied') return 'Blocked';
  if (state === 'unsupported') return 'Unsupported';
  return 'Not set';
}

export function Settings() {
  const navigate = useNavigate();
  const ctx = useStudioContext();
  const { isAuthenticated } = useConvexAuth();
  const authReady = isAuthenticated && Boolean(ctx.me);
  const me = ctx.me;
  const creator = ctx.creator;
  const useDemo = ctx.devPreview && !authReady;
  const [view, setView] = React.useState('notifications');

  const setDiscordWebhook = useMutation(api.discordSettings.setWebhookUrl);
  const testDiscordWebhook = useAction(api.discordSettings.testWebhook);
  const exportMyData = useAction(api.gdpr.exportMyData);
  const deleteMyAccount = useMutation(api.gdpr.deleteMyAccount);

  const mfaStatus = useQuery(api.mfa.status, authReady ? {} : 'skip');
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

  const myPrefs = useQuery(api.notify.myPrefs, authReady ? {} : 'skip');
  const updatePrefs = useMutation(api.notify.updatePrefs);
  const startTelegramLink = useMutation(api.notify.startTelegramLink);
  const pushVapidKey = useQuery(api.pushSubscriptions.publicKey);
  const subscribePush = useMutation(api.pushSubscriptions.subscribe);
  const unsubscribePush = useMutation(api.pushSubscriptions.unsubscribe);

  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [webhookSaving, setWebhookSaving] = React.useState(false);
  const [webhookTesting, setWebhookTesting] = React.useState(false);
  const [webhookMsg, setWebhookMsg] = React.useState<string | null>(null);

  const [gdprBusy, setGdprBusy] = React.useState<'idle' | 'exporting' | 'deleting'>('idle');
  const [gdprMsg, setGdprMsg] = React.useState<string | null>(null);

  const [pushState, setPushState] = React.useState<PushPermissionState>('unknown');
  const [pushBusy, setPushBusy] = React.useState(false);

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
    if (!authReady) return;
    try {
      await updatePrefs({ [id]: next });
    } catch (err) {
      console.warn('updatePrefs failed:', err);
    }
  };

  async function handleEnablePush() {
    if (!authReady || !pushVapidKey) {
      if (!pushVapidKey) console.warn('VAPID public key not configured');
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
    if (!authReady) return;
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
    if (!authReady) return;
    setTgMsg(null);
    try {
      const { code } = await startTelegramLink({});
      setTgCode(code);
      setTgMsg('Open Telegram and send this code to the DigiPicks bot.');
    } catch (err) {
      setTgMsg(err instanceof Error ? err.message : 'Could not start Telegram link.');
    }
  }

  async function handleTelegramToggle(next: boolean) {
    if (!authReady) return;
    try {
      await updatePrefs({ telegram: next });
    } catch (err) {
      console.warn('updatePrefs telegram failed:', err);
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
    if (!authReady) return;
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
    if (!authReady) return;
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

  const pushLabel = useDemo ? 'Sample' : pushStatusLabel(pushState);
  const mfaLabel = useDemo ? 'Off' : mfaStatus?.enrolled ? 'On' : 'Off';
  const discordLabel = useDemo
    ? 'Not linked'
    : creator?.discordWebhookUrl || webhookUrl
      ? 'Webhook set'
      : 'Not set';
  const accountLabel = useDemo ? 'Preview' : (me?.email ?? '—');

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Settings"
          title="Settings"
          sub="Notifications, integrations, security, and account data."
          actions={
            <Button variant="outline" onClick={() => navigate(STUDIO.profile)}>
              Edit profile
            </Button>
          }
        />

        <StudioSubNav items={VIEW_TABS} value={view} onChange={setView} />

        <StudioSummaryGrid
          columns={4}
          items={[
            {
              id: 'push',
              icon: 'bell',
              iconTone: pushState === 'granted' ? 'primary' : 'amber',
              label: 'Push alerts',
              value: pushLabel,
              active: view === 'notifications',
              onClick: () => setView('notifications'),
            },
            {
              id: 'mfa',
              icon: 'shield',
              iconTone: mfaStatus?.enrolled ? 'primary' : 'danger',
              label: 'Two-factor',
              value: mfaLabel,
              active: view === 'security',
              onClick: () => setView('security'),
            },
            {
              id: 'discord',
              icon: 'discord',
              iconTone: 'violet',
              label: 'Discord',
              value: discordLabel,
              active: view === 'integrations',
              onClick: () => setView('integrations'),
            },
            {
              id: 'account',
              icon: 'user',
              iconTone: 'primary',
              label: 'Account',
              value: accountLabel,
              valueVariant: 'text',
              active: view === 'account',
              onClick: () => setView('account'),
            },
          ]}
        />

        {useDemo ? (
          <StudioDevHint message="Notification, MFA, and account actions require signing in with a creator account." />
        ) : null}

        {view === 'notifications' ? (
          <Card pad="lg" elev>
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
                    disabled={!authReady}
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
                onChange={handleTelegramToggle}
                disabled={!authReady || !myPrefs?.telegramLinked}
              />
              {!myPrefs?.telegramLinked && (
                <Row gap={2}>
                  <Button variant="secondary" onClick={handleLinkTelegram} disabled={!authReady}>
                    <Icon name="link" size={13} />
                    {tgCode ? 'Refresh code' : 'Link Telegram'}
                  </Button>
                  {tgCode && <Mono>{`/start ${tgCode}`}</Mono>}
                </Row>
              )}
              {tgMsg && <Muted>{tgMsg}</Muted>}
            </Stack>
          </Card>
        ) : null}

        {view === 'integrations' ? (
          <Stack gap={6}>
            <Card pad="lg" elev>
              <CardHead title="Payout" sub="Current default destination" />
              <Stack gap={2}>
                <KV k="Bank" v="Chase Business Checking" />
                <KV k="Account" v={<Mono>•••• 4391</Mono>} />
                <KV k="Schedule" v="1st of each month" />
                <Button variant="secondary" onClick={() => navigate(STUDIO.payouts)}>
                  View payouts
                </Button>
              </Stack>
            </Card>

            <Card pad="lg" elev>
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
                    disabled={!creator}
                  />
                </Field>
                {webhookMsg && <Muted>{webhookMsg}</Muted>}
                <Row gap={2}>
                  <Button
                    variant="primary"
                    onClick={handleSaveWebhook}
                    disabled={webhookSaving || !creator}
                  >
                    <Icon name="check" size={13} />
                    {webhookSaving ? 'Saving…' : 'Save webhook'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleTestWebhook}
                    disabled={webhookTesting || !webhookUrl || !creator}
                  >
                    <Icon name="discord" size={13} />
                    {webhookTesting ? 'Sending…' : 'Test webhook'}
                  </Button>
                </Row>
                {me?.discordUsername && <KV k="Discord" v={<Mono>{me.discordUsername}</Mono>} />}
              </Stack>
            </Card>

            <Card pad="lg" elev>
              <CardHead
                title="Advanced Discord"
                sub="Connect your guild for inbound messages, channel mapping, alert rules, and thread linking."
              />
              <Stack gap={2}>
                <Muted>
                  The advanced surface uses a full OAuth-installed bot — keep the legacy webhook
                  above active until you migrate.
                </Muted>
                <Button variant="secondary" onClick={() => navigate(STUDIO.settingsDiscord)}>
                  <Icon name="discord" size={13} />
                  Open advanced
                </Button>
              </Stack>
            </Card>
          </Stack>
        ) : null}

        {view === 'security' ? (
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
        ) : null}

        {view === 'account' ? (
          <Stack gap={6}>
            <Card pad="lg" elev>
              <CardHead
                title="Privacy & data"
                sub="Export everything we have on you, or remove your account entirely (GDPR Articles 15 & 17)."
              />
              <Stack gap={3}>
                {gdprMsg && <Muted>{gdprMsg}</Muted>}
                <Row gap={2}>
                  <Button
                    variant="secondary"
                    onClick={handleExportData}
                    disabled={gdprBusy !== 'idle' || !authReady}
                  >
                    <Icon name="arrow-down" size={13} />
                    {gdprBusy === 'exporting' ? 'Preparing…' : 'Export my data'}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDeleteAccount}
                    disabled={gdprBusy !== 'idle' || !authReady}
                  >
                    <Icon name="trash" size={13} />
                    {gdprBusy === 'deleting' ? 'Deleting…' : 'Delete my account'}
                  </Button>
                </Row>
              </Stack>
            </Card>

            <Card pad="lg" elev>
              <CardHead title="Danger zone" />
              <Stack gap={2}>
                <Muted>
                  Pausing hides your profile and stops new sign-ups. Existing subs keep access.
                </Muted>
                <Row gap={2}>
                  <Button variant="outline" disabled={!authReady}>
                    Pause profile
                  </Button>
                  <Button variant="danger" disabled={!authReady}>
                    Close studio
                  </Button>
                </Row>
              </Stack>
            </Card>
          </Stack>
        ) : null}

        <QuickActionGrid title="Related" items={studioCrossLinks('settings', navigate)} />
      </Stack>
    </Container>
  );
}
