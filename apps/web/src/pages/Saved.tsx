import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Section,
  PageHead,
  Row,
  Stack,
  Button,
  Icon,
  PickCard,
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function Saved() {
  const navigate = useNavigate();
  const items = useQuery(api.savedPicks.list, { limit: 100 });
  const unsave = useMutation(api.savedPicks.unsave);

  const isLoading = items === undefined;
  const isEmpty = !isLoading && items.length === 0;

  async function handleUnsave(pickId: Id<'picks'>) {
    try {
      await unsave({ pickId });
    } catch {
      // Silently swallow — useQuery will reflect actual state.
    }
  }

  return (
    <main>
      <Container size="xl">
        <PageHead
          eyebrow="Library"
          title="Saved picks."
          sub="Bookmark any pick to track it here. Picks stay saved even after they're graded — keep tabs on win/loss outcomes for the calls you bet on."
          actions={
            <Row gap={2}>
              <Button
                variant="secondary"
                iconLeft="feed"
                onClick={() => navigate('/feed')}
              >
                Back to feed
              </Button>
            </Row>
          }
        />

        {isLoading && (
          <Section>
            <EmptyState icon="bookmark" title="Loading saved picks…" />
          </Section>
        )}

        {isEmpty && (
          <Section>
            <EmptyState
              icon="bookmark"
              title="Nothing saved yet."
              subtitle="Tap “Save” on any pick in your feed to bookmark it here."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  iconRight="arrow-right"
                  onClick={() => navigate('/feed')}
                >
                  Open feed
                </Button>
              }
            />
          </Section>
        )}

        {items && items.length > 0 && (
          <Section>
            <Stack gap={4}>
              {items.map(({ pick, creator, savedAt }) => (
                <PickCard
                  key={pick._id}
                  creatorName={creator?.name ?? 'Unknown'}
                  creatorHandle={creator?.handle ?? ''}
                  creatorMono={creator?.avatarMono ?? ''}
                  creatorColor={creator?.avatarColor ?? ''}
                  creatorVerified={creator?.verified ?? false}
                  access={pick.access}
                  sport={pick.sport}
                  event={pick.eventName}
                  eventTime={pick.eventTime}
                  posted={`saved ${timeAgo(savedAt)}`}
                  title={pick.title}
                  market={pick.market}
                  selection={pick.selection}
                  odds={pick.odds}
                  units={pick.units}
                  body={pick.body}
                  teaser={pick.teaser}
                  status={pick.grade ?? 'pending'}
                  aiSummary={pick.aiSummary}
                  aiConfidence={pick.aiConfidence}
                  aiReasoning={pick.aiReasoning}
                  aiModel={pick.aiModel}
                  saved
                  onSave={() => handleUnsave(pick._id)}
                  onOpen={() =>
                    creator && navigate(`/creators/${creator.handle}`)
                  }
                />
              ))}
            </Stack>
          </Section>
        )}
      </Container>
    </main>
  );
}
