import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import {
  Container,
  Section,
  PageHead,
  Card,
  Stack,
  Row,
  Spacer,
  Grid,
  Field,
  Input,
  TextArea,
  Select,
  Button,
  Icon,
  Badge,
  FeatureCard,
  EmptyState,
  ResponsibleSection,
} from '@digipicks/ds';

export function Apply() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submitApplication = useMutation(api.applications.submit);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      await submitApplication({
        name: data.get('name') as string,
        handle: data.get('handle') as string,
        email: data.get('email') as string,
        sport: data.get('sport') as string,
        niche: data.get('niche') as string,
        existingFollowing: (data.get('audience') as string) || undefined,
        proofCount: 0,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <Container size="xl">
        <PageHead
          eyebrow="Creator application"
          title="Apply to publish on DigiPicks."
          sub="We onboard creators in cohorts. Tell us about your edge, your audience, and your track record. We review every application personally."
          actions={<Badge tone="green" dot>Spring '26 cohort open</Badge>}
        />

        <Section
          eyebrow="What you get"
          title="Built for the work, not against you."
          sub="A focused tool stack for the people who actually do the research."
        >
          <Grid cols={3} gap={5}>
            <FeatureCard
              icon={<Icon name="dollar" size={22} />}
              title="87% revenue share"
              body="No tiered take-rate. No hidden processing markup. Stripe-backed payouts on a weekly cadence."
            />
            <FeatureCard
              icon={<Icon name="audit" size={22} />}
              title="Independent grading"
              body="Wins, losses, and pushes graded by the platform — every record is real and immutable."
            />
            <FeatureCard
              icon={<Icon name="sparkles" size={22} />}
              title="Smart pricing tools"
              body="Benchmarked starting prices, churn analytics, and retention nudges built into the dashboard."
            />
          </Grid>
        </Section>

        <Section eyebrow="The form" title="Tell us about your edge.">
          <Card pad="xl">
            {submitted ? (
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
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack gap={5}>
                  <Grid cols={2} gap={4}>
                    <Field label="Full name" required htmlFor="apply-name">
                      <Input id="apply-name" name="name" placeholder="Jordan Rivera" required />
                    </Field>
                    <Field label="Public handle" required htmlFor="apply-handle">
                      <Input id="apply-handle" name="handle" placeholder="@sharpedgebets" required />
                    </Field>
                  </Grid>

                  <Grid cols={2} gap={4}>
                    <Field label="Email" required htmlFor="apply-email">
                      <Input id="apply-email" name="email" type="email" placeholder="you@example.com" required />
                    </Field>
                    <Field label="Primary sport" required htmlFor="apply-sport">
                      <Select id="apply-sport" name="sport" defaultValue="">
                        <option value="" disabled>
                          Select a sport
                        </option>
                        <option value="NFL">NFL</option>
                        <option value="NBA">NBA</option>
                        <option value="NHL">NHL</option>
                        <option value="MLB">MLB</option>
                        <option value="Soccer">Soccer</option>
                        <option value="Tennis">Tennis</option>
                        <option value="UFC">UFC</option>
                        <option value="Other">Other</option>
                      </Select>
                    </Field>
                  </Grid>

                  <Field
                    label="Niche / specialty"
                    required
                    help="Be specific — e.g. 'NBA player props, pre-game only' or 'NFL totals with CLV-tracking since 2022'."
                    htmlFor="apply-niche"
                  >
                    <Input
                      id="apply-niche"
                      name="niche"
                      placeholder="NFL Sides & Totals, CLV-tracked"
                      required
                    />
                  </Field>

                  <Field
                    label="Tell us about your edge"
                    required
                    help="A few paragraphs is fine. Include your record, sample size, and where you publish today."
                    htmlFor="apply-edge"
                  >
                    <TextArea
                      id="apply-edge"
                      name="edge"
                      rows={6}
                      placeholder="I track closing line value across all my plays..."
                      required
                    />
                  </Field>

                  <Field
                    label="Existing audience"
                    help="Optional. Twitter, Discord, Substack, Telegram — wherever your subscribers are today."
                    htmlFor="apply-audience"
                  >
                    <Input id="apply-audience" name="audience" placeholder="twitter.com/sharpedgebets" />
                  </Field>

                  {error && (
                    <Badge tone="red">{error}</Badge>
                  )}

                  <Spacer />
                  <Row gap={3}>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      iconRight="arrow-right"
                      disabled={loading}
                    >
                      {loading ? 'Submitting…' : 'Submit application'}
                    </Button>
                  </Row>
                </Stack>
              </form>
            )}
          </Card>
        </Section>

        <ResponsibleSection />
      </Container>
    </main>
  );
}
