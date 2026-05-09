import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Section,
  PageHead,
  Row,
  Stack,
  Card,
  Button,
  Badge,
  Icon,
  PickCard,
  EmptyState,
  FilterChips,
  Muted,
} from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

const SPORT_FILTERS = [
  { label: 'Soccer', value: 'Soccer', icon: <Icon name="soccer" size={14} /> },
  { label: 'Cricket', value: 'Cricket', icon: <Icon name="cricket" size={14} /> },
  { label: 'Tennis', value: 'Tennis', icon: <Icon name="tennis" size={14} /> },
];

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

export function Feed() {
  const navigate = useNavigate();
  const [sport, setSport] = React.useState<string | null>(null);

  const feed = useQuery(api.feed.personalized, sport ? { sport } : {});
  const save = useMutation(api.savedPicks.save);
  const unsave = useMutation(api.savedPicks.unsave);

  const items = feed?.items ?? [];
  const pickIds = React.useMemo(
    () => items.map((i) => i.pick._id),
    [items],
  );
  const savedMap = useQuery(
    api.savedPicks.savedIdsBatch,
    pickIds.length > 0 ? { pickIds } : 'skip',
  );

  const isLoading = feed === undefined;
  const isEmpty = !isLoading && items.length === 0;

  async function toggleSave(pickId: Id<'picks'>, currentlySaved: boolean) {
    try {
      if (currentlySaved) {
        await unsave({ pickId });
      } else {
        await save({ pickId });
      }
    } catch {
      // Surface inline later; for now silently swallow — the optimistic
      // re-query from useQuery will recover state.
    }
  }

  return (
    <main>
      <Container size="xl">
        <PageHead
          eyebrow="Your feed"
          title="Picks from creators you follow."
          sub="Latest published picks from the creators you've subscribed to. Save anything you want to track."
          actions={
            <Row gap={2}>
              <Button
                variant="secondary"
                iconLeft="bookmark"
                onClick={() => navigate('/saved')}
              >
                Saved library
              </Button>
              <Button
                variant="primary"
                iconRight="arrow-right"
                onClick={() => navigate('/creators')}
              >
                Find creators
              </Button>
            </Row>
          }
        />

        <Section>
          <FilterChips
            options={SPORT_FILTERS}
            value={sport}
            onChange={setSport}
            allLabel="All sports"
          />
        </Section>

        {feed && !feed.personalized && (
          <Section>
            <Card>
              <Row gap={3}>
                <Badge tone="blue" dot>
                  Discover mode
                </Badge>
                <Muted>
                  You haven't subscribed to any creators yet — showing the
                  latest picks across the network. Subscribe to personalize
                  this feed.
                </Muted>
                <Button
                  variant="outline"
                  size="sm"
                  iconRight="arrow-right"
                  onClick={() => navigate('/creators')}
                >
                  Browse creators
                </Button>
              </Row>
            </Card>
          </Section>
        )}

        {isLoading && (
          <Section>
            <EmptyState icon="feed" title="Loading your feed…" />
          </Section>
        )}

        {isEmpty && (
          <Section>
            <EmptyState
              icon="feed"
              title="No picks yet."
              subtitle="Check back later — your subscribed creators publish daily."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  iconRight="arrow-right"
                  onClick={() => navigate('/creators')}
                >
                  Discover creators
                </Button>
              }
            />
          </Section>
        )}

        {!isEmpty && items.length > 0 && (
          <Section>
            <Stack gap={4}>
              {items.map(({ pick, creator }) => {
                const saved = savedMap?.[pick._id] ?? false;
                return (
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
                    posted={
                      pick.publishedAt
                        ? timeAgo(pick.publishedAt)
                        : timeAgo(pick.createdAt)
                    }
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
                    saved={saved}
                    onSave={() => toggleSave(pick._id, saved)}
                    onOpen={() =>
                      creator && navigate(`/creators/${creator.handle}`)
                    }
                  />
                );
              })}
            </Stack>
          </Section>
        )}
      </Container>
    </main>
  );
}
