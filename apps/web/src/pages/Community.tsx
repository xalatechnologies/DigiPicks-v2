import React, { useMemo, useState } from 'react';
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
  Badge,
  Mono,
  Muted,
  PersonRow,
  EmptyState,
  ChatPanel,
  LockedChannelPanel,
  Search,
  StudioPageHeader,
  AccountRefineCard,
  StudioDashLayout,
  StudioDashCol,
  type ChatPanelMessage,
} from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { accountLayoutPaths, type LayoutContext } from '../lib/accountLayoutPaths';

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export interface CommunityProps {
  layoutContext?: LayoutContext;
}

export function Community({ layoutContext = 'public' }: CommunityProps) {
  const navigate = useNavigate();
  const paths = accountLayoutPaths(layoutContext);
  const isAccount = layoutContext === 'account';

  const me = useQuery(api.users.meSafe);
  const channels = useQuery(api.channels.list, { limit: 50 });
  const [activeId, setActiveId] = useState<Id<'channels'> | null>(null);
  const [draft, setDraft] = useState('');
  const [channelSearch, setChannelSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messages = useQuery(
    api.messages.listByChannel,
    activeId ? { channelId: activeId, limit: 100 } : 'skip',
  );
  const myAccess = useQuery(api.channels.myAccess, activeId ? { channelId: activeId } : 'skip');
  const postToChannel = useMutation(api.messages.postToChannel);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  const filteredChannels = useMemo(() => {
    if (!channels) return undefined;
    if (!channelSearch.trim()) return channels;
    const q = channelSearch.toLowerCase();
    return channels.filter(
      ({ channel, creator }) =>
        channel.name.toLowerCase().includes(q) ||
        channel.slug.toLowerCase().includes(q) ||
        creator?.name.toLowerCase().includes(q),
    );
  }, [channels, channelSearch]);

  React.useEffect(() => {
    if (!activeId && filteredChannels && filteredChannels.length > 0) {
      setActiveId(filteredChannels[0]!.channel._id);
    }
  }, [activeId, filteredChannels]);

  const active = filteredChannels?.find((c) => c.channel._id === activeId) ?? null;

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

  const channelList =
    channels === undefined ? (
      <EmptyState icon="message" title="Loading channels…" />
    ) : filteredChannels!.length === 0 ? (
      <EmptyState
        icon="message"
        title={channels.length === 0 ? 'No channels yet.' : 'No channels match'}
        subtitle={
          channels.length === 0
            ? 'Verified creators can spin up community rooms from their dashboard.'
            : 'Try another search term.'
        }
      />
    ) : (
      <Stack gap={1}>
        {filteredChannels!.map(({ channel, creator }) => {
          const isActive = channel._id === activeId;
          return (
            <Card key={channel._id} hover pad="sm" onClick={() => setActiveId(channel._id)}>
              <PersonRow
                name={channel.name}
                sub={creator ? `by ${creator.name}` : (channel.description ?? 'Community channel')}
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
    );

  const chatPane = !active ? (
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
            : (active.channel.description ?? 'Community channel')
        }
        action={
          <Badge tone={active.channel.type === 'public' ? 'green' : 'gold'}>
            {active.channel.type === 'public' ? 'Public' : 'Subscribers'}
          </Badge>
        }
      />
      {error ? <Muted>{error}</Muted> : null}
      {myAccess && !myAccess.allowed ? (
        <LockedChannelPanel
          requiredTier={myAccess.requiredTier}
          creatorName={active.creator?.name}
          onUnlock={() =>
            active.creator ? navigate(`/creators/${active.creator.handle}`) : undefined
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
  );

  if (isAccount) {
    return (
      <Container size="2xl">
        <Stack gap={6}>
          <StudioPageHeader
            eyebrow="Account · Community"
            title="Live discussions"
            sub="Public rooms hosted by verified creators. Pick a channel to join the conversation around tonight's slate."
            actions={
              <Button variant="outline" iconLeft="users" onClick={() => navigate(paths.discover)}>
                Find creators
              </Button>
            }
          />

          <AccountRefineCard
            title="Refine channels"
            sub="Search by room name, slug, or host."
            summary={
              channels === undefined
                ? 'Loading channels…'
                : `${filteredChannels?.length ?? 0} channel${(filteredChannels?.length ?? 0) === 1 ? '' : 's'}`
            }
            onReset={channelSearch.trim() ? () => setChannelSearch('') : undefined}
          >
            <Search
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              placeholder="Search channels"
              aria-label="Search community channels"
            />
          </AccountRefineCard>

          <StudioDashLayout>
            <StudioDashCol span={4}>
              <Card pad="sm">
                <CardHead title="Channels" sub="Public rooms" />
                {channelList}
              </Card>
            </StudioDashCol>
            <StudioDashCol span={8}>{chatPane}</StudioDashCol>
          </StudioDashLayout>
        </Stack>
      </Container>
    );
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
                onClick={() => navigate(paths.creatorsBrowse)}
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
                {channelList}
              </Card>
            </Col>
            <Col gap={3}>{chatPane}</Col>
          </Row>
        </Section>
      </Container>
    </main>
  );
}
