import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  StudioPageHeader,
  Muted,
  EmptyState,
  Heading,
  DiscordDiscussionSummary,
  DiscordThreadLinkBadge,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

// =============================================================================
// M20 Discord discussions surface — for each of the creator's recent picks
// we show the linked Discord thread (if any) plus the latest sentiment
// summary. "Generate summary" triggers a manual recompute.
// =============================================================================

const MAX_PICKS = 20;

interface PickDiscussionRowProps {
  pickId: Id<'picks'>;
  pickTitle: string;
  pickSport: string;
}

function PickDiscussionRow({ pickId, pickTitle, pickSport }: PickDiscussionRowProps) {
  const linked = useQuery(api.discord.threads.getLinkedDiscussion, {
    linkedEntityType: 'pick',
    linkedEntityId: pickId,
  });

  if (linked === undefined) {
    return null;
  }
  if (!linked.hasDiscussion) {
    return null;
  }

  const summary = linked.summary;

  return (
    <Card pad="md">
      <CardHead
        title={pickTitle}
        sub={pickSport}
        action={
          <DiscordThreadLinkBadge
            threadName={linked.badge.threadName}
            messageCount={linked.badge.messageCount}
            lastActivityAt={linked.badge.lastActivityAt}
          />
        }
      />
      {summary ? (
        <DiscordDiscussionSummary
          avgSentiment={summary.avgSentiment}
          messageCount={summary.messageCount}
          summary={summary.summary}
          topThemes={summary.topThemes}
          windowStart={summary.windowStart}
          windowEnd={summary.windowEnd}
        />
      ) : (
        <Muted>
          No sentiment summary yet — generate one below to see what the community is saying.
        </Muted>
      )}
    </Card>
  );
}

export function DiscordDiscussions() {
  const navigate = useNavigate();
  const me = useQuery(api.users.me);
  const creatorId = me?.creatorId ?? null;

  const integrations = useQuery(
    api.discord.integrationsDb.getCreatorIntegrations,
    creatorId ? { creatorId } : 'skip',
  );
  const recentPicks = useQuery(
    api.picks.byCreator,
    creatorId ? { creatorId, limit: MAX_PICKS } : 'skip',
  );

  const generateSummary = useAction(api.discord.sentiment.generateDiscussionSummary);

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [statusMsg, setStatusMsg] = React.useState<string | null>(null);

  async function handleGenerate() {
    if (!creatorId) return;
    setError(null);
    setStatusMsg(null);
    setBusy(true);
    try {
      const result = await generateSummary({ creatorId });
      if (result.skipped) {
        setStatusMsg('Skipped — Anthropic API key is not configured on this deployment.');
      } else {
        setStatusMsg(`Generated ${result.written} summary row${result.written === 1 ? '' : 's'}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate summary.');
    } finally {
      setBusy(false);
    }
  }

  const integrationList = integrations ?? [];
  const pickList = recentPicks ?? [];

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Community"
          title="Linked discussions"
          sub="Discord threads tied to your picks, events, and livestreams. Sentiment rollups are refreshed on demand."
          actions={
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              disabled={busy || !creatorId}
            >
              <Icon name="sparkles" size={13} />
              {busy ? 'Generating…' : 'Generate summaries'}
            </Button>
          }
        />

        {error && <Muted>{error}</Muted>}
        {statusMsg && <Muted>{statusMsg}</Muted>}

        {integrations === undefined ? (
          <Card>
            <EmptyState icon="discord" title="Loading integrations…" />
          </Card>
        ) : integrationList.length === 0 ? (
          <Card>
            <EmptyState
              icon="discord"
              title="No Discord guilds connected"
              subtitle="Connect a guild from Studio → Settings → Discord to start linking threads to your picks."
            />
          </Card>
        ) : (
          integrationList.map((integ) => (
            <Card key={integ._id}>
              <CardHead title={integ.guildName} sub={`Status · ${integ.status}`} />
              <Stack gap={3}>
                <Heading level={4} size="md">
                  Recent picks with linked threads
                </Heading>
                {recentPicks === undefined ? (
                  <EmptyState icon="feed" title="Loading picks…" />
                ) : pickList.length === 0 ? (
                  <EmptyState
                    icon="feed"
                    title="No recent picks yet"
                    subtitle="Publish a pick and link a Discord thread to it from the pick detail page."
                  />
                ) : (
                  <Stack gap={3}>
                    {pickList.map((pick) => (
                      <PickDiscussionRow
                        key={pick._id}
                        pickId={pick._id}
                        pickTitle={pick.title}
                        pickSport={pick.sport}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Card>
          ))
        )}
      </Stack>
    </Container>
  );
}
