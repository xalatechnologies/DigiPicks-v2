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
  Field,
  TextArea,
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
  const [query, setQuery] = React.useState('');
  const [activeId, setActiveId] = React.useState<Id<'conversations'> | null>(null);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const conversations = useQuery(api.messages.listConversations);
  const messages = useQuery(
    api.messages.getMessages,
    activeId ? { conversationId: activeId } : 'skip',
  );
  const sendMessage = useMutation(api.messages.send);

  // Auto-pick the first conversation once data lands.
  React.useEffect(() => {
    if (!activeId && conversations && conversations.length > 0) {
      setActiveId(conversations[0]!._id);
    }
  }, [activeId, conversations]);

  const filtered = (conversations ?? []).filter((c) => {
    if (!query) return true;
    return c._id.toLowerCase().includes(query.toLowerCase());
  });

  const active = conversations?.find((c) => c._id === activeId) ?? null;

  async function handleSend() {
    if (!activeId || !draft.trim()) return;
    setError(null);
    setSending(true);
    try {
      await sendMessage({ conversationId: activeId, body: draft.trim() });
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
        actions={
          <Button variant="primary" size="sm">
            <Icon name="plus" size={13} />
            New broadcast
          </Button>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Audience"
            title="Member conversations"
            sub="DMs from active subscribers — VIP gets priority response by default."
          />

          <Row gap={4} wrap>
            <Col gap={3}>
              <Search
                placeholder="Search conversations"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Card pad="sm">
                {conversations === undefined ? (
                  <EmptyState icon="message" title="Loading conversations…" />
                ) : filtered.length === 0 ? (
                  <EmptyState
                    icon="message"
                    title="No conversations yet"
                    subtitle="DMs from your subscribers will appear here."
                  />
                ) : (
                  <Stack gap={1}>
                    {filtered.map((c) => (
                      <Card
                        key={c._id}
                        hover
                        pad="sm"
                        onClick={() => setActiveId(c._id)}
                      >
                        <PersonRow
                          name={`Conversation ${c._id.slice(-6)}`}
                          sub={
                            c.lastMessageAt
                              ? `Last activity ${fmtTime(c.lastMessageAt)}`
                              : 'No messages yet'
                          }
                          mono={monogram(c._id)}
                          color="#3A4F7A"
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
                    title="Pick a conversation"
                    subtitle="Select a thread on the left to view the full message history."
                  />
                </Card>
              ) : (
                <Card>
                  <CardHead
                    title={`Conversation ${active._id.slice(-6)}`}
                    sub={
                      active.lastMessageAt
                        ? `Last activity ${fmtTime(active.lastMessageAt)}`
                        : 'No messages yet'
                    }
                    action={
                      <Button variant="ghost" size="sm" iconOnly aria-label="More">
                        <Icon name="more" size={14} />
                      </Button>
                    }
                  />
                  <Stack gap={3}>
                    {messages === undefined ? (
                      <EmptyState icon="message" title="Loading messages…" />
                    ) : messages.length === 0 ? (
                      <EmptyState
                        icon="message"
                        title="No messages yet"
                        subtitle="Send the first message to start this thread."
                      />
                    ) : (
                      messages.map((m) => (
                        <Card key={m._id} pad="sm">
                          <Stack gap={1}>
                            <Muted>{fmtTime(m.createdAt)}</Muted>
                            <span>{m.body}</span>
                          </Stack>
                        </Card>
                      ))
                    )}

                    <Field label="Reply">
                      <TextArea
                        rows={3}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Write a reply…"
                      />
                    </Field>
                    {error && <Muted>{error}</Muted>}
                    <Row gap={2}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSend}
                        disabled={sending || !draft.trim()}
                      >
                        <Icon name="arrow-right" size={13} />
                        Send
                      </Button>
                    </Row>
                  </Stack>
                </Card>
              )}
            </Col>
          </Row>
        </Stack>
      </Container>
    </>
  );
}
