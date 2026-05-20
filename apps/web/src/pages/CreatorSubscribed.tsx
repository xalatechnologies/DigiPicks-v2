import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { Container, Stack, Card, Button, EmptyState, PageHead, Muted, Icon } from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';

export function CreatorSubscribed() {
  const { id: handle } = useParams();
  const navigate = useNavigate();
  const creator = useQuery(api.creators.getByHandle, handle ? { handle } : 'skip');
  const hasAccess = useQuery(
    api.subscriptions.hasAccess,
    creator?._id ? { creatorId: creator._id } : 'skip',
  );

  if (!handle || creator === null) {
    return (
      <main>
        <Container size="md">
          <EmptyState icon="search" title="Creator not found" />
        </Container>
      </main>
    );
  }

  if (!creator) {
    return (
      <main>
        <Container size="md">
          <EmptyState icon="check" title="Confirming subscription…" />
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container size="md">
        <Stack gap={5}>
          <PageHead
            eyebrow="Success"
            title="Subscription confirmed"
            sub={
              hasAccess
                ? `You now have full access to ${creator.name}'s premium content.`
                : 'Payment received — access may take a moment to activate while Stripe confirms.'
            }
          />
          <Card pad="lg" elev>
            <Stack gap={3}>
              <Icon name="check" size={32} />
              <Muted>Manage billing anytime from your account subscriptions page.</Muted>
              <Button variant="primary" onClick={() => navigate(`/creators/${creator.handle}`)}>
                View creator profile
              </Button>
              <Button variant="secondary" onClick={() => navigate('/account/subscriptions')}>
                Manage subscriptions
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </main>
  );
}
