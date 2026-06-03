import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Badge,
  PickCard,
  StudioPageHeader,
  StudioDashLayout,
  StudioDashCol,
  StudioComposerAside,
  PickForm,
  Muted,
  type PickFormValue,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { STUDIO } from '../../lib/studioRoutes';

const SPORTS = ['Soccer', 'Cricket', 'Tennis', 'Basketball', 'Football', 'NFL', 'NBA'];

const MARKET_OPTIONS = [
  'Moneyline',
  'Spread',
  '1H Over/Under',
  'Total Over/Under',
  'Player Prop',
  'Goalscorer',
  'Both Teams to Score',
];

const ACCESS_OPTIONS = [
  { label: 'Free', value: 'free' as const },
  { label: 'Premium', value: 'premium' as const },
  { label: 'VIP', value: 'vip' as const },
];

const CONFIDENCE_OPTIONS = [
  { value: 'Low' as const, label: 'Low' },
  { value: 'Medium' as const, label: 'Medium' },
  { value: 'High' as const, label: 'High' },
];

const INITIAL_VALUE: PickFormValue = {
  title: '',
  sport: 'Soccer',
  league: '',
  eventName: '',
  eventTime: '',
  market: 'Moneyline',
  selection: '',
  odds: '-110',
  units: '1u',
  confidence: 'Medium',
  body: '',
  access: 'premium',
};

const ACCESS_BADGE: Record<PickFormValue['access'], 'mute' | 'violet' | 'amber'> = {
  free: 'mute',
  premium: 'violet',
  vip: 'amber',
};

function isPickReady(value: PickFormValue): boolean {
  return Boolean(
    value.title.trim() && value.eventName.trim() && value.selection.trim() && value.market,
  );
}

function pickToFormValue(pick: {
  title: string;
  sport: string;
  league: string;
  eventName: string;
  eventTime: string;
  market: string;
  selection: string;
  odds: string;
  units: string;
  confidence: 'Low' | 'Medium' | 'High';
  body?: string;
  access: 'free' | 'premium' | 'vip';
}): PickFormValue {
  return {
    title: pick.title,
    sport: pick.sport,
    league: pick.league,
    eventName: pick.eventName,
    eventTime: pick.eventTime,
    market: pick.market,
    selection: pick.selection,
    odds: pick.odds,
    units: pick.units,
    confidence: pick.confidence,
    body: pick.body ?? '',
    access: pick.access,
  };
}

