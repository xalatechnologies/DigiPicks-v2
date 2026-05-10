import React from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Col,
  PageHead,
  Card,
  CardHead,
  Button,
  Icon,
  Mono,
  Muted,
  EmptyState,
  PersonRow,
  CopilotChat,
  type CopilotMessage,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

/**
 * Subscriber-side AI Copilot. Multi-turn conversation list on the left,
 * active conversation on the right. Tool turns hidden by default; the
 * "Show tool trace" toggle is for power users + debugging.
 */
export function Copilot() {
  const conversations = useQuery(api.copilot.myConversations);
  const startConversation = useMutation(api.copilot.startConversation);
  const appendUserMessage = useMutation(api.copilot.appendUserMessage);
  const archive = useMutation(api.copilot.archiveConversation);
  const respond = useAction(api.copilot.respond);

  const [activeId, setActiveId] = React.useState<Id<'aiConversations'> | null>(null);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showTrace, setShowTrace] = React.useState(false);

  const messages = useQuery(
    api.copilot.messages,
    activeId ? { conversationId: activeId } : 'skip',
  );

  React.useEffect(() => {
    if (!activeId && conversations && conversations.length > 0) {
      setActiveId(conversations[0]!._id);
    }
  }, [activeId, conversations]);

  async function handleStart() {
    setError(null);
    try {
      const id = await startConversation({ persona: 'customer' });
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
      await appendUserMessage({ conversationId: activeId, body });
      const result = await respond({ conversationId: activeId });
      if ('skipped' in result) {
        setError(
          'Copilot is unavailable in this environment (ANTHROPIC_API_KEY not configured).',
        );
      }
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

  const chatMessages: CopilotMessage[] = (messages ?? []).map((m) => ({
    id: m._id,
    role: m.role,
    body: m.body,
    toolName: m.toolName,
    citations: m.citations as CopilotMessage['citations'],
    modelLabel: m.model
      ? `${m.model}${
          m.outputTokens ? ` · ${m.outputTokens} out` : ''
        }`
      : undefined,
    createdAt: m.createdAt,
  }));

  const list = conversations ?? [];

  return (
    <Container size="2xl">
      <Stack gap={5}>
        <PageHead
          eyebrow="Intelligence"
          title="Copilot"
          sub="Ask grounded questions about creators, events, and outcomes. Every claim cites the underlying query."
          actions={
            <Button variant="primary" size="sm" onClick={handleStart}>
              <Icon name="plus" size={13} />
              New conversation
            </Button>
          }
        />

        <Row gap={4} wrap>
          <Col gap={3}>
            <Card pad="sm">
              <CardHead title="Conversations" sub={`${list.length} active`} />
              {conversations === undefined ? (
                <EmptyState icon="sparkles" title="Loading…" />
              ) : list.length === 0 ? (
                <EmptyState
                  icon="sparkles"
                  title="No conversations yet"
                  subtitle="Tap New conversation to ask the Copilot something."
                />
              ) : (
                <Stack gap={1}>
                  {list.map((c) => (
                    <Card
                      key={c._id}
                      hover
                      pad="sm"
                      onClick={() => setActiveId(c._id)}
                    >
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
                </Stack>
              )}
            </Card>
          </Col>

          <Col gap={3}>
            {!activeId ? (
              <Card>
                <EmptyState
                  icon="sparkles"
                  title="Pick a conversation"
                  subtitle="Or start a new one to ask the Copilot anything."
                />
              </Card>
            ) : (
              <Card>
                <CardHead
                  title="Conversation"
                  sub={
                    <>
                      <Mono>copilot</Mono>
                      <Muted> · grounded answers with citations</Muted>
                    </>
                  }
                />
                {error && <Muted>{error}</Muted>}
                <CopilotChat
                  messages={chatMessages}
                  loading={messages === undefined}
                  draft={draft}
                  onDraftChange={setDraft}
                  onSend={handleSend}
                  sending={sending}
                  showToolTurns={showTrace}
                  onToggleToolTurns={setShowTrace}
                />
              </Card>
            )}
          </Col>
        </Row>
      </Stack>
    </Container>
  );
}
