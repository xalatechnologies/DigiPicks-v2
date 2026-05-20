import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Grid,
  Button,
  PickCard,
  EmptyState,
  StudioPageHeader,
  StudioDashLayout,
  StudioDashCol,
  AccountRefineCard,
  StudioFilterPills,
  CreatorProfileStickyAside,
  AccountStatCard,
  AccountDashboardSection,
  AccountLiveEventCard,
  AccountSidebarPanel,
  AccountSubscriptionRow,
  AccountSavedPreview,
  AccountTopicChips,
  Heading,
  QuickActionGrid,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { accountCrossLinks } from '../../lib/accountCrossLinks';
import type { Id } from '../../../../../convex/_generated/dataModel';

const FEED_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Following', value: 'following' },
  { label: 'Live now', value: 'live' },
  { label: 'Locked', value: 'locked' },
  { label: 'Free', value: 'free' },
];

const TRENDING_TOPICS = ['NBA props', 'NFL spreads', 'Soccer value', 'Tennis ML', 'Cricket tips'];

function greeting(name: string): string {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  return `Good ${period}, ${name}`;
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isToday(ms: number): boolean {
  const d = new Date(ms);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function scoreDisplay(ev: {
  homeScore?: number;
  awayScore?: number;
  gameStatus?: string;
}): string | undefined {
  if (ev.awayScore != null && ev.homeScore != null) {
    return `${ev.awayScore} - ${ev.homeScore}`;
  }
  return undefined;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [feedFilter, setFeedFilter] = useState('all');

  const me = useQuery(api.users.meSafe);
  const subs = useQuery(api.subscriptions.mySubscriptions);
  const feed = useQuery(api.feed.personalized, {});
  const liveEvents = useQuery(api.events.live, {});
  const upcomingEvents = useQuery(api.events.today, {});
  const saved = useQuery(api.savedPicks.list, { limit: 5 });
  const save = useMutation(api.savedPicks.save);
  const unsave = useMutation(api.savedPicks.unsave);

  const displayName = me?.name?.split(' ')[0] ?? 'there';
  const activeSubs = subs?.filter((sub) => sub.status === 'active') ?? [];
  const feedItems = feed?.items ?? [];

  const picksToday = useMemo(
    () =>
      feedItems.filter((item) => {
        const ts = item.pick.publishedAt ?? item.pick.createdAt;
        return isToday(ts);
      }).length,
    [feedItems],
  );

  const pickIds = useMemo(() => feedItems.map((i) => i.pick._id), [feedItems]);
  const savedMap = useQuery(
    api.savedPicks.savedIdsBatch,
    pickIds.length > 0 ? { pickIds } : 'skip',
  );

  const filteredFeed = useMemo(() => {
    let list = feedItems;
    switch (feedFilter) {
      case 'following':
        list = feed?.personalized ? list : [];
        break;
      case 'live':
        list = list.filter(
          (item) =>
            item.pick.eventName &&
            (liveEvents ?? []).some(
              (ev) =>
                item.pick.eventName!.includes(ev.home) || item.pick.eventName!.includes(ev.away),
            ),
        );
        break;
      case 'locked':
        list = list.filter((item) => item.pick.access !== 'free');
        break;
      case 'free':
        list = list.filter((item) => item.pick.access === 'free');
        break;
      case 'all':
      default:
        break;
    }
    return list;
  }, [feedItems, feedFilter, feed?.personalized, liveEvents]);

  const eventRail = useMemo(() => {
    const live = liveEvents ?? [];
    const upcoming = (upcomingEvents ?? []).filter((e) => e.status === 'upcoming').slice(0, 4);
    return [...live, ...upcoming.filter((e) => !live.some((l) => l._id === e._id))].slice(0, 6);
  }, [liveEvents, upcomingEvents]);

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
          eyebrow="Account · Dashboard"
          title="Dashboard"
          sub="Your feed, subscriptions, and live slate in one place."
          actions={
            <>
              <Button variant="outline" onClick={() => navigate('/account/subscriptions')}>
                Manage subs
              </Button>
              <Button
                variant="primary"
                iconRight="arrow-right"
                onClick={() => navigate('/account/discover')}
              >
                Discover
              </Button>
            </>
          }
        />

        <Stack gap={4}>
          <Heading level={2} size="2xl">
            {greeting(displayName)}
          </Heading>
          <Grid cols={3} gap={5} stagger={false}>
            <AccountStatCard
              icon="feed"
              value={picksToday}
              label="New picks today"
              onClick={() => setFeedFilter('all')}
            />
            <AccountStatCard
              icon="card"
              value={activeSubs.length}
              label="Active subscriptions"
              onClick={() => navigate('/account/subscriptions')}
            />
            <AccountStatCard
              icon="flame"
              iconTone="danger"
              value={(liveEvents ?? []).length}
              label="Live events now"
              onClick={() => navigate('/account/events')}
            />
          </Grid>
        </Stack>

        {eventRail.length > 0 ? (
          <AccountDashboardSection
            title="Live now & upcoming"
            actionLabel="View schedule"
            onAction={() => navigate('/account/events')}
            rail
          >
            {eventRail.map((ev) => {
              const live = ev.status === 'live';
              const score = scoreDisplay(ev);
              return (
                <AccountLiveEventCard
                  key={ev._id}
                  sport={ev.sport}
                  timeLabel={live ? (ev.gameStatus ?? 'Live') : ev.time}
                  away={ev.away}
                  home={ev.home}
                  live={live}
                  scoreDisplay={score}
                  statusLabel={!score ? (live ? ev.gameStatus : `Starts ${ev.time}`) : undefined}
                  ctaLabel={live ? 'Watch now' : 'Pre-game picks'}
                  onCta={() => navigate('/account/events')}
                />
              );
            })}
          </AccountDashboardSection>
        ) : null}

        <AccountRefineCard
          title="Refine feed"
          sub="Choose what appears in your personalized pick stream."
          summary={
            isLoading
              ? 'Loading your feed…'
              : `${filteredFeed.length} pick${filteredFeed.length === 1 ? '' : 's'} in view`
          }
          onReset={feedFilter !== 'all' ? () => setFeedFilter('all') : undefined}
        >
          <StudioFilterPills
            options={FEED_FILTERS}
            value={feedFilter}
            onChange={setFeedFilter}
            ariaLabel="Filter your feed"
            nowrap
          />
        </AccountRefineCard>

        <StudioDashLayout>
          <StudioDashCol span={8}>
            <Stack gap={4}>
              {feed && !feed.personalized && feedFilter === 'following' ? (
                <EmptyState
                  icon="compass"
                  title="Subscribe to follow creators"
                  subtitle="Your personalized feed unlocks once you subscribe to at least one creator."
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

              {isLoading ? <EmptyState icon="feed" title="Loading your feed…" /> : null}

              {isEmpty && feedFilter !== 'following' ? (
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
              <Stack gap={6}>
                <AccountSidebarPanel title="Top subscriptions">
                  {activeSubs.length === 0 ? (
                    <EmptyState
                      icon="card"
                      title="No subscriptions yet"
                      subtitle="Subscribe to unlock premium picks in your feed."
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
                      .slice(0, 5)
                      .map((sub, index) => (
                        <AccountSubscriptionRow
                          key={sub._id}
                          name={sub.creatorName}
                          sub={
                            index === 0
                              ? 'Latest activity'
                              : `${sub.plan} · $${sub.creatorStartingPrice}/mo`
                          }
                          mono={sub.creatorMono}
                          color={sub.creatorColor}
                          hasNew={index < 2}
                          muted={index > 2}
                          onClick={() => navigate(`/creators/${sub.creatorHandle}`)}
                        />
                      ))
                  )}
                </AccountSidebarPanel>

                <AccountSidebarPanel title="Saved for later">
                  {(saved ?? []).length === 0 ? (
                    <EmptyState
                      icon="bookmark"
                      title="Nothing saved"
                      subtitle="Bookmark picks from your feed to track them here."
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/account/saved')}
                        >
                          Open saved
                        </Button>
                      }
                    />
                  ) : (
                    (saved ?? [])
                      .slice(0, 3)
                      .map((row) => (
                        <AccountSavedPreview
                          key={row.savedId}
                          meta={`${row.pick.sport.toUpperCase()} · saved`}
                          title={row.pick.title}
                          onClick={() => navigate('/account/saved')}
                        />
                      ))
                  )}
                </AccountSidebarPanel>

                <AccountSidebarPanel title="Trending topics">
                  <AccountTopicChips
                    topics={TRENDING_TOPICS}
                    onSelect={() => navigate('/account/discover')}
                  />
                </AccountSidebarPanel>

                <AccountSidebarPanel title="Creator channels" variant="accent">
                  <AccountSubscriptionRow
                    name="Community & alerts"
                    sub="Discord and pick notifications"
                    mono="DC"
                    color="var(--primary)"
                    onClick={() => navigate('/account/notifications')}
                  />
                </AccountSidebarPanel>
              </Stack>
            </CreatorProfileStickyAside>
          </StudioDashCol>
        </StudioDashLayout>

        <QuickActionGrid title="Related" items={accountCrossLinks('dashboard', navigate)} />
      </Stack>
    </Container>
  );
}
