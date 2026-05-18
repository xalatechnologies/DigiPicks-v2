import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Section,
  PageHead,
  Stack,
  Row,
  Button,
  Muted,
  Heading,
  Divider,
} from '@digipicks/ds';

function InfoLayout({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <main>
      <Container size="md">
        <PageHead eyebrow={eyebrow} title={title} sub={sub} />
        <Section noReveal>
          <Stack gap={5}>{children}</Stack>
        </Section>
      </Container>
    </main>
  );
}

function Block({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Stack gap={2}>
      <Heading level={3} size="lg">
        {heading}
      </Heading>
      {children}
    </Stack>
  );
}

/** Marketing: subscription overview; creator-specific pricing lives on /creators. */
export function PricingPage() {
  const navigate = useNavigate();
  return (
    <InfoLayout
      eyebrow="Product"
      title="Pricing"
      sub="DigiPicks is a subscription marketplace. Each creator sets their own plans — browse profiles to see current offers."
    >
      <Block heading="How pricing works">
        <Muted>
          You subscribe directly to verified creators. Platform fees and creator payouts are handled
          through Stripe. You can manage renewals and cancellations from your account.
        </Muted>
      </Block>
      <Row gap={2}>
        <Button variant="primary" iconRight="arrow-right" onClick={() => navigate('/creators')}>
          Browse creators
        </Button>
        <Button variant="secondary" onClick={() => navigate('/account/subscriptions')}>
          My subscriptions
        </Button>
      </Row>
    </InfoLayout>
  );
}

export function TrustVerificationPage() {
  return (
    <InfoLayout
      eyebrow="Trust"
      title="Creator verification"
      sub="We manually review creator applications before they can sell subscriptions on DigiPicks."
    >
      <Block heading="What we verify">
        <Muted>
          Applications include identity cues, niche focus, sample work, and references where
          available. Admins may approve, reject, or request more information. Verified status is
          visible on public creator profiles.
        </Muted>
      </Block>
      <Block heading="Not a performance guarantee">
        <Muted>
          Verification means we have vetted the applicant against our process — it does not
          guarantee future results or profitability.
        </Muted>
      </Block>
    </InfoLayout>
  );
}

export function ResultsMethodologyPage() {
  return (
    <InfoLayout
      eyebrow="Trust"
      title="Results methodology"
      sub="How picks move from published to graded, and how performance metrics are derived."
    >
      <Block heading="Grading lifecycle">
        <Muted>
          Picks are graded as outcomes are known: win, loss, push, void, cancelled, or disputed
          where applicable. Regrades may occur when official results change; sensitive actions are
          audit-logged for admins.
        </Muted>
      </Block>
      <Block heading="Creator and subscriber views">
        <Muted>
          Creators see performance in the studio dashboard. Subscribers see graded history on
          creator pages and in their results and feed experiences. Sample sizes and time windows
          matter — always read disclaimers alongside win rates.
        </Muted>
      </Block>
    </InfoLayout>
  );
}

export function TrustDisputesPage() {
  const navigate = useNavigate();
  return (
    <InfoLayout
      eyebrow="Trust"
      title="Disputes"
      sub="How we handle disagreements about grading, access, or marketplace issues."
    >
      <Block heading="Submitting a dispute">
        <Muted>
          If you believe a pick was graded incorrectly or that access to paid content is wrong,
          contact support with your account email, the pick or subscription involved, and a short
          description. Admins may open or resolve cases in line with platform policy.
        </Muted>
      </Block>
      <Muted>
        Platform operators use admin tools for dispute queues. This page describes the public
        process only.
      </Muted>
      <Button variant="secondary" onClick={() => navigate('/contact')}>
        Contact support
      </Button>
    </InfoLayout>
  );
}

export function ResponsibleBettingPage() {
  return (
    <InfoLayout
      eyebrow="Trust"
      title="Responsible betting"
      sub="DigiPicks provides sports intelligence and creator content — not a sportsbook."
    >
      <Block heading="Bet responsibly">
        <Muted>
          If you choose to wager, do so only where legal for you, within your means, and with
          operators licensed in your jurisdiction. Set limits, take breaks, and seek help if
          gambling stops being entertainment.
        </Muted>
      </Block>
      <Block heading="21+">
        <Muted>
          You must meet the minimum age required in your region. We display 21+ where that is our
          default policy bar — local law may require a higher age.
        </Muted>
      </Block>
    </InfoLayout>
  );
}

