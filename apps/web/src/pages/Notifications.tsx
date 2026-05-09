import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Section,
  PageHead,
  Row,
  Stack,
  Card,
  CardHead,
  Button,
  Icon,
  Mono,
  Muted,
  Badge,
  EmptyState,
  TitleSub,
} from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function Notifications() {
  const navigate = useNavigate();
  const notifications = useQuery(api.notifications.listMine, { limit: 100 });
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const isLoading = notifications === undefined;
  const items = notifications ?? [];
  const unreadCount = items.filter((n) => n.readAt === undefined).length;

  async function handleMarkRead(id: Id<'notifications'>) {
    try {
      await markRead({ id });
    } catch {
      /* swallow */
    }
  }

  async function handleMarkAll() {
    try {
      await markAllRead({});
    } catch {
      /* swallow */
    }
  }

  return (
    <main>
      <Container size="xl">
        <PageHead
          eyebrow="Inbox"
          title="Notifications"
          sub="New picks from your subscribed creators, grading updates, and platform alerts."
          actions={
            <Row gap={2}>
              <Button
                variant="secondary"
                disabled={unreadCount === 0}
                onClick={handleMarkAll}
              >
                Mark all read
              </Button>
              <Button
                variant="outline"
                iconLeft="feed"
                onClick={() => navigate('/feed')}
              >
                Open feed
              </Button>
            </Row>
          }
        />

        <Section>
          {isLoading ? (
            <EmptyState icon="bell" title="Loading notifications…" />
          ) : items.length === 0 ? (
            <EmptyState
              icon="bell"
              title="You're all caught up."
              subtitle="No notifications right now. We'll surface new creator picks and grading updates here."
            />
          ) : (
            <Stack gap={3}>
              {items.map((n) => {
                const unread = n.readAt === undefined;
                return (
                  <Card key={n._id} pad="md">
                    <Row between>
                      <Stack gap={2}>
                        <Row gap={2}>
                          <Mono>{n.type}</Mono>
                          {unread && (
                            <Badge tone="blue" dot>
                              New
                            </Badge>
                          )}
                        </Row>
                        <TitleSub title={n.title} sub={n.body ?? ''} />
                        <Muted>{formatTime(n.createdAt)}</Muted>
                      </Stack>
                      {unread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkRead(n._id)}
                        >
                          <Icon name="check" size={13} />
                          Mark read
                        </Button>
                      )}
                    </Row>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Section>
      </Container>
    </main>
  );
}
