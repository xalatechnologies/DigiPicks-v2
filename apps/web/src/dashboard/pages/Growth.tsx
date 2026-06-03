import React from 'react';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  StudioPageHeader,
  EmptyState,
  Mono,
  KV,
  ReferralShareModal,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

/**
 * Growth campaigns ship later. Referrals are live via Convex.
 */
export function Growth() {
  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Growth"
          title="Growth"
          sub="Campaign automation and funnel insights are on the roadmap. Share your referral link today."
        />

        <Card pad="lg" elev>
          <EmptyState
            icon="megaphone"
            title="Campaigns coming soon"
            subtitle="Automated promos, trial funnels, and win-streak recaps will land in a future release. Use referrals below to grow your audience now."
          />
        </Card>

        <ReferralsCard />
      </Stack>
    </Container>
  );
}

function ReferralsCard() {
  const codes = useQuery(api.referrals.myCodes);
  const mintCode = useMutation(api.referrals.mintMyCode);
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const live = codes?.find((c) => !c.convertedAt) ?? null;
  const conversions = codes?.filter((c) => c.convertedAt).length ?? 0;
  const lifetimeCents = (codes ?? []).reduce((sum, c) => sum + (c.payoutCents ?? 0), 0);

  async function handleShare() {
    setBusy(true);
    try {
      if (!live) await mintCode({});
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }

  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://digipicks.com/';

  return (
    <Card pad="lg" elev>
      <CardHead title="Referrals" sub="Earn 10% of every referred subscription" />
      <Stack gap={2}>
        <KV k="Live code" v={<Mono>{live?.code ?? '—'}</Mono>} />
        <KV k="Conversions" v={<Mono>{conversions}</Mono>} />
        <KV k="Lifetime earned" v={<Mono>{`$${(lifetimeCents / 100).toFixed(2)}`}</Mono>} />
        <Row gap={2}>
          <Button variant="primary" size="sm" onClick={handleShare} disabled={busy}>
            <Icon name="link" size={13} />
            Share link
          </Button>
        </Row>
      </Stack>
      <ReferralShareModal
        open={open}
        onClose={() => setOpen(false)}
        code={live?.code ?? null}
        shareUrl={shareUrl}
        stats={{ conversions, lifetimeCents }}
      />
    </Card>
  );
}