export function CreatePick() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pickIdParam = searchParams.get('pickId');
  const pickId = pickIdParam ? (pickIdParam as Id<'picks'>) : null;

  const me = useQuery(api.users.meSafe);
  const creator = useQuery(api.creators.get, me?.creatorId ? { id: me.creatorId } : 'skip');
  const existingPick = useQuery(api.picks.getForStudio, pickId ? { pickId } : 'skip');
  const createPick = useMutation(api.picks.create);
  const updatePick = useMutation(api.picks.update);

  const [form, setForm] = React.useState<PickFormValue>(INITIAL_VALUE);
  const [hydrated, setHydrated] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const isEdit = Boolean(pickId && existingPick);

  React.useEffect(() => {
    if (!pickId || !existingPick || hydrated) return;
    setForm(pickToFormValue(existingPick));
    setHydrated(true);
  }, [pickId, existingPick, hydrated]);

  const ready = isPickReady(form);

  async function handleSubmit(status: 'draft' | 'published') {
    if (!creator?._id) {
      setError('No creator profile is attached to your account yet.');
      return;
    }
    if (!ready) {
      setError('Add a title, event, market, and selection before saving.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (isEdit && pickId) {
        await updatePick({
          pickId,
          access: form.access,
          sport: form.sport,
          league: form.league,
          eventName: form.eventName,
          eventTime: form.eventTime,
          title: form.title.trim(),
          market: form.market,
          selection: form.selection.trim(),
          odds: form.odds,
          units: form.units,
          confidence: form.confidence,
          body: form.body || undefined,
          status,
        });
      } else {
        await createPick({
          creatorId: creator._id,
          access: form.access,
          sport: form.sport,
          league: form.league,
          eventName: form.eventName,
          eventTime: form.eventTime,
          title: form.title.trim(),
          market: form.market,
          selection: form.selection.trim(),
          odds: form.odds,
          units: form.units,
          confidence: form.confidence,
          body: form.body || undefined,
          status,
        });
      }
      navigate(STUDIO.picks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save pick.');
    } finally {
      setSubmitting(false);
    }
  }

  const previewTitle = form.title.trim() || 'Your pick headline';
  const accessLabel =
    form.access === 'vip' ? 'VIP' : form.access === 'premium' ? 'Premium' : 'Free';

  const loadingEdit = Boolean(pickId) && existingPick === undefined;

  return (
    <Container size="xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Posts"
          title={isEdit ? 'Edit pick' : 'New pick'}
          sub={
            isEdit
              ? 'Update the headline, wager, and access tier — subscribers see changes after you publish.'
              : 'Build a clear headline, lock in the wager, and preview exactly what subscribers will see before you publish.'
          }
          actions={
            <Row gap={2}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(STUDIO.picks)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSubmit('draft')}
                disabled={submitting || !creator || !ready || loadingEdit}
              >
                Save draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                iconRight="arrow-right"
                onClick={() => handleSubmit('published')}
                disabled={submitting || !creator || !ready || loadingEdit}
              >
                {isEdit ? 'Save changes' : 'Publish now'}
              </Button>
            </Row>
          }
        />

        {loadingEdit ? <Muted>Loading pick…</Muted> : null}

        {error ? (
          <Card pad="md">
            <Row gap={3}>
              <Badge tone="red" dot>
                Error
              </Badge>
              <Muted>{error}</Muted>
            </Row>
          </Card>
        ) : null}

        {!ready ? (
          <Muted>
            Complete title, event, market, and selection to enable publish. Analysis and league are
            optional but recommended.
          </Muted>
        ) : null}

        <StudioDashLayout>
          <StudioDashCol span={8}>
            <Card pad="xl" elev>
              <CardHead
                title={isEdit ? 'Edit pick' : 'Compose pick'}
                sub="Five steps — subscribers only see what you publish."
                action={
                  <Badge tone={ACCESS_BADGE[form.access]} dot>
                    {accessLabel}
                  </Badge>
                }
              />
              <PickForm
                value={form}
                onChange={setForm}
                sports={SPORTS}
                markets={MARKET_OPTIONS}
                accessOptions={ACCESS_OPTIONS}
                confidenceOptions={CONFIDENCE_OPTIONS}
                disabled={submitting || loadingEdit}
              />
            </Card>
          </StudioDashCol>

          <StudioDashCol span={4}>
            <StudioComposerAside
              previewSub="This is how the pick appears in subscriber feeds and on your public profile."
              tipTitle="Editorial tip"
              tipBody="Picks with clear matchup context and at least a few sentences of reasoning tend to retain subscribers longer. Call out injuries, line movement, or situational edges."
            >
              <PickCard
                creatorName={creator?.name ?? me?.name ?? 'You'}
                creatorHandle={creator?.handle ?? ''}
                creatorMono={creator?.avatarMono ?? ''}
                creatorColor={creator?.avatarColor ?? ''}
                creatorVerified={creator?.verified ?? false}
                access={form.access}
                sport={form.sport}
                event={form.eventName || 'Event name'}
                eventTime={form.eventTime || 'Kickoff TBD'}
                posted="Preview"
                title={previewTitle}
                market={form.market}
                selection={form.selection || '—'}
                odds={form.odds || '—'}
                units={form.units || '—'}
                body={form.body}
                status="pending"
              />
            </StudioComposerAside>
          </StudioDashCol>
        </StudioDashLayout>
      </Stack>
    </Container>
  );
}
