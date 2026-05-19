import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';
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
  PasswordInput,
  Button,
  Icon,
  Badge,
  EmptyState,
  ResponsibleSection,
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
import { DevCreatorStudioButton } from '../lib/DevCreatorStudioButton';

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

export function Apply() {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const submitApplication = useMutation(api.applications.submit);
  const needsAccount = !isAuthenticated;

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

  function appendProofFiles(files: File[]) {
    setProofFiles((prev) => [...prev, ...files]);
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
    const email = (data.get('email') as string)?.trim() ?? '';
    const passwordValue = String(data.get('password') ?? '').trim() || password;
    const passwordConfirmValue =
      String(data.get('passwordConfirm') ?? '').trim() || passwordConfirm;

    try {
      if (needsAccount) {
        if (passwordValue.length < 8) {
          setError('Password must be at least 8 characters.');
          setLoading(false);
          return;
        }
        if (passwordValue !== passwordConfirmValue) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const authFd = new FormData();
        authFd.set('email', email);
        authFd.set('password', passwordValue);
        authFd.set('flow', 'signUp');
        try {
          await signIn('password', authFd);
        } catch (signUpErr: unknown) {
          const msg = signUpErr instanceof Error ? signUpErr.message : String(signUpErr);
          if (!msg.includes('already exists')) {
            throw signUpErr;
          }
          authFd.set('flow', 'signIn');
          await signIn('password', authFd);
        }
      }

      await submitApplication({
        name: data.get('name') as string,
        handle: data.get('handle') as string,
        email: email.trim().toLowerCase(),
        sport: selectedSports.join(', '),
        niche: data.get('niche') as string,
        existingFollowing: audienceParts.length > 0 ? audienceParts.join(' · ') : undefined,
        priceHint: (data.get('priceHint') as string)?.trim() || undefined,
        proofCount: proofFiles.length,
        winClaim: winClaim || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(formatAuthError(err, needsAccount ? 'signUp' : 'signIn'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <Container size="xl">
        <PageHead
          title="Apply to the Creator Network"
          sub="We manually review every application to maintain our standard of excellence."
          actions={
            <Row gap={2} wrap>
              {needsAccount ? (
                <Button variant="outline" onClick={() => navigate('/auth?next=/apply')}>
                  Already have an account? Sign in
                </Button>
              ) : (
                <Badge tone="green" dot>
                  Signed in
                </Badge>
              )}
              <DevCreatorStudioButton onDevError={setError} />
            </Row>
          }
        />

        {submitted ? (
          <Card pad="xl" elev>
            <EmptyState
              icon="check"
              title="Application received."
              subtitle="Thanks for applying. Our team reviews every submission personally — you'll hear back within 5 business days."
              action={
                <Row gap={2} wrap>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Submit another
                  </Button>
                  <DevCreatorStudioButton variant="primary" />
                </Row>
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
                      <Field label="Professional email" required htmlFor="apply-email">
                        <Input
                          id="apply-email"
                          name="email"
                          type="email"
                          placeholder="contact@example.com"
                          required
                          defaultValue={me?.email ?? ''}
                        />
                      </Field>
                    </Stack>
                  </ApplySection>

                  {needsAccount ? (
                    <ApplySection icon={<Icon name="key" size={18} />} title="Create your login">
                      <Stack gap={5}>
                        <Muted>
                          Your application and account are created together. Use this email and
                          password to check status and sign in after approval.
                        </Muted>
                        <Grid cols={2} gap={4} stagger={false}>
                          <Field label="Password" required htmlFor="apply-password">
                            <PasswordInput
                              id="apply-password"
                              name="password"
                              placeholder="Create a password (min. 8 characters)"
                              autoComplete="new-password"
                              minLength={8}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                          </Field>
                          <Field label="Confirm password" required htmlFor="apply-password-confirm">
                            <PasswordInput
                              id="apply-password-confirm"
                              name="passwordConfirm"
                              placeholder="Re-enter your password"
                              autoComplete="new-password"
                              minLength={8}
                              required
                              value={passwordConfirm}
                              onChange={(e) => setPasswordConfirm(e.target.value)}
                            />
                          </Field>
                        </Grid>
                        <Muted>
                          Already applied or have an account?{' '}
                          <Link to="/auth?next=/apply">Sign in here</Link>
                        </Muted>
                      </Stack>
                    </ApplySection>
                  ) : (
                    <Card pad="lg">
                      <Stack gap={2}>
                        <Muted>
                          Signed in as {me?.email ?? 'your account'}. Submitting links this
                          application to your login.
                        </Muted>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/auth?next=/apply')}
                        >
                          Use a different account
                        </Button>
                      </Stack>
                    </Card>
                  )}

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
                      fileCount={proofFiles.length}
                      onFilesSelected={appendProofFiles}
                      hint="Upload verified third-party logs, profit/loss statements, or verification profile exports. Files are counted with your application; secure storage ships in a later release."
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
                    {loading
                      ? 'Submitting…'
                      : needsAccount
                        ? 'Create account & submit application'
                        : 'Submit application'}
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

        <ResponsibleSection />
      </Container>
    </main>
  );
}
