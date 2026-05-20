import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Button,
  Badge,
  Field,
  Input,
  Select,
  Segmented,
  FilterChips,
  SwitchRow,
  EmptyState,
  StudioPageHeader,
  StudioDashLayout,
  StudioDashCol,
  AccountSettingsPanel,
  AccountProfileSettingsCard,
  AccountNotificationTriggerRow,
  AccountSettingsActionRow,
  AccountSidebarPanel,
  AccountBillingPanel,
  Eyebrow,
  Muted,
  QuickActionGrid,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { accountCrossLinks } from '../../lib/accountCrossLinks';

type Locale = 'en' | 'nb';

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'nb', label: 'Norsk bokmål' },
];

const THEME_OPTIONS = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

const SPORT_OPTIONS = ['NBA', 'NFL', 'Soccer', 'Tennis', 'Cricket'];
const MARKET_OPTIONS = ['Props', 'Spreads', 'Parlays', 'Totals'];

const NOTIFY_TRIGGERS = [
  {
    id: 'pickPublished' as const,
    label: 'New professional picks',
    sub: 'Get notified instantly when followed creators lock in new insights.',
  },
  {
    id: 'pickGraded' as const,
    label: 'Creator daily posts',
    sub: 'Analysis, breakdowns, and long-form editorial content.',
  },
  {
    id: 'lineMoved' as const,
    label: 'Live event reminders',
    sub: 'Real-time alerts for betting windows and starting lineups.',
  },
];

