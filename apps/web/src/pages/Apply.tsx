import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConvexAuth, useMutation, useQuery } from '../auth/convexAuth';
import { api } from '../../../../convex/_generated/api';
import {
  Container,
  PageHead,
  Card,
  CardHead,
  Stack,
  Row,
  Grid,
  Field,
  Input,
  TextArea,
  Select,
  Button,
  Icon,
  Badge,
  EmptyState,
  SplitPageLayout,
  ProcessSteps,
  FileUploadZone,
  Chip,
  Eyebrow,
  Heading,
  Muted,
  Serif,
  Placeholder,
} from '@digipicks/ds';
import { formatAuthError } from '../lib/formatAuthError';
import { useApplicationsMine } from '../lib/useApplicationsMine';

const SPORT_OPTIONS = [
  'NFL',
  'NBA',
  'MLB',
  'Premier League',
  'UFC',
  'Soccer',
  'Cricket',
  'Tennis',
] as const;

const AUDIENCE_RANGES = [
  { value: '', label: 'Select range' },
  { value: '1k-10k', label: '1,000 – 10,000' },
  { value: '10k-50k', label: '10,000 – 50,000' },
  { value: '50k-250k', label: '50,000 – 250,000' },
  { value: '250k+', label: '250,000+' },
] as const;

const REVIEW_STEPS = [
  {
    title: 'Manual review',
    body: '2–3 business days to assess your niche and audience fit.',
  },
  {
    title: 'Verification check',
    body: 'Rigorous audit of provided performance proof.',
  },
  {
    title: 'Interview',
    body: 'A short virtual briefing with our curation team (if required).',
  },
  {
    title: 'Access granted',
    body: 'Onboarding to the DigiPicks creator studio.',
  },
] as const;

function ApplySection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card pad="xl" elev>
      <Stack gap={6}>
        <CardHead icon={icon} title={title} />
        {children}
      </Stack>
    </Card>
  );
}

const PENDING_STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted — awaiting review',
  review: 'In manual review',
  more_info: 'More information requested',
  flagged: 'Flagged for additional review',
  approved: 'Approved',
};

