import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Heading,
  Eyebrow,
  Muted,
  Button,
  Card,
  CardHead,
  Field,
  Input,
  TextArea,
  Select,
  KV,
  QuickActionGrid,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { STUDIO } from '../../lib/studioRoutes';
import { studioCrossLinks } from '../../lib/studioCrossLinks';

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

export function Profile() {
  const navigate = useNavigate();
  const me = useQuery(api.users.me);
  const creator = useQuery(api.creators.get, me?.creatorId ? { id: me.creatorId } : 'skip');
  const updateUser = useMutation(api.users.updateProfile);
  const updateCreator = useMutation(api.creators.updateStudioProfile);

  const [name, setName] = React.useState('');
  const [locale, setLocale] = React.useState<Locale>('en');
  const [bio, setBio] = React.useState('');
  const [niche, setNiche] = React.useState(NICHE_OPTIONS[0]!);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (me?.name) setName(me.name);
    if (me?.locale) setLocale(me.locale);
  }, [me?.name, me?.locale]);

  React.useEffect(() => {
    if (creator?.bio) setBio(creator.bio);
    if (creator?.niche) setNiche(creator.niche);
    if (creator?.name && !me?.name) setName(creator.name);
  }, [creator?.bio, creator?.niche, creator?.name, me?.name]);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateUser({ name, locale });
      if (creator?._id) {
        await updateCreator({
          creatorId: creator._id,
          name,
          bio,
          niche,
        });
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  const publicUrl = creator?.handle ? `/creators/${creator.handle}` : null;

  return (
    <Container size="xl">
      <Stack gap={8}>
        <Row between wrap>
          <Stack gap={2}>
            <Eyebrow>Studio · Profile</Eyebrow>
            <Heading level={1} size="2xl">
              Profile
            </Heading>
            <Muted>What subscribers see on your public creator page.</Muted>
          </Stack>
          <Row gap={2} wrap>
            {publicUrl ? (
              <Button variant="outline" size="sm" onClick={() => navigate(publicUrl)}>
                View public page
              </Button>
            ) : null}
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          </Row>
        </Row>

        {error ? <Muted>{error}</Muted> : null}
        {saved ? <Muted>Profile saved.</Muted> : null}

        <Row gap={5} wrap>
          <Stack gap={4}>
            <Card>
              <CardHead title="Public profile" sub="Display name, bio, and niche" />
              <Stack gap={4}>
                <Field label="Display name" required>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input value={me?.email ?? ''} readOnly />
                </Field>
                <Field label="Locale">
                  <Select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
                    {LOCALE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </Field>
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
          </Stack>

          <Stack gap={4}>
            <Card>
              <CardHead title="Verification" sub="Platform status for your studio" />
              <Stack gap={2}>
                <KV k="Identity" v={creator?.verified ? 'Verified' : 'Not verified'} />
                <KV k="Status" v={creator?.status ?? '—'} />
                <KV k="Handle" v={creator?.handle ? `@${creator.handle}` : '—'} />
              </Stack>
            </Card>

            <Card>
              <CardHead title="Studio presence" sub="Tie your brand to pricing and picks" />
              <Stack gap={3}>
                <Muted>
                  Subscribers discover you through picks and plans. Keep your profile aligned with
                  what you publish.
                </Muted>
                <Row gap={2} wrap>
                  <Button variant="secondary" size="sm" onClick={() => navigate(STUDIO.products)}>
                    Edit plans
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate(STUDIO.picks)}>
                    Manage picks
                  </Button>
                </Row>
              </Stack>
            </Card>
          </Stack>
        </Row>

        <QuickActionGrid title="Related" items={studioCrossLinks('profile', navigate)} />
      </Stack>
    </Container>
  );
}
