import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  Badge,
  Muted,
  Mono,
  KV,
  Divider,
  SwitchRow,
  PersonRow,
  DashGrid,
  Field,
  Input,
  Select,
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
    items: [
      {
        id: 'newPick',
        label: 'New pick alerts',
        sub: 'When a subscribed creator publishes a new pick',
        defaultOn: true,
      },
      {
        id: 'gradeAlert',
        label: 'Grading updates',
        sub: 'When your followed picks are graded',
        defaultOn: true,
      },
      {
        id: 'urgentPick',
        label: 'Urgent picks',
        sub: 'Push notifications for picks with cutoffs under 1h',
        defaultOn: true,
      },
    ],
  },
  {
    title: 'Billing notifications',
    items: [
      {
        id: 'billing',
        label: 'Billing alerts',
        sub: 'Failed payments, renewals, and refund confirmations',
        defaultOn: true,
      },
      {
        id: 'priceChange',
        label: 'Price changes',
        sub: 'When a creator updates their subscription pricing',
        defaultOn: true,
      },
    ],
  },
  {
    title: 'Community notifications',
    items: [
      {
        id: 'digest',
        label: 'Weekly digest',
        sub: 'Top picks, new creators, and win-rate movers',
        defaultOn: false,
      },
      {
        id: 'community',
        label: 'Community mentions',
        sub: 'When someone replies to your message',
        defaultOn: false,
      },
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
      for (const item of section.items) {
        initial[item.id] = item.defaultOn;
      }
    }
    return initial;
  });

  const [weeklyCap, setWeeklyCap] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(false);
  const [privateProfile, setPrivateProfile] = React.useState(false);

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
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  // ── Sidebar ──────────────────────────────────────────────────────────
  const aside = (
    <>
      {/* Connected accounts */}
      <Card>
        <CardHead title="Connected accounts" />
        <Stack gap={0}>
          <PersonRow
            name="Google"
            sub={me?.email ?? 'Not connected'}
            mono="G"
            color="#4285F4"
            trailing={<Badge tone="green">Connected</Badge>}
          />
          <Divider />
          <PersonRow
            name="Discord"
            sub="Not connected"
            mono="D"
            color="#5865F2"
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
            color="#333"
            trailing={
              <Button variant="outline" size="sm">
                Connect
              </Button>
            }
          />
        </Stack>
      </Card>

      {/* Responsible betting */}
      <Card>
        <CardHead title="Responsible betting" action={<Badge tone="green">Recommended</Badge>} />
        <Stack gap={0}>
          <SwitchRow
            label="Weekly play cap"
            sub="Limit follows to 20 per week"
            checked={weeklyCap}
            onChange={setWeeklyCap}
          />
          <Divider />
          <SwitchRow
            label="Cooldown period"
            sub="Pause follows for 24h after 3+ losses"
            checked={cooldown}
            onChange={setCooldown}
          />
        </Stack>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHead title="Privacy" />
        <Stack gap={0}>
          <SwitchRow
            label="Private profile"
            sub="Hide your portfolio from other users"
            checked={privateProfile}
            onChange={setPrivateProfile}
          />
          <Divider />
          <SwitchRow
            label="Hide from leaderboards"
            sub="Exclude from subscriber rankings"
            checked={false}
            onChange={() => {}}
          />
        </Stack>
      </Card>

      {/* Account info */}
      <Card>
        <CardHead title="Account info" />
        <Stack gap={0}>
          <KV k="User ID" v={<Mono>{me?._id ? String(me._id).slice(0, 16) + '…' : '—'}</Mono>} />
          <Divider />
          <KV
            k="Role"
            v={
              <Badge tone={me?.creatorId ? 'green' : 'blue'}>
                {me?.creatorId ? 'Creator' : 'Subscriber'}
              </Badge>
            }
          />
          <Divider />
          <KV k="Auth" v={<Mono>Google OAuth</Mono>} />
          <Divider />
          <KV
            k="Since"
            v={
              <Mono>
                {me?._creationTime ? new Date(me._creationTime).toLocaleDateString() : '—'}
              </Mono>
            }
          />
        </Stack>
      </Card>

      {/* Danger zone */}
      <Card>
        <CardHead title="Danger zone" />
        <Stack gap={3}>
          <Muted>Pausing hides your activity. Deleting is permanent and cannot be undone.</Muted>
          <Row gap={2}>
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
        </Stack>
      </Card>
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
        <Stack gap={5}>
          {error && (
            <Card>
              <PersonRow
                name="Error saving"
                sub={error}
                mono="!"
                color="var(--red)"
                trailing={
                  <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                    Dismiss
                  </Button>
                }
              />
            </Card>
          )}

          <DashGrid aside={aside}>
            {/* Profile */}
            <Card>
              <CardHead
                title="Profile"
                sub="Your public identity"
                action={
                  me?.creatorId ? (
                    <Badge tone="green">Creator</Badge>
                  ) : (
                    <Badge tone="blue">Subscriber</Badge>
                  )
                }
              />
              <Stack gap={4}>
                <PersonRow
                  name={me?.name ?? 'Loading…'}
                  sub={me?.email ?? ''}
                  mono={me?.name?.[0]?.toUpperCase() ?? 'U'}
                  color="var(--primary)"
                  trailing={
                    <Muted>
                      Since{' '}
                      {me?._creationTime
                        ? new Date(me._creationTime).toLocaleDateString(undefined, {
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </Muted>
                  }
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

            {/* Notification preferences */}
            {NOTIFICATION_SECTIONS.map((section) => (
              <Card key={section.title}>
                <CardHead title={section.title} />
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

            {/* Creator application CTA */}
            {!me?.creatorId && (
              <Card>
                <CardHead title="Become a creator" />
                <Stack gap={2}>
                  <Muted>
                    Have a track record? Apply to publish picks on DigiPicks. Set your pricing, keep
                    87% of revenue.
                  </Muted>
                  <Button
                    variant="primary"
                    size="sm"
                    iconRight="arrow-right"
                    onClick={() => navigate('/apply')}
                  >
                    Apply for creator access
                  </Button>
                </Stack>
              </Card>
            )}
          </DashGrid>
        </Stack>
      </Container>
    </>
  );
}
