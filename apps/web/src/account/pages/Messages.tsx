import React from 'react';
import { useMutation, useQuery } from 'convex/react';
import {
  PageHead,
  Container,
  Stack,
  Row,
  Col,
  Card,
  CardHead,
  Button,
  Icon,
  Muted,
  EmptyState,
  PersonRow,
  Badge,
  ChatPanel,
  type ChatPanelMessage,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

function fmtTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Subscriber-side DM inbox. Mirror of the creator-side dashboard
 * Messages page but reads via api.dmThreads.myThreads. The list of
 * threads is filtered to the calling user; messages are queried per-
 * thread via api.dmThreads.messagesIn.
 */
export function AccountMessages() {
  const me = useQuery(api.users.me);
  const threads = useQuery(api.dmThreads.myThreads);
  const [activeId, setActiveId] = React.useState<Id<'dmThreads'> | null>(null);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const messages = useQuery(
    api.dmThreads.messagesIn,
    activeId ? { threadId: activeId, limit: 200 } : 'skip',
  );
  const send = useMutation(api.dmThreads.send);
  const markRead = useMutation(api.dmThreads.markRead);

  React.useEffect(() => {
    if (!activeId && threads && threads.length > 0) {
      setActiveId(threads[0]!.thread._id);
    }
  }, [activeId, threads]);

  React.useEffect(() => {
    if (activeId) {
      void markRead({ threadId: activeId }).catch(() => {});
    }
  }, [activeId, markRead]);

  const active = threads?.find((t) => t.thread._id === activeId) ?? null;

  const chatMessages: ChatPanelMessage[] = (messages ?? []).map((m) => {
    const isOwn = m.senderUserId === me?._id;
    return {
      id: m._id,
      senderName: isOwn ? me?.name ?? 'You' : active?.creator?.name ?? 'Creator',
      senderHandle: isOwn ? undefined : active?.creator?.handle,
      senderMono: isOwn
        ? me?.name?.[0]?.toUpperCase() ?? 'U'
        : active?.creator?.avatarMono ?? '·',
      senderColor: isOwn ? '#1c9cf0' : active?.creator?.avatarColor ?? '#3A4F7A',
      senderVerified: !isOwn && Boolean(active?.creator?.verified),
      body: m.body,
      createdAt: m.createdAt,
      isOwn,
    };
  });

  async function handleSend() {
    if (!activeId || !draft.trim()) return;
    setError(null);
    setSending(true);
    try {
      await send({ threadId: activeId, body: draft.trim() });
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Container size="xl">
      <Stack gap={5}>
        <PageHead
          eyebrow="Inbox"
          title="Direct messages"
          sub="Private threads with the creators you subscribe to."
        />

        <Row gap={4} wrap>
          <Col gap={3}>
            <Card pad="sm">
              <CardHead title="Threads" sub="Most recent first" />
              {threads === undefined ? (
                <EmptyState icon="message" title="Loading threads…" />
              ) : threads.length === 0 ? (
                <EmptyState
                  icon="message"
                  title="No DMs yet"
                  subtitle="Subscribe to a creator and open a DM thread from their profile."
                />
              ) : (
                <Stack gap={1}>
                  {threads.map(({ thread, creator, unread }) => (
                    <Card
                      key={thread._id}
                      hover
                      pad="sm"
                      onClick={() => setActiveId(thread._id)}
                    >
                      <PersonRow
                        name={creator?.name ?? 'Creator'}
                        sub={
                          thread.lastMessageAt
                            ? fmtTime(thread.lastMessageAt)
                            : 'No messages yet'
                        }
                        mono={creator?.avatarMono ?? '·'}
                        color={creator?.avatarColor ?? '#3A4F7A'}
                        trailing={
                          unread > 0 ? (
                            <Badge tone="blue" dot>
                              {unread}
                            </Badge>
                          ) : null
                        }
                      />
                    </Card>
                  ))}
                </Stack>
              )}
            </Card>
          </Col>

          <Col gap={3}>
            {!active ? (
              <Card>
                <EmptyState
                  icon="message"
                  title="Pick a thread"
                  subtitle="Select a conversation on the left to read and reply."
                />
              </Card>
            ) : (
              <Card>
                <CardHead
                  title={active.creator?.name ?? 'Creator'}
                  sub={active.creator?.handle ? `${active.creator.handle}` : ''}
                  action={
                    <Button variant="ghost" size="sm" iconOnly aria-label="More">
                      <Icon name="more" size={14} />
                    </Button>
                  }
                />
                {error && <Muted>{error}</Muted>}
                <ChatPanel
                  messages={chatMessages}
                  loading={messages === undefined}
                  draft={draft}
                  onDraftChange={setDraft}
                  onSend={handleSend}
                  sending={sending}
                  placeholder="Message the creator…"
                  emptyTitle="Say hi"
                  emptySubtitle="Send the first message to open this thread."
                />
              </Card>
            )}
          </Col>
        </Row>
      </Stack>
    </Container>
  );
}