export function Apply() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');
  const { existingApp, backendStale } = useApplicationsMine(isAuthenticated);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const submitApplication = useMutation(api.applications.submit);
  const needsAccount = !isAuthenticated;
  const pendingApp = existingApp && existingApp.status !== 'rejected' ? existingApp : null;

  const profileKey = me?._id ?? 'anon';

  useEffect(() => {
    if (me?.creatorId) {
      navigate('/dashboard', { replace: true });
    }
  }, [me?.creatorId, navigate]);

  function toggleSport(sport: string) {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (selectedSports.length === 0) {
      setError('Select at least one primary sport.');
      return;
    }

    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const bio = (data.get('bio') as string)?.trim() ?? '';
    const trackRecord = (data.get('trackRecord') as string)?.trim() ?? '';
    const audienceRange = data.get('audience') as string as string;
    const social = (data.get('social') as string)?.trim() ?? '';
    const audienceParts = [audienceRange, social].filter(Boolean);

    const winClaim = [bio, trackRecord].filter(Boolean).join('\n\n');
    const email = (me?.email ?? (data.get('email') as string))?.trim() ?? '';
    if (!email) {
      setError('Your account needs an email before you can apply.');
      setLoading(false);
      return;
    }

    try {
      await submitApplication({
        name: data.get('name') as string,
        handle: data.get('handle') as string,
        email: email.toLowerCase(),
        sport: selectedSports.join(', '),
        niche: data.get('niche') as string,
        existingFollowing: audienceParts.length > 0 ? audienceParts.join(' · ') : undefined,
        priceHint: (data.get('priceHint') as string)?.trim() || undefined,
        proofCount: 0,
        winClaim: winClaim || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <Container size="xl">
        <PageHead
          title="Apply to the Creator Network"
          sub={
            needsAccount
              ? 'Start with a subscriber account, then tell us about your edge — we review every application manually.'
              : 'Signed in as a subscriber. Complete your creator application below — we review every submission manually.'
          }
          actions={
            needsAccount ? (
              <Row gap={2} wrap>
                <Button
                  variant="primary"
                  size="sm"
                  iconRight="arrow-right"
                  onClick={() => navigate('/auth?next=/apply')}
                >
                  Create subscriber account
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/auth?next=/apply')}>
                  Sign in
                </Button>
              </Row>
            ) : (
              <Badge tone="green" dot>
                Subscriber account
              </Badge>
            )
          }
        />

        {needsAccount ? (
          <SplitPageLayout
            main={
              <Card pad="xl" elev>
                <EmptyState
                  icon="user"
                  title="Subscriber account required"
                  subtitle="Every creator starts as a DigiPicks member. Use the buttons above to create a free subscriber login or sign in — then return here to submit your creator application."
                />
              </Card>
            }
            aside={
              <Stack gap={6}>
                <ProcessSteps steps={[...REVIEW_STEPS]} />
                <Card pad="xl">
                  <Stack gap={3}>
                    <Eyebrow>How it works</Eyebrow>
                    <Serif>
                      1. Create your subscriber login · 2. Submit your creator application · 3. Our
                      team reviews your proof and niche fit · 4. Studio access after approval.
                    </Serif>
                  </Stack>
                </Card>
              </Stack>
            }
          />
        ) : backendStale ? (
          <Card pad="lg" elev>
            <EmptyState
              icon="gear"
              title="Backend update required"
              subtitle="This site's Convex deployment is missing creator application APIs. In Vercel, set VITE_CONVEX_URL to your production Convex URL (e.g. https://zealous-hyena-147.convex.cloud), then run npx convex deploy from the repo root."
            />
          </Card>
        ) : pendingApp && !submitted ? (
          <Card pad="xl" elev>
            <EmptyState
              icon="inbox"
              title="Application on file"
              subtitle={
                PENDING_STATUS_LABEL[pendingApp.status] ?? 'Your application is being processed.'
              }
              action={
                <Button variant="outline" onClick={() => navigate('/account')}>
                  Go to member hub
                </Button>
              }
            />
          </Card>
        ) : submitted ? (
          <Card pad="xl" elev>
            <EmptyState
              icon="check"
              title="Application received."
              subtitle="Thanks for applying. Our team reviews every submission personally — you'll hear back within 5 business days."
              action={
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Submit another
                </Button>
              }
            />
          </Card>
        ) : (
          <SplitPageLayout
            main={
              <form onSubmit={handleSubmit} key={profileKey}>
                <Stack gap={8}>
                  <ApplySection icon={<Icon name="user" size={18} />} title="Professional profile">
                    <Stack gap={5}>
                      <Grid cols={2} gap={4} stagger={false}>
                        <Field label="Legal name" required htmlFor="apply-name">
                          <Input
                            id="apply-name"
                            name="name"
                            placeholder="John Doe"
                            required
                            defaultValue={me?.name ?? ''}
                          />
                        </Field>
                        <Field label="Creator handle" required htmlFor="apply-handle">
                          <Input id="apply-handle" name="handle" placeholder="@handle" required />
                        </Field>
                      </Grid>
                      <Field
                        label="Account email"
                        required
                        htmlFor="apply-email"
                        help="Must match your signed-in subscriber account."
                      >
                        <Input
                          id="apply-email"
                          name="email"
                          type="email"
                          placeholder="contact@example.com"
                          required
                          readOnly
                          defaultValue={me?.email ?? ''}
                        />
                      </Field>
                    </Stack>
                  </ApplySection>

                  <ApplySection icon={<Icon name="trophy" size={18} />} title="Coverage & niche">
                    <Stack gap={5}>
                      <Field
                        label="Primary sports"
                        required
                        help="Select every sport you publish picks for."
                      >
                        <Row gap={2} wrap>
                          {SPORT_OPTIONS.map((sport) => (
                            <Chip
                              key={sport}
                              type="button"
                              active={selectedSports.includes(sport)}
                              onClick={() => toggleSport(sport)}
                            >
                              {sport}
                            </Chip>
                          ))}
                        </Row>
                      </Field>
                      <Field label="Content niche statement" required htmlFor="apply-niche">
                        <Input
                          id="apply-niche"
                          name="niche"
                          placeholder="e.g. Deep analytics-driven player props for NFL"
                          required
                        />
                      </Field>
                      <Field label="Professional bio" required htmlFor="apply-bio">
                        <TextArea
                          id="apply-bio"
                          name="bio"
                          rows={4}
                          placeholder="Briefly describe your editorial background and expertise…"
                          required
                        />
                      </Field>
                    </Stack>
                  </ApplySection>

                  <ApplySection icon={<Icon name="users" size={18} />} title="Audience & reach">
                    <Grid cols={2} gap={4} stagger={false}>
                      <Field label="Total audience size" htmlFor="apply-audience">
                        <Select id="apply-audience" name="audience" defaultValue="">
                          {AUDIENCE_RANGES.map((opt) => (
                            <option
                              key={opt.value || 'empty'}
                              value={opt.value}
                              disabled={!opt.value}
                            >
                              {opt.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Social links" htmlFor="apply-social">
                        <Input
                          id="apply-social"
                          name="social"
                          placeholder="Twitter/X, Substack, etc."
                        />
                      </Field>
                    </Grid>
                  </ApplySection>

                  <ApplySection
                    icon={<Icon name="chart" size={18} />}
                    title="Evidence of performance"
                  >
                    <Stack gap={5}>
                      <Field label="Price intent" htmlFor="apply-price-hint">
                        <Input
                          id="apply-price-hint"
                          name="priceHint"
                          placeholder="Average ROI or historical win rate"
                        />
                      </Field>
                      <Field
                        label="Description of track record"
                        required
                        htmlFor="apply-track-record"
                      >
                        <TextArea
                          id="apply-track-record"
                          name="trackRecord"
                          rows={3}
                          placeholder="Detail your verification methods and historical performance…"
                          required
                        />
                      </Field>
                    </Stack>
                  </ApplySection>

                  <ApplySection icon={<Icon name="inbox" size={18} />} title="Proof of performance">
                    <FileUploadZone
                      disabled
                      fileCount={0}
                      hint="File upload is temporarily disabled. Describe your track record above; our team may request proof documents by email after submission."
                    />
                  </ApplySection>

                  {error ? <Badge tone="red">{error}</Badge> : null}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    block
                    disabled={loading}
                    iconRight={loading ? undefined : 'arrow-right'}
                  >
                    {loading ? 'Submitting…' : 'Submit application'}
                  </Button>
                </Stack>
              </form>
            }
            aside={
              <Stack gap={6}>
                <ProcessSteps steps={[...REVIEW_STEPS]} />

                <Card pad="xl">
                  <Stack gap={3}>
                    <Eyebrow>Verification expectations</Eyebrow>
                    <Serif>
                      Transparency is the cornerstone of the DigiPicks network. All prospective
                      creators must provide externally verifiable track records. We prioritize
                      integrity over hype.
                    </Serif>
                  </Stack>
                </Card>

                <Card pad="lg" elev>
                  <Stack gap={4}>
                    <Placeholder label="Network" height={160} radius="xl" />
                    <Stack gap={1}>
                      <Eyebrow>Network status</Eyebrow>
                      <Heading level={4} size="lg">
                        Join the top 1% of digital curators.
                      </Heading>
                      <Muted>Studio access unlocks after approval.</Muted>
                    </Stack>
                  </Stack>
                </Card>
              </Stack>
            }
          />
        )}
      </Container>
    </main>
  );
}
