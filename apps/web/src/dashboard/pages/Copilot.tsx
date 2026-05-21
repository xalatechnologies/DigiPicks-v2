import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction, useMutation, usePaginatedQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  Mono,
  Muted,
  EmptyState,
  PersonRow,
  CopilotChat,
  Search,
  StudioPageHeader,
  StudioRefineCard,
  StudioDashLayout,
  StudioDashCol,
  type CopilotMessage,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

export function CreatorCopilot() {
  const navigate = useNavigate();
  const {
    results: conversations,
    status: convStatus,
    loadMore,
  } = usePaginatedQuery(api.aiCopilot.queries.listConversations, {}, { initialNumItems: 20 });
  const startConversation = useMutation(api.aiCopilot.mutations.startConversation);
  const appendUserMessage = useMutation(api.aiCopilot.mutations.appendUserMessage);
  const archive = useMutation(api.aiCopilot.mutations.archiveConversation);
  const respond = useAction(api.aiCopilot.respond.respond);

  const [activeId, setActiveId] = useState<Id<'aiConversations'> | null>(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  const { results: messages, status: msgStatus } = usePaginatedQuery(
    api.aiCopilot.queries.messages,
    activeId ? { conversationId: activeId } : 'skip',
    { initialNumItems: 50 },
  );

  const list = useMemo(() => conversations.filter((c) => c.persona === 'creator'), [conversations]);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((c) => c.title.toLowerCase().includes(q));
  }, [list, search]);

  useEffect(() => {
    if (!activeId && filtered.length > 0) {
      setActiveId(filtered[0]!._id);
    }
  }, [activeId, filtered]);

  async function handleStart() {
    setError(null);
    try {
      const id = await startConversation({ persona: 'creator' });
      setActiveId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start conversation.');
    }
  }

  async function handleSend() {
    if (!activeId || !draft.trim()) return;
    setError(null);
    setSending(true);
    const body = draft.trim();
    setDraft('');
    try {
      const userMessageId = await appendUserMessage({
        conversationId: activeId,
        body,
      });
      await respond({ conversationId: activeId, userMessageId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Copilot request failed.');
    } finally {
      setSending(false);
    }
  }

  async function handleArchive(id: Id<'aiConversations'>) {
    if (!window.confirm('Archive this conversation?')) return;
    try {
      await archive({ conversationId: id });
      if (activeId === id) setActiveId(null);
    } catch (err) {
      console.warn('archive conversation:', err);
    }
  }

  const chatMessages: CopilotMessage[] = messages.map((m) => ({
    id: m._id,
    role: m.role,
    body: m.streaming && m.streamingBuffer ? m.streamingBuffer : m.body,
    streaming: m.streaming,
    toolName: m.toolName,
    citations: m.citations as CopilotMessage['citations'],
    modelLabel: m.model
      ? `${m.model}${m.outputTokens ? ` · ${m.outputTokens} out` : ''}`
      : undefined,
    createdAt: m.createdAt,
  }));

  const conversationList =
    convStatus === 'LoadingFirstPage' ? (
      <EmptyState icon="sparkles" title="Loading…" />
    ) : filtered.length === 0 ? (
      <EmptyState
        icon="sparkles"
        title={list.length === 0 ? 'No conversations yet' : 'No matches'}
        subtitle={
          list.length === 0
            ? 'Start a new conversation to ask the Copilot something.'
            : 'Try another search term.'
        }
      />
    ) : (
      <Stack gap={1}>
        {filtered.map((c) => (
          <Card key={c._id} hover pad="sm" onClick={() => setActiveId(c._id)}>
            <Row gap={3} between>
              <PersonRow
                name={c.title}
                sub={`${c.messageCount} message${c.messageCount === 1 ? '' : 's'}`}
                mono="AI"
                color="#1c9cf0"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchive(c._id);
                }}
                aria-label="Archive"
              >
                <Icon name="trash" size={13} />
              </Button>
            </Row>
          </Card>
        ))}
        {convStatus === 'CanLoadMore' ? (
          <Button variant="ghost" size="sm" onClick={() => loadMore(20)}>
            Load more
          </Button>
        ) : null}
      </Stack>
    );

  const chatPane = !activeId ? (
    <Card>
      <EmptyState
        icon="sparkles"
        title="Pick a conversation"
        subtitle={
          'Or start a new one — try "What\'s my CLV trend?" or "Draft a recap of my last 10 picks."'
        }
      />
    </Card>
  ) : (
    <Card>
      <CardHead
        title="Conversation"
        sub={
          <>
            <Mono>copilot · creator</Mono>
            <Muted> · grounded answers with citations</Muted>
          </>
        }
      />
      {error ? <Muted>{error}</Muted> : null}
      <CopilotChat
        messages={chatMessages}
        loading={msgStatus === 'LoadingFirstPage'}
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSend}
        sending={sending}
        showToolTurns={showTrace}
        onToggleToolTurns={setShowTrace}
        placeholder="Ask about your performance, draft a pick, or pull market context…"
      />
    </Card>
  );

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Intelligence"
          title="AI co-pilot for creators"
          sub="Ask grounded questions about your performance, draft picks, or pull market context. Every claim is cited."
          actions={
            <Button variant="primary" size="sm" onClick={handleStart}>
              <Icon name="plus" size={13} />
              New conversation
            </Button>
          }
        />

        <StudioRefineCard
          title="Refine conversations"
          sub="Search by conversation title."
          summary={`${filtered.length} of ${list.length} conversation${list.length === 1 ? '' : 's'}`}
          onReset={search.trim() ? () => setSearch('') : undefined}
        >
          <Search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            aria-label="Search Copilot conversations"
          />
        </StudioRefineCard>

        <StudioDashLayout>
          <StudioDashCol span={4}>
            <Card pad="sm">
              <CardHead title="Conversations" sub="Creator persona only" />
              {conversationList}
            </Card>
          </StudioDashCol>
          <StudioDashCol span={8}>{chatPane}</StudioDashCol>
        </StudioDashLayout>
      </Stack>
    </Container>
  );
}
