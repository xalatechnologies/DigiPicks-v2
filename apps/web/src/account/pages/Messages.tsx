import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  Muted,
  EmptyState,
  PersonRow,
  Badge,
  ChatPanel,
  Search,
  StudioPageHeader,
  AccountRefineCard,
  StudioDashLayout,
  StudioDashCol,
  type ChatPanelMessage,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ACCOUNT } from '../../lib/accountRoutes';

function fmtTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AccountMessages() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');
  const threads = useQuery(api.dmThreads.myThreads, isAuthenticated ? {} : 'skip');
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

  const filteredThreads = useMemo(() => {
    if (!threads) return undefined;
    if (!search.trim()) return threads;
    const q = search.toLowerCase();
    return threads.filter(
      ({ creator }) =>
        creator?.name.toLowerCase().includes(q) || creator?.handle.toLowerCase().includes(q),
    );
  }, [threads, search]);

  React.useEffect(() => {
    if (!activeId && filteredThreads && filteredThreads.length > 0) {
      setActiveId(filteredThreads[0]!.thread._id);
    }
  }, [activeId, filteredThreads]);

  React.useEffect(() => {
    if (activeId) {
      void markRead({ threadId: activeId }).catch(() => {});
    }
  }, [activeId, markRead]);

  const active = filteredThreads?.find((t) => t.thread._id === activeId) ?? null;

  const chatMessages: ChatPanelMessage[] = (messages ?? []).map((m) => {
    const isOwn = m.senderUserId === me?._id;
    return {
      id: m._id,
      senderName: isOwn ? (me?.name ?? 'You') : (active?.creator?.name ?? 'Creator'),
      senderHandle: isOwn ? undefined : active?.creator?.handle,
      senderMono: isOwn
        ? (me?.name?.[0]?.toUpperCase() ?? 'U')
        : (active?.creator?.avatarMono ?? '·'),
      senderColor: isOwn ? '#1c9cf0' : (active?.creator?.avatarColor ?? '#3A4F7A'),
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

  const threadList =
    threads === undefined ? (
      <EmptyState icon="message" title="Loading threads…" />
    ) : filteredThreads!.length === 0 ? (
      <EmptyState
        icon="message"
        title={threads.length === 0 ? 'No DMs yet' : 'No threads match'}
        subtitle={
          threads.length === 0
            ? 'Subscribe to a creator to start a private thread from their profile.'
            : 'Try another search term.'
        }
        action={
          threads.length === 0 ? (
            <Row gap={2}>
              <Button
                variant="primary"
                iconRight="arrow-right"
                onClick={() => navigate(ACCOUNT.discover)}
              >
                Discover creators
              </Button>
              <Button variant="outline" onClick={() => navigate(ACCOUNT.subscriptions)}>
                My subscriptions
              </Button>
            </Row>
          ) : undefined
        }
      />
    ) : (
      <Stack gap={1}>
        {filteredThreads!.map(({ thread, creator, unread }) => (
          <Card key={thread._id} hover pad="sm" onClick={() => setActiveId(thread._id)}>
            <PersonRow
              name={creator?.name ?? 'Creator'}
              sub={thread.lastMessageAt ? fmtTime(thread.lastMessageAt) : 'No messages yet'}
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
        title={active.creator?.name ?? 'Creator'}
        sub={active.creator?.handle ? `@${active.creator.handle}` : ''}
        action={
          active.creator?.handle ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/creators/${active.creator!.handle}`)}
            >
              View profile
            </Button>
          ) : null
        }
      />
      {error ? <Muted>{error}</Muted> : null}
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
  );

  const unreadTotal = threads?.reduce((n, t) => n + t.unread, 0) ?? 0;

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Account · Inbox"
          title="Direct messages"
          sub="Private threads with the creators you subscribe to."
        />

        <AccountRefineCard
          title="Refine inbox"
          sub="Search creators you message with."
          summary={
            threads === undefined
              ? 'Loading threads…'
              : `${filteredThreads?.length ?? 0} thread${(filteredThreads?.length ?? 0) === 1 ? '' : 's'}${unreadTotal > 0 ? ` · ${unreadTotal} unread` : ''}`
          }
          onReset={search.trim() ? () => setSearch('') : undefined}
        >
          <Search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by creator name or handle"
            aria-label="Search message threads"
          />
        </AccountRefineCard>

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
