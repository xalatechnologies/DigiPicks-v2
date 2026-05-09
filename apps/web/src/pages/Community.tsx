import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Section,
  PageHead,
  Row,
  Stack,
  Col,
  Card,
  CardHead,
  Button,
  Icon,
  Badge,
  Mono,
  Muted,
  PersonRow,
  EmptyState,
  ChatPanel,
  LockedChannelPanel,
  type ChatPanelMessage,
} from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function Community() {
  const navigate = useNavigate();
  const me = useQuery(api.users.meSafe);
  const channels = useQuery(api.channels.list, { limit: 50 });
  const [activeId, setActiveId] = React.useState<Id<'channels'> | null>(null);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const messages = useQuery(
    api.messages.listByChannel,
    activeId ? { channelId: activeId, limit: 100 } : 'skip',
  );
  const myAccess = useQuery(
    api.channels.myAccess,
    activeId ? { channelId: activeId } : 'skip',
  );
  const postToChannel = useMutation(api.messages.postToChannel);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  React.useEffect(() => {
    if (!activeId && channels && channels.length > 0) {
      setActiveId(channels[0]!.channel._id);
    }
  }, [activeId, channels]);

  const active = channels?.find((c) => c.channel._id === activeId) ?? null;

  const chatMessages: ChatPanelMessage[] = (messages ?? []).map((m) => ({
    id: m._id,
    senderName: m.senderName,
    senderHandle: m.senderHandle,
    senderMono: m.senderMono,
    senderColor: m.senderColor,
    senderVerified: m.senderVerified,
    body: m.body,
    createdAt: m.createdAt,
    isOwn: m.senderUserId === me?._id,
    reactions: (m.reactions ?? []).map((r) => ({
      emoji: r.emoji,
      count: r.userIds.length,
      reactedByMe: Boolean(me?._id) && r.userIds.includes(me!._id),
    })),
  }));

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
      await postToChannel({ channelId: activeId, body: draft });
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      <Container size="xl">
        <PageHead
          eyebrow="Community"
          title="Live discussions."
          sub="Public rooms hosted by verified creators. Pick a channel to drop in on the conversation around tonight's slate."
          actions={
            <Row gap={2}>
              <Button
                variant="secondary"
                iconLeft="users"
                onClick={() => navigate('/creators')}
              >
                Find creators
              </Button>
            </Row>
          }
        />

        <Section>
          <Row gap={4} wrap>
            <Col gap={3}>
              <Card pad="sm">
                <CardHead title="Channels" sub="Public rooms" />
                {channels === undefined ? (
                  <EmptyState icon="message" title="Loading channels…" />
                ) : channels.length === 0 ? (
                  <EmptyState
                    icon="message"
                    title="No channels yet."
                    subtitle="Verified creators can spin up community rooms from their dashboard."
                  />
                ) : (
                  <Stack gap={1}>
                    {channels.map(({ channel, creator }) => {
                      const isActive = channel._id === activeId;
                      return (
                        <Card
                          key={channel._id}
                          hover
                          pad="sm"
                          onClick={() => setActiveId(channel._id)}
                        >
                          <PersonRow
                            name={channel.name}
                            sub={
                              creator
                                ? `by ${creator.name}`
                                : channel.description ?? 'Community channel'
                            }
                            mono={creator?.avatarMono ?? '#'}
                            color={creator?.avatarColor ?? '#3A4F7A'}
                            trailing={
                              isActive ? (
                                <Badge tone="blue" dot>
                                  Open
                                </Badge>
                              ) : channel.lastMessageAt ? (
                                <Mono>{fmtDate(channel.lastMessageAt)}</Mono>
                              ) : (
                                <Muted>new</Muted>
                              )
                            }
                          />
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Card>
            </Col>

            <Col gap={3}>
              {!active ? (
                <Card>
                  <EmptyState
                    icon="message"
                    title="Pick a channel"
                    subtitle="Choose a community on the left to read and join the conversation."
                  />
                </Card>
              ) : (
                <Card>
                  <CardHead
                    title={active.channel.name}
                    sub={
                      active.creator
                        ? `Hosted by ${active.creator.name}`
                        : active.channel.description ?? 'Community channel'
                    }
                    action={
                      <Badge tone={active.channel.type === 'public' ? 'green' : 'gold'}>
                        {active.channel.type === 'public' ? 'Public' : 'Subscribers'}
                      </Badge>
                    }
                  />
                  {error && <Muted>{error}</Muted>}
                  {myAccess && !myAccess.allowed ? (
                    <LockedChannelPanel
                      requiredTier={myAccess.requiredTier}
                      creatorName={active.creator?.name}
                      onUnlock={() =>
                        active.creator
                          ? navigate(`/creators/${active.creator.handle}`)
                          : undefined
                      }
                    />
                  ) : (
                    <ChatPanel
                      messages={chatMessages}
                      loading={messages === undefined}
                      draft={draft}
                      onDraftChange={setDraft}
                      onSend={handleSend}
                      onToggleReaction={handleToggleReaction}
                      sending={sending}
                      placeholder={`Message #${active.channel.slug}`}
                      emptyTitle="Be the first to post."
                      emptySubtitle={`Say hi in #${active.channel.slug} — your message will appear instantly for everyone in the room.`}
                    />
                  )}
                </Card>
              )}
            </Col>
          </Row>
        </Section>
      </Container>
    </main>
  );
}
