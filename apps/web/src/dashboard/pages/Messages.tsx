import React from 'react';
import { useMutation, useQuery } from 'convex/react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Col,
  Card,
  CardHead,
  Button,
  Icon,
  PageHead,
  Muted,
  Search,
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

function monogram(name: string | undefined): string {
  if (!name) return '·';
  const trimmed = name.trim();
  if (!trimmed) return '·';
  return trimmed[0]!.toUpperCase();
}

export function Messages() {
  const me = useQuery(api.users.me);
  const threads = useQuery(
    api.dmThreads.threadsForMyCreator,
    me?.creatorId ? { creatorId: me.creatorId } : 'skip',
  );
  const [activeId, setActiveId] = React.useState<Id<'dmThreads'> | null>(null);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  const messages = useQuery(
    api.dmThreads.messagesIn,
    activeId ? { threadId: activeId, limit: 200 } : 'skip',
  );
  const send = useMutation(api.dmThreads.send);
  const markRead = useMutation(api.dmThreads.markRead);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  // Auto-pick the first thread once data lands.
  React.useEffect(() => {
    if (!activeId && threads && threads.length > 0) {
      setActiveId(threads[0]!.thread._id);
    }
  }, [activeId, threads]);

  // Mark as read when the active thread changes — fire-and-forget.
  React.useEffect(() => {
    if (activeId) {
      void markRead({ threadId: activeId }).catch(() => {});
    }
  }, [activeId, markRead]);

  const filtered = (threads ?? []).filter(({ subscriber }) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Boolean(
      subscriber?.name?.toLowerCase().includes(q) ||
        subscriber?.email?.toLowerCase().includes(q),
    );
  });

  const active = threads?.find((t) => t.thread._id === activeId) ?? null;

  const chatMessages: ChatPanelMessage[] = (messages ?? []).map((m) => {
    const isOwn = m.senderUserId === me?._id;
    return {
      id: m._id,
      senderName: isOwn ? me?.name ?? 'You' : active?.subscriber?.name ?? 'Subscriber',
      senderMono: isOwn ? monogram(me?.name) : monogram(active?.subscriber?.name),
      senderColor: isOwn ? '#1c9cf0' : '#3A4F7A',
      body: m.body,
      createdAt: m.createdAt,
      isOwn,
      reactions: (m.reactions ?? []).map((r) => ({
        emoji: r.emoji,
        count: r.userIds.length,
        reactedByMe: Boolean(me?._id) && r.userIds.includes(me!._id),
      })),
    };
  });

  async function handleToggleReaction(messageId: string, emoji: string) {
    try {
      await toggleReaction({
        messageId: messageId as Id<'messages'>,
        emoji,
      });
    } catch (err) {
      console.warn('toggleReaction failed:', err);
    }
  }

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
    <>
      <PageHeader
        title="Messages"
        crumbs={[{ label: 'Audience' }, { label: 'Messages' }]}
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Audience"
            title="Subscriber DMs"
            sub="Direct conversations with active subscribers. New replies trigger a push notification on the subscriber side."
          />

          <Row gap={4} wrap>
            <Col gap={3}>
              <Search
                placeholder="Search subscribers"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Card pad="sm">
                {threads === undefined ? (
                  <EmptyState icon="message" title="Loading threads…" />
                ) : filtered.length === 0 ? (
                  <EmptyState
                    icon="message"
                    title="No subscriber DMs yet"
                    subtitle="When a subscriber opens a DM with you it'll appear here."
                  />
                ) : (
                  <Stack gap={1}>
                    {filtered.map(({ thread, subscriber, unread }) => (
                      <Card
                        key={thread._id}
                        hover
                        pad="sm"
                        onClick={() => setActiveId(thread._id)}
                      >
                        <PersonRow
                          name={subscriber?.name ?? 'Subscriber'}
                          sub={
                            thread.lastMessageAt
                              ? fmtTime(thread.lastMessageAt)
                              : 'No messages yet'
                          }
                          mono={monogram(subscriber?.name)}
                          color="#3A4F7A"
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
                    title={active.subscriber?.name ?? 'Subscriber'}
                    sub={
                      active.thread.lastMessageAt
                        ? `Last activity ${fmtTime(active.thread.lastMessageAt)}`
                        : 'No messages yet'
                    }
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
                    onToggleReaction={handleToggleReaction}
                    sending={sending}
                    placeholder="Reply to subscriber…"
                    emptyTitle="No messages yet"
                    emptySubtitle="Send the first message to start this thread."
                  />
                </Card>
              )}
            </Col>
          </Row>
        </Stack>
      </Container>
    </>
  );
}