function fmtMemberSince(ms?: number): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function fmtBillingDate(ms?: number): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AccountSettings() {
  const navigate = useNavigate();
  const me = useQuery(api.users.me);
  const subs = useQuery(api.subscriptions.mySubscriptions);
  const updateProfile = useMutation(api.users.updateProfile);
  const updatePrefs = useMutation(api.notify.updatePrefs);
  const exportMyData = useAction(api.gdpr.exportMyData);

  const [name, setName] = useState('');
  const [locale, setLocale] = useState<Locale>('en');
  const [theme, setTheme] = useState('light');
  const [sports, setSports] = useState<string | null>(null);
  const [markets, setMarkets] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prefs = me?.notifyPrefs;

  React.useEffect(() => {
    if (me?.name) setName(me.name);
    if (me?.locale) setLocale(me.locale);
  }, [me?.name, me?.locale]);

  const activeSub = subs?.find((s) => s.status === 'active');
  const nextRenewal = activeSub?.renewsAt;

  const billingHistory = useMemo(() => {
    return (subs ?? [])
      .filter((s) => s.startedAt)
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, 3)
      .map((s) => ({
        id: s._id,
        dateLabel: fmtBillingDate(s.startedAt),
        detail: `${s.creatorName} subscription`,
        amount: `$${s.creatorStartingPrice.toFixed(2)}`,
      }));
  }, [subs]);

  async function handleSaveProfile() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateProfile({ name, locale });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePrefChange(
    key: 'pickPublished' | 'pickGraded' | 'lineMoved' | 'push' | 'email',
    value: boolean,
  ) {
    try {
      await updatePrefs({ [key]: value });
    } catch {
      /* useQuery recovers */
    }
  }

  async function handleExport() {
    try {
      await exportMyData({});
    } catch {
      /* user notified via browser if needed */
    }
  }

  if (me === undefined) {
    return (
      <Container size="2xl">
        <EmptyState icon="gear" title="Loading settings…" />
      </Container>
    );
  }

  const emailOn = prefs?.email === true;
  const pushOn = prefs?.push === true;

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Account · Settings"
          title="Account settings"
          sub="Profile and notification preferences save to your account. Theme and sport filters are preview-only until personalization sync ships."
          actions={
            <Row gap={2}>
              {saved ? (
                <Badge tone="green" dot>
                  Saved
                </Badge>
              ) : null}
              <Button variant="primary" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </Row>
          }
        />

        {error ? (
          <AccountSidebarPanel title="Save failed" variant="accent">
            <Muted>{error}</Muted>
          </AccountSidebarPanel>
        ) : null}

        <StudioDashLayout>
          <StudioDashCol span={8}>
            <Stack gap={6}>
              <AccountSettingsPanel
                title="Profile details"
                icon="user"
                footer={
                  <Button variant="primary" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                }
              >
                <AccountProfileSettingsCard
                  name={me?.name ?? '—'}
                  email={me?.email ?? ''}
                  mono={me?.name?.[0]?.toUpperCase() ?? 'U'}
                  color="var(--primary)"
                  memberSince={fmtMemberSince(me?._creationTime)}
                  roleLabel={me?.creatorId ? 'Creator' : 'Subscriber'}
                >
                  <Field label="Display name" required>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Email address">
                    <Input value={me?.email ?? ''} readOnly />
                  </Field>
                  <Field label="Language">
                    <Select
                      value={locale}
                      onChange={(e) => setLocale(e.target.value as Locale)}
                      aria-label="Language"
                    >
                      {LOCALE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </AccountProfileSettingsCard>
              </AccountSettingsPanel>

              <AccountSettingsPanel title="Intelligence triggers" icon="bell">
                <Stack gap={2}>
                  <SwitchRow
                    label="Email channel"
                    sub="Receive pick alerts in your inbox"
                    checked={emailOn}
                    onChange={(v) => handlePrefChange('email', v)}
                  />
                  <SwitchRow
                    label="Push channel"
                    sub="Browser and device notifications"
                    checked={pushOn}
                    onChange={(v) => handlePrefChange('push', v)}
                  />
                  {NOTIFY_TRIGGERS.map((row) => (
                    <AccountNotificationTriggerRow
                      key={row.id}
                      label={row.label}
                      sub={row.sub}
                      checked={prefs?.[row.id] !== false}
                      onChange={(v) => handlePrefChange(row.id, v)}
                      emailActive={emailOn}
                      pushActive={pushOn}
                    />
                  ))}
                  <AccountNotificationTriggerRow
                    label="Billing & security updates"
                    sub="Important notices regarding your account health."
                    checked
                    disabled
                    emailActive
                    pushActive={pushOn}
                  />
                </Stack>
              </AccountSettingsPanel>

              <AccountSettingsPanel title="Personalization" icon="sliders">
                <Stack gap={6}>
                  <Muted>Preview only — not saved to your account yet.</Muted>
                  <Stack gap={3}>
                    <Eyebrow>Theme visuals</Eyebrow>
                    <Segmented
                      options={THEME_OPTIONS}
                      value={theme}
                      onChange={setTheme}
                      ariaLabel="Theme"
                      fullWidth
                    />
                  </Stack>
                  <Stack gap={3}>
                    <Eyebrow>Focus sports</Eyebrow>
                    <FilterChips
                      options={SPORT_OPTIONS}
                      value={sports}
                      onChange={setSports}
                      allLabel="All"
                    />
                  </Stack>
                  <Stack gap={3}>
                    <Eyebrow>Market interests</Eyebrow>
                    <FilterChips
                      options={MARKET_OPTIONS}
                      value={markets}
                      onChange={setMarkets}
                      allLabel="All markets"
                    />
                  </Stack>
                </Stack>
              </AccountSettingsPanel>

              {!me?.creatorId ? (
                <AccountSidebarPanel title="Become a creator" variant="accent">
                  <Muted>
                    Have a track record? Publish picks and keep 87% of every subscription.
                  </Muted>
                  <Button
                    variant="primary"
                    iconRight="arrow-right"
                    onClick={() => navigate('/apply')}
                  >
                    Apply now
                  </Button>
                </AccountSidebarPanel>
              ) : null}
            </Stack>
          </StudioDashCol>

          <StudioDashCol span={4}>
            <Stack gap={6}>
              <AccountBillingPanel
                paymentBrand="VISA"
                paymentLabel="Card on file"
                paymentSub={
                  nextRenewal
                    ? `Next billing ${fmtBillingDate(nextRenewal)}`
                    : 'Manage payment in subscriptions'
                }
                onUpdatePayment={() => navigate('/account/payment-methods')}
                history={billingHistory}
                onViewAllHistory={() => navigate('/account/billing-history')}
              />

              <AccountSidebarPanel title="Integrations">
                <AccountSettingsActionRow
                  label="Google"
                  trailing={me?.email ? 'Connected' : undefined}
                  trailingTone="primary"
                />
                <AccountSettingsActionRow
                  label="Discord"
                  trailing={me?.discordId ? 'Connected' : 'Link'}
                  trailingTone={me?.discordId ? 'primary' : 'default'}
                />
                <AccountSettingsActionRow label="Apple ID" trailing="Link" />
              </AccountSidebarPanel>

              <AccountSidebarPanel title="Security vault">
                <AccountSettingsActionRow label="Change password" onClick={() => {}} />
                <AccountSettingsActionRow
                  label="Two-factor (2FA)"
                  trailing="Off"
                  trailingTone="danger"
                />
                <AccountSettingsActionRow label="Active sessions" trailing="View" />
                <Button variant="outline" block>
                  Logout all devices
                </Button>
              </AccountSidebarPanel>

              <AccountSidebarPanel title="Privacy compliance">
                <Button variant="secondary" block iconLeft="arrow-down" onClick={handleExport}>
                  Download my personal data
                </Button>
                <Button variant="ghost" block onClick={() => navigate('/account')}>
                  Delete account
                </Button>
              </AccountSidebarPanel>
            </Stack>
          </StudioDashCol>
        </StudioDashLayout>

        <QuickActionGrid title="Related" items={accountCrossLinks('settings', navigate)} />
      </Stack>
    </Container>
  );
}
