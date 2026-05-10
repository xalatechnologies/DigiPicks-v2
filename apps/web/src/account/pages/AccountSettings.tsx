import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  PageHeader,
  PageHead,
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  Badge,
  PersonRow,
  Divider,
  SwitchRow,
  DashGrid,
  Field,
  Input,
  Select,
  SectionHead,
  InsightCard,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

type Locale = 'en' | 'nb';

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'nb', label: 'Norsk bokmål' },
];

const NOTIFICATION_SECTIONS = [
  {
    title: 'Pick notifications',
    eyebrow: 'Pick alerts',
    sub: 'Stay in the loop the moment a creator publishes.',
    items: [
      {
        id: 'newPick',
        label: 'New pick alerts',
        sub: 'When a subscribed creator publishes',
        defaultOn: true,
      },
      {
        id: 'gradeAlert',
        label: 'Grading updates',
        sub: 'When followed picks are graded',
        defaultOn: true,
      },
      {
        id: 'urgentPick',
        label: 'Urgent picks',
        sub: 'Picks with cutoffs under 1h',
        defaultOn: true,
      },
    ],
  },
  {
    title: 'Billing',
    eyebrow: 'Billing',
    sub: 'Renewals, failed payments, price changes.',
    items: [
      {
        id: 'billing',
        label: 'Billing alerts',
        sub: 'Failed payments and renewals',
        defaultOn: true,
      },
      {
        id: 'priceChange',
        label: 'Price changes',
        sub: 'Creator pricing updates',
        defaultOn: true,
      },
    ],
  },
  {
    title: 'Community',
    eyebrow: 'Community',
    sub: 'Weekly digest and reply notifications.',
    items: [
      {
        id: 'digest',
        label: 'Weekly digest',
        sub: 'Top picks and win-rate movers',
        defaultOn: false,
      },
      { id: 'community', label: 'Mentions', sub: 'When someone replies to you', defaultOn: false },
    ],
  },
];

