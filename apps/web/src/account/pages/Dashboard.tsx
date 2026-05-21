import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Grid,
  Button,
  EmptyState,
  StudioPageHeader,
  AccountStatCard,
  AccountDashboardSection,
  AccountLiveEventCard,
  AccountSidebarPanel,
  AccountSubscriptionRow,
  AccountSavedPreview,
  AccountTopicChips,
  Heading,
  StudioDashLayout,
  StudioDashCol,
  CreatorProfileStickyAside,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

const TRENDING_TOPICS = ['NBA props', 'NFL spreads', 'Soccer value', 'Tennis ML', 'Cricket tips'];

function greeting(name: string): string {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  return `Good ${period}, ${name}`;
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

  const me = useQuery(api.users.meSafe);
  const subs = useQuery(api.subscriptions.mySubscriptions);
  const feed = useQuery(api.feed.personalized, {});
  const liveEvents = useQuery(api.events.live, {});
  const upcomingEvents = useQuery(api.events.today, {});
  const saved = useQuery(api.savedPicks.list, { limit: 5 });

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

  const eventRail = useMemo(() => {
    const live = liveEvents ?? [];
    const upcoming = (upcomingEvents ?? []).filter((e) => e.status === 'upcoming').slice(0, 4);
    return [...live, ...upcoming.filter((e) => !live.some((l) => l._id === e._id))].slice(0, 6);
  }, [liveEvents, upcomingEvents]);

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Account · Dashboard"
          title="Dashboard"
          sub="Stats, subscriptions, and live slate at a glance."
          actions={
            <>
              <Button variant="outline" onClick={() => navigate('/account/subscriptions')}>
                Manage subs
              </Button>
              <Button
                variant="primary"
                iconRight="arrow-right"
                onClick={() => navigate('/account/feed')}
              >
                My feed
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
              onClick={() => navigate('/account/feed')}
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

        <StudioDashLayout>
          <StudioDashCol span={12}>
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
      </Stack>
    </Container>
  );
}