export function AboutPage() {
  return (
    <InfoLayout
      eyebrow="Company"
      title="About DigiPicks"
      sub="A realtime network for verified sports creators and serious subscribers."
    >
      <Muted>
        DigiPicks combines subscriptions, transparent grading, odds context, and community tools so
        creators can build sustainable businesses around sports intelligence — without positioning
        the product as a book.
      </Muted>
      <Muted>Developed by Xala Technologies AS.</Muted>
    </InfoLayout>
  );
}

export function PressPage() {
  return (
    <InfoLayout eyebrow="Company" title="Press" sub="Media and partnership inquiries.">
      <Muted>
        For press kits, logos, and interview requests, reach out via the contact page. We respond as
        capacity allows.
      </Muted>
    </InfoLayout>
  );
}

export function BrandPage() {
  return (
    <InfoLayout eyebrow="Company" title="Brand" sub="Logos and naming.">
      <Muted>
        “DigiPicks” and associated marks are used for the product. Do not imply endorsement by
        leagues, data partners, or third parties. Request brand assets through contact.
      </Muted>
    </InfoLayout>
  );
}

export function ContactPage() {
  return (
    <InfoLayout eyebrow="Company" title="Contact" sub="Reach the DigiPicks team.">
      <Muted>
        Use the support channel linked from your account or your creator dashboard for logged-in
        requests.
      </Muted>
      <Muted>
        General inquiries: visit xala.no for company contact details. Replace this copy with a
        production support email or ticket URL after legal review.
      </Muted>
    </InfoLayout>
  );
}

export function TermsPage() {
  return (
    <InfoLayout
      eyebrow="Legal"
      title="Terms of service"
      sub="Summary placeholder — replace with counsel-approved terms before production marketing."
    >
      <Muted>
        These terms govern use of the DigiPicks website and services, including accounts,
        subscriptions, creator tools, and community features. Final legal text must be provided by
        qualified counsel for your jurisdiction.
      </Muted>
      <Divider />
      <Block heading="Accounts and eligibility">
        <Muted>You agree to provide accurate information and to keep credentials secure.</Muted>
      </Block>
      <Block heading="Subscriptions and billing">
        <Muted>
          Paid plans are processed by Stripe. Renewal, cancellation, and refund rules follow the
          pricing you accept at checkout and our refund policy.
        </Muted>
      </Block>
      <Block heading="Content and conduct">
        <Muted>
          Harassment, fraud, or attempts to circumvent access controls may result in suspension.
          Creators remain responsible for their published picks within platform rules.
        </Muted>
      </Block>
    </InfoLayout>
  );
}

export function PrivacyPage() {
  return (
    <InfoLayout
      eyebrow="Legal"
      title="Privacy"
      sub="Summary placeholder — replace with counsel-approved privacy policy."
    >
      <Muted>
        We process account, billing, usage, and notification data to operate the service. GDPR
        rights include export and deletion flows available from account and creator settings where
        enabled.
      </Muted>
      <Divider />
      <Block heading="Data we collect">
        <Muted>
          Account profile, auth provider data, subscription state, picks and messages you create,
          and audit logs.
        </Muted>
      </Block>
      <Block heading="Processors">
        <Muted>
          Infrastructure and payments may use subprocessors such as Convex, Stripe, and email/SMS
          providers — list them in the final policy.
        </Muted>
      </Block>
    </InfoLayout>
  );
}

export function RefundsPage() {
  return (
    <InfoLayout eyebrow="Legal" title="Refunds" sub="How billing disputes and refunds are handled.">
      <Muted>
        Refund eligibility depends on the creator’s plan, Stripe rules, and local consumer law.
        Contact support with receipts if billing looks incorrect. Chargebacks may trigger account
        review.
      </Muted>
    </InfoLayout>
  );
}

export function AgeRestrictionPage() {
  return (
    <InfoLayout
      eyebrow="Legal"
      title="Age restriction (21+)"
      sub="You must meet the minimum age where you use DigiPicks."
    >
      <Muted>
        The service targets adults. We may require age attestation and block access where users
        cannot confirm eligibility. Responsible-betting resources belong in the responsible betting
        page.
      </Muted>
    </InfoLayout>
  );
}
