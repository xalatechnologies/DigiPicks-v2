import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Button,
  PickCard,
  EmptyState,
  StudioPageHeader,
  StudioDashLayout,
  StudioDashCol,
  StudioFilterPills,
  CreatorProfileStickyAside,
  AccountSidebarPanel,
  AccountSubscriptionRow,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

const FEED_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'NBA', value: 'NBA' },
  { label: 'NFL', value: 'NFL' },
  { label: 'Soccer', value: 'Soccer' },
  { label: 'UFC', value: 'UFC' },
  { label: 'Premium only', value: 'premium' },
];

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function MyFeed() {
  const navigate = useNavigate();
  const [feedFilter, setFeedFilter] = useState('all');

  const subs = useQuery(api.subscriptions.mySubscriptions);
  const sportArg = feedFilter !== 'all' && feedFilter !== 'premium' ? { sport: feedFilter } : {};
  const feed = useQuery(api.feed.personalized, sportArg);
  const save = useMutation(api.savedPicks.save);
  const unsave = useMutation(api.savedPicks.unsave);

  const activeSubs = subs?.filter((sub) => sub.status === 'active') ?? [];
  const feedItems = feed?.items ?? [];

  const pickIds = useMemo(() => feedItems.map((i) => i.pick._id), [feedItems]);
  const savedMap = useQuery(
    api.savedPicks.savedIdsBatch,
    pickIds.length > 0 ? { pickIds } : 'skip',
  );

  const filteredFeed = useMemo(() => {
    if (feedFilter === 'premium') {
      return feedItems.filter((item) => item.pick.access !== 'free');
    }
    return feedItems;
  }, [feedItems, feedFilter]);

  async function toggleSave(pickId: Id<'picks'>, currentlySaved: boolean) {
    try {
      if (currentlySaved) await unsave({ pickId });
      else await save({ pickId });
    } catch {
      /* useQuery recovers */
    }
  }

  const isLoading = feed === undefined;
  const isEmpty = !isLoading && filteredFeed.length === 0;

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Account"
          title="My Feed"
          sub="Personalized picks and insights from your followed creators."
          actions={
            <>
              <Button
                variant="outline"
                iconLeft="bookmark"
                onClick={() => navigate('/account/saved')}
              >
                Saved picks
              </Button>
              <Button
                variant="primary"
                iconRight="arrow-right"
                onClick={() => navigate('/account/discover')}
              >
                Discover creators
              </Button>
            </>
          }
        />

        <StudioFilterPills
          options={FEED_FILTERS}
          value={feedFilter}
          onChange={setFeedFilter}
          ariaLabel="Filter your feed"
          nowrap
        />

        {feed && !feed.personalized ? (
          <EmptyState
            icon="compass"
            title="Subscribe to personalize your feed"
            subtitle="You are seeing picks across the network. Subscribe to creators to unlock your full feed."
            action={
              <Button
                variant="primary"
                iconRight="arrow-right"
                onClick={() => navigate('/account/discover')}
              >
                Discover creators
              </Button>
            }
          />
        ) : null}

        <StudioDashLayout>
          <StudioDashCol span={8}>
            <Stack gap={4}>
              {isLoading ? <EmptyState icon="feed" title="Loading your feed…" /> : null}

              {isEmpty ? (
                <EmptyState
                  icon="feed"
                  title="No picks in this view"
                  subtitle="Try another filter or check back when your creators publish."
                  action={
                    <Button
                      variant="primary"
                      iconRight="arrow-right"
                      onClick={() => navigate('/account/discover')}
                    >
                      Discover creators
                    </Button>
                  }
                />
              ) : null}

              {!isEmpty
                ? filteredFeed.map(({ pick, creator }) => {
                    const isSaved = savedMap?.[pick._id] ?? false;
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
                          pick.publishedAt ? timeAgo(pick.publishedAt) : timeAgo(pick.createdAt)
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
                        saved={isSaved}
                        locked={pick.access !== 'free' && !feed?.personalized}
                        onSave={() => toggleSave(pick._id, isSaved)}
                        onOpen={() => creator && navigate(`/creators/${creator.handle}`)}
                      />
                    );
                  })
                : null}
            </Stack>
          </StudioDashCol>

          <StudioDashCol span={4}>
            <CreatorProfileStickyAside>
              <AccountSidebarPanel title="Followed creators">
                {activeSubs.length === 0 ? (
                  <EmptyState
                    icon="card"
                    title="No subscriptions yet"
                    subtitle="Subscribe to creators to build your feed."
                    action={
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/account/discover')}
                      >
                        Browse creators
                      </Button>
                    }
                  />
                ) : (
                  activeSubs
                    .slice(0, 8)
                    .map((sub, index) => (
                      <AccountSubscriptionRow
                        key={sub._id}
                        name={sub.creatorName}
                        sub={`${sub.plan} · $${sub.creatorStartingPrice}/mo`}
                        mono={sub.creatorMono}
                        color={sub.creatorColor}
                        hasNew={index < 2}
                        onClick={() => navigate(`/creators/${sub.creatorHandle}`)}
                      />
                    ))
                )}
              </AccountSidebarPanel>
            </CreatorProfileStickyAside>
          </StudioDashCol>
        </StudioDashLayout>
      </Stack>
    </Container>
  );
}