export function AccountSettings() {
  const navigate = useNavigate();
  const me = useQuery(api.users.me);
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = React.useState('');
  const [locale, setLocale] = React.useState<Locale>('en');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const [toggles, setToggles] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const section of NOTIFICATION_SECTIONS) {
      for (const item of section.items) initial[item.id] = item.defaultOn;
    }
    return initial;
  });

  const [weeklyCap, setWeeklyCap] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(false);
  const [privateProfile, setPrivateProfile] = React.useState(false);
  const [hideLeaderboards, setHideLeaderboards] = React.useState(false);

  React.useEffect(() => {
    if (me?.name) setName(me.name);
    if (me?.locale) setLocale(me.locale);
  }, [me?.name, me?.locale]);

  function setToggle(id: string) {
    return (next: boolean) => setToggles((prev) => ({ ...prev, [id]: next }));
  }

  async function handleSave() {
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

  const memberSince = me?._creationTime
    ? new Date(me._creationTime).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : '—';

  const aside = (
    <>
      <InsightCard
        tone="blue"
        eyebrow="Connected"
        title="Sign-in providers"
        sub="Add backup providers to stay locked in."
      >
        <Stack gap={0}>
          <PersonRow
            name="Google"
            sub={me?.email ?? 'Not connected'}
            mono="G"
            color="var(--brand-google)"
            trailing={<Badge tone="green">Connected</Badge>}
          />
          <Divider />
          <PersonRow
            name="Discord"
            sub="Not connected"
            mono="D"
            color="var(--brand-discord)"
            trailing={
              <Button variant="outline" size="sm">
                Connect
              </Button>
            }
          />
          <Divider />
          <PersonRow
            name="Apple"
            sub="Not connected"
            mono="A"
            color="var(--brand-apple)"
            trailing={
              <Button variant="outline" size="sm">
                Connect
              </Button>
            }
          />
        </Stack>
      </InsightCard>

      <InsightCard
        tone="green"
        eyebrow="Recommended"
        title="Responsible betting"
        sub="Soft guards to stay disciplined when variance bites."
      >
        <Stack gap={0}>
          <SwitchRow
            label="Weekly play cap"
            sub="Limit to 20 plays per week"
            checked={weeklyCap}
            onChange={setWeeklyCap}
          />
          <Divider />
          <SwitchRow
            label="Cooldown period"
            sub="Pause after 3+ losses in a row"
            checked={cooldown}
            onChange={setCooldown}
          />
        </Stack>
      </InsightCard>

      <InsightCard tone="mute" eyebrow="Privacy" title="Profile visibility">
        <Stack gap={0}>
          <SwitchRow
            label="Private profile"
            sub="Hide portfolio from other subscribers"
            checked={privateProfile}
            onChange={setPrivateProfile}
          />
          <Divider />
          <SwitchRow
            label="Hide from leaderboards"
            sub="Exclude me from public rankings"
            checked={hideLeaderboards}
            onChange={setHideLeaderboards}
          />
        </Stack>
      </InsightCard>

      <InsightCard
        tone="red"
        eyebrow="Danger zone"
        title="Pause or delete"
        sub="Pausing hides your activity. Deleting is permanent and cannot be undone."
      >
        <Row gap={2} wrap>
          <Button variant="outline" size="sm">
            Export data
          </Button>
          <Button variant="outline" size="sm">
            Pause
          </Button>
          <Button variant="danger" size="sm">
            Delete
          </Button>
        </Row>
      </InsightCard>
    </>
  );

  return (
    <>
      <PageHeader
        title="Settings"
        crumbs={[{ label: 'Account' }, { label: 'Settings' }]}
        actions={
          <Row gap={2}>
            {saved && (
              <Badge tone="green" dot>
                Saved
              </Badge>
            )}
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              <Icon name="check" size={13} />
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </Row>
        }
      />

      <Container size="2xl">
        <Stack gap={6}>
          <PageHead
            eyebrow="Account"
            title="Settings"
            sub="Profile, notifications, privacy, and connected accounts — fine-tune how DigiPicks works for you."
          />

          {error && (
            <InsightCard
              tone="red"
              eyebrow="Save failed"
              title="Could not update your profile"
              sub={error}
              action={
                <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                  Dismiss
                </Button>
              }
            />
          )}

          <DashGrid aside={aside}>
            {/* Identity & profile */}
            <SectionHead
              eyebrow="Profile"
              title="Your identity"
              sub="How you appear across DigiPicks."
              action={
                <Badge tone={me?.creatorId ? 'green' : 'blue'}>
                  {me?.creatorId ? 'Creator' : 'Subscriber'}
                </Badge>
              }
            />
            <Card pad="md">
              <Stack gap={4}>
                <PersonRow
                  name={me?.name ?? 'Loading…'}
                  sub={me?.email ?? ''}
                  mono={me?.name?.[0]?.toUpperCase() ?? 'U'}
                  color="var(--primary)"
                  size={48}
                  trailing={<Badge tone="mute">{`Member since ${memberSince}`}</Badge>}
                />
                <Divider />
                <Field label="Display name" required>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input value={me?.email ?? ''} readOnly />
                </Field>
                <Field label="Language">
                  <Select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
                    {LOCALE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </Stack>
            </Card>

            {/* Notifications */}
            <SectionHead
              eyebrow="Notifications"
              title="What you hear from us"
              sub="Pick alerts, billing notices, and community signals."
            />
            {NOTIFICATION_SECTIONS.map((section) => (
              <Card key={section.title} pad="md">
                <CardHead title={section.title} sub={section.sub} />
                <Stack gap={0}>
                  {section.items.map((item, i) => (
                    <React.Fragment key={item.id}>
                      {i > 0 && <Divider />}
                      <SwitchRow
                        label={item.label}
                        sub={item.sub}
                        checked={toggles[item.id] ?? false}
                        onChange={setToggle(item.id)}
                      />
                    </React.Fragment>
                  ))}
                </Stack>
              </Card>
            ))}

            {/* Creator CTA */}
            {!me?.creatorId && (
              <InsightCard
                tone="amber"
                eyebrow="Become a creator"
                title="Have a track record? Publish picks."
                sub="Apply once, get verified, and keep 87% of every subscription."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    iconRight="arrow-right"
                    onClick={() => navigate('/apply')}
                  >
                    Apply now
                  </Button>
                }
              />
            )}
          </DashGrid>
        </Stack>
      </Container>
    </>
  );
}
