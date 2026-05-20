import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConvexAuth } from 'convex/react';
import { useMutation } from 'convex/react';
import {
  Container,
  Stack,
  Grid,
  Icon,
  StudioPageHeader,
  Button,
  Card,
  CardHead,
  Field,
  Input,
  TextArea,
  Select,
  KV,
  InsightCard,
  StudioSummaryGrid,
  StudioSubNav,
  QuickActionGrid,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { STUDIO } from '../../lib/studioRoutes';
import { studioCrossLinks } from '../../lib/studioCrossLinks';
import { useStudioContext } from '../useStudioContext';
import { StudioDevHint } from '../StudioDevHint';

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

const VIEW_TABS = [
  { label: 'Public profile', value: 'public' },
  { label: 'Verification', value: 'verify' },
];

const DEMO_PROFILE = {
  name: 'Elite Editor',
  email: 'creator@digipicks.dev',
  locale: 'en' as Locale,
  bio: 'Premium sports analysis with transparent records and subscriber-first picks.',
  niche: NICHE_OPTIONS[0]!,
  handle: 'elite-editor',
  verified: true,
  status: 'active',
};

export function Profile() {
  const navigate = useNavigate();
  const ctx = useStudioContext();
  const { isAuthenticated } = useConvexAuth();
  const updateUser = useMutation(api.users.updateProfile);
  const updateCreator = useMutation(api.creators.updateStudioProfile);

  const [view, setView] = React.useState('public');
  const [name, setName] = React.useState('');
  const [locale, setLocale] = React.useState<Locale>('en');
  const [bio, setBio] = React.useState('');
  const [niche, setNiche] = React.useState(NICHE_OPTIONS[0]!);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const useDemo = ctx.devPreview && !ctx.me;
  const canSave = isAuthenticated && Boolean(ctx.me);

  React.useEffect(() => {
    if (useDemo) {
      setName(DEMO_PROFILE.name);
      setLocale(DEMO_PROFILE.locale);
      setBio(DEMO_PROFILE.bio);
      setNiche(DEMO_PROFILE.niche);
      return;
    }
    if (ctx.me?.name) setName(ctx.me.name);
    if (ctx.me?.locale) setLocale(ctx.me.locale);
  }, [useDemo, ctx.me?.name, ctx.me?.locale]);

  React.useEffect(() => {
    if (useDemo) return;
    if (ctx.creator?.bio) setBio(ctx.creator.bio);
    if (ctx.creator?.niche) setNiche(ctx.creator.niche);
    if (ctx.creator?.name && !ctx.me?.name) setName(ctx.creator.name);
  }, [useDemo, ctx.creator?.bio, ctx.creator?.niche, ctx.creator?.name, ctx.me?.name]);

  async function handleSave() {
    if (!canSave) {
      setError('Sign in with a creator account to save profile changes.');
      return;
    }
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateUser({ name, locale });
      if (ctx.creator?._id) {
        await updateCreator({
          creatorId: ctx.creator._id,
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

  const handle = useDemo ? DEMO_PROFILE.handle : ctx.creator?.handle;
  const publicUrl = handle ? `/creators/${handle}` : null;
  const email = useDemo ? DEMO_PROFILE.email : (ctx.me?.email ?? '—');
  const verified = useDemo ? DEMO_PROFILE.verified : Boolean(ctx.creator?.verified);
  const status = useDemo ? DEMO_PROFILE.status : (ctx.creator?.status ?? '—');

  const bioComplete = bio.trim().length >= 20;
  const profileComplete = Boolean(name.trim() && bioComplete && niche);

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Profile"
          title="Profile"
          sub="What subscribers see on your public creator page."
          actions={
            <>
              {publicUrl ? (
                <Button variant="outline" onClick={() => navigate(publicUrl)}>
                  View public page
                </Button>
              ) : null}
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </Button>
            </>
          }
        />

        <StudioSubNav items={VIEW_TABS} value={view} onChange={setView} />

        <StudioSummaryGrid
          columns={3}
          items={[
            {
              id: 'complete',
              icon: 'user',
              iconTone: profileComplete ? 'primary' : 'amber',
              label: 'Profile completeness',
              value: profileComplete ? 'Complete' : 'In progress',
              delta: profileComplete
                ? { value: 'Ready', dir: 'up' as const }
                : { value: 'Add bio', dir: 'flat' as const },
              active: view === 'public',
              onClick: () => setView('public'),
            },
            {
              id: 'verify',
              icon: 'verified',
              iconTone: verified ? 'primary' : 'danger',
              label: 'Verification',
              value: verified ? 'Verified' : 'Pending',
              active: view === 'verify',
              onClick: () => setView('verify'),
            },
            {
              id: 'handle',
              icon: 'link',
              iconTone: 'violet',
              label: 'Public handle',
              value: handle ? `@${handle}` : '—',
              onClick: () => (publicUrl ? navigate(publicUrl) : undefined),
            },
          ]}
        />

        {useDemo ? (
          <StudioDevHint message="Sample profile shown below. Sign in with a creator account to edit and save your public page." />
        ) : null}

        {saved ? (
          <InsightCard
            tone="green"
            icon={<Icon name="check" size={22} />}
            title="Profile saved"
            sub="Your public creator page will reflect these updates shortly."
          />
        ) : null}

        {error ? <InsightCard tone="red" title="Could not save" sub={error} /> : null}

        {view === 'public' ? (
          <Card pad="lg" elev>
            <CardHead title="Public profile" sub="Display name, bio, and niche" />
            <Stack gap={4}>
              <Field label="Display name" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Email">
                <Input value={email} readOnly />
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
        ) : null}

        {view === 'verify' ? (
          <Grid cols={2} gap={6} stagger={false}>
            <Card pad="lg" elev>
              <CardHead title="Verification" sub="Platform status for your studio" />
              <Stack gap={2}>
                <KV k="Identity" v={verified ? 'Verified' : 'Not verified'} />
                <KV k="Status" v={status} />
                <KV k="Handle" v={handle ? `@${handle}` : '—'} />
              </Stack>
            </Card>

            <Card pad="lg" elev>
              <CardHead title="Studio presence" sub="Tie your brand to pricing and picks" />
              <Stack gap={3}>
                <InsightCard
                  tone="blue"
                  icon={<Icon name="sparkles" size={20} />}
                  title="Grow your brand"
                  sub="Subscribers discover you through picks and plans. Keep your profile aligned with what you publish."
                />
                <Stack gap={2}>
                  <Button variant="secondary" onClick={() => navigate(STUDIO.products)}>
                    Edit plans
                  </Button>
                  <Button variant="secondary" onClick={() => navigate(STUDIO.picks)}>
                    Manage picks
                  </Button>
                </Stack>
              </Stack>
            </Card>
          </Grid>
        ) : null}

        <QuickActionGrid title="Related" items={studioCrossLinks('profile', navigate)} />
      </Stack>
    </Container>
  );
}
