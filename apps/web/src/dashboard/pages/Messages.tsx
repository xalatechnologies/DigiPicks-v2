import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Card,
  CardHead,
  Muted,
  Search,
  EmptyState,
  PersonRow,
  Badge,
  ChatPanel,
  StudioPageHeader,
  StudioRefineCard,
  StudioDashLayout,
  StudioDashCol,
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
  const navigate = useNavigate();
  const me = useQuery(api.users.me);
  const threads = useQuery(
    api.dmThreads.threadsForMyCreator,
    me?.creatorId ? { creatorId: me.creatorId } : 'skip',
  );
  const [activeId, setActiveId] = useState<Id<'dmThreads'> | null>(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messages = useQuery(
    api.dmThreads.messagesIn,
    activeId ? { threadId: activeId, limit: 200 } : 'skip',
  );
  const send = useMutation(api.dmThreads.send);
  const markRead = useMutation(api.dmThreads.markRead);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  const filtered = useMemo(() => {
    if (!threads) return undefined;
    if (!search.trim()) return threads;
    const q = search.toLowerCase();
    return threads.filter(
      ({ subscriber }) =>
        subscriber?.name?.toLowerCase().includes(q) || subscriber?.email?.toLowerCase().includes(q),
    );
  }, [threads, search]);

  useEffect(() => {
    if (!activeId && filtered && filtered.length > 0) {
      setActiveId(filtered[0]!.thread._id);
    }
  }, [activeId, filtered]);

  useEffect(() => {
    if (activeId) {
      void markRead({ threadId: activeId }).catch(() => {});
    }
  }, [activeId, markRead]);

  const active = filtered?.find((t) => t.thread._id === activeId) ?? null;

  const chatMessages: ChatPanelMessage[] = (messages ?? []).map((m) => {
    const isOwn = m.senderUserId === me?._id;
    return {
      id: m._id,
      senderName: isOwn ? (me?.name ?? 'You') : (active?.subscriber?.name ?? 'Subscriber'),
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

  const unreadTotal = threads?.reduce((n, t) => n + t.unread, 0) ?? 0;

  const threadList =
    threads === undefined ? (
      <EmptyState icon="message" title="Loading threads…" />
    ) : filtered!.length === 0 ? (
      <EmptyState
        icon="message"
        title={threads.length === 0 ? 'No subscriber DMs yet' : 'No threads match'}
        subtitle={
          threads.length === 0
            ? "When a subscriber opens a DM with you it'll appear here."
            : 'Try another search term.'
        }
      />
    ) : (
      <Stack gap={1}>
        {filtered!.map(({ thread, subscriber, unread }) => (
          <Card key={thread._id} hover pad="sm" onClick={() => setActiveId(thread._id)}>
            <PersonRow
              name={subscriber?.name ?? 'Subscriber'}
              sub={thread.lastMessageAt ? fmtTime(thread.lastMessageAt) : 'No messages yet'}
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
    );

  const chatPane = !active ? (
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
      />
      {error ? <Muted>{error}</Muted> : null}
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
  );

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Audience"
          title="Subscriber DMs"
          sub="Direct conversations with active subscribers. New replies trigger a push notification on the subscriber side."
        />

        <StudioRefineCard
          title="Refine inbox"
          sub="Search subscribers by name or email."
          summary={
            threads === undefined
              ? 'Loading threads…'
              : `${filtered?.length ?? 0} thread${(filtered?.length ?? 0) === 1 ? '' : 's'}${unreadTotal > 0 ? ` · ${unreadTotal} unread` : ''}`
          }
          onReset={search.trim() ? () => setSearch('') : undefined}
        >
          <Search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscribers"
            aria-label="Search subscriber threads"
          />
        </StudioRefineCard>

        <StudioDashLayout>
          <StudioDashCol span={4}>
            <Card pad="sm">
              <CardHead title="Threads" sub="Most recent first" />
              {threadList}
            </Card>
          </StudioDashCol>
          <StudioDashCol span={8}>{chatPane}</StudioDashCol>
        </StudioDashLayout>
      </Stack>
    </Container>
  );
}
