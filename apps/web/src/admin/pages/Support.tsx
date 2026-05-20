import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Stack, StudioPageHeader, Card, CardHead, Button, Muted } from '@digipicks/ds';
import { ADMIN } from '../lib/adminRoutes';

/** Support hub — routes to pick disputes vs billing refunds (zip 80). */
export function Support() {
  const navigate = useNavigate();

  return (
    <Container size="2xl">
      <Stack gap={5}>
        <StudioPageHeader
          eyebrow="Admin"
          title="Support & disputes"
          sub="Pick grading disputes and billing refund cases live in separate queues."
        />
        <Card pad="lg">
          <CardHead title="Pick disputes" sub="Subscriber or creator disputes on graded picks." />
          <Button variant="primary" onClick={() => navigate(ADMIN.disputes)}>
            Open pick dispute queue
          </Button>
        </Card>
        <Card pad="lg">
          <CardHead
            title="Billing & refunds"
            sub="Subscription refunds, chargebacks, and finance desk."
          />
          <Button variant="secondary" onClick={() => navigate(ADMIN.refunds)}>
            Open refunds queue
          </Button>
        </Card>
        <Muted>
          General support tickets (SLA, priority) ship in a follow-up with a supportTickets table.
        </Muted>
      </Stack>
    </Container>
  );
}
