import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Card,
  Button,
  Icon,
  Badge,
  Muted,
  PersonRow,
  PickCard,
  EmptyState,
  FilterChips,
  DashGrid,
  PortfolioHero,
  SectionHead,
  InsightCard,
  RowList,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

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
  return `${Math.floor(h / 24)}d ago`;
}

function winRateLabel(rate: number): string {
  if (rate >= 60) return 'On fire';
  if (rate >= 55) return 'Profitable';
  if (rate >= 50) return 'Break-even';
  if (rate > 0) return 'Below .500';
  return 'No data';
}

export function Dashboard() {
  const navigate = useNavigate();
  const [sport, setSport] = React.useState<string | null>(null);

  const me = useQuery(api.users.meSafe);
  const portfolio = useQuery(api.subscriberStats.myPortfolio);
  const recent = useQuery(api.subscriberStats.recentResults);
  const subs = useQuery(api.subscriptions.mySubscriptions);
  const feed = useQuery(api.feed.personalized, sport ? { sport } : {});
  const save = useMutation(api.savedPicks.save);
  const unsave = useMutation(api.savedPicks.unsave);

  const displayName = me?.name ?? 'there';
  const activeSubs = subs?.filter((sub) => sub.status === 'active') ?? [];
  const totalMonthly = activeSubs.reduce((sum, s) => sum + s.creatorStartingPrice, 0);
  const feedItems = feed?.items ?? [];
  const hasPortfolio = Boolean(portfolio && portfolio.totalPicks > 0);

  const pickIds = React.useMemo(() => feedItems.map((i) => i.pick._id), [feedItems]);
  const savedMap = useQuery(
    api.savedPicks.savedIdsBatch,
    pickIds.length > 0 ? { pickIds } : 'skip',
  );

  async function toggleSave(pickId: Id<'picks'>, currentlySaved: boolean) {
    try {
      if (currentlySaved) await unsave({ pickId });
      else await save({ pickId });
    } catch {
      /* useQuery recovers */
    }
  }

  const sparkData = React.useMemo(() => {
    if (!recent || recent.length === 0) return [0, 0];
    let running = 0;
    return [...recent].reverse().map((p) => {
      if (p.grade === 'win') running += parseFloat(p.netUnits ?? p.units ?? '1');
      else if (p.grade === 'loss') running -= parseFloat(p.units ?? '1');
      return Math.round(running * 10) / 10;
    });
  }, [recent]);

  const isLoading = feed === undefined;
  const isEmpty = !isLoading && feedItems.length === 0;

  const aside = (
    <>
      <InsightCard
        tone="green"
        eyebrow={
          activeSubs.length > 0
            ? `${activeSubs.length} active · $${totalMonthly}/mo`
            : 'No subscriptions'
        }
        title="Subscriptions"
        sub="Manage your creator plans"
        action={
          <Button
            variant="ghost"
            size="sm"
            iconRight="arrow-right"
            onClick={() => navigate('/account/subscriptions')}
          >
            Manage
          </Button>
        }
      >
        {activeSubs.length === 0 ? (
          <EmptyState
            icon="card"
            title="No subscriptions yet"
            subtitle="Subscribe to unlock premium picks and personalize your feed."
            action={
              <Button
                variant="primary"
                size="sm"
                iconRight="arrow-right"
                onClick={() => navigate('/account/discover')}
              >
                Browse creators
              </Button>
            }
          />
        ) : (
          <RowList
            items={activeSubs.slice(0, 4)}
            getKey={(sub) => sub._id}
            renderItem={(sub) => (
              <PersonRow
                name={sub.creatorName}
                sub={sub.plan}
                mono={sub.creatorMono}
                color={sub.creatorColor}
                trailing={<Badge tone="green">${sub.creatorStartingPrice}/mo</Badge>}
              />
            )}
          />
        )}
      </InsightCard>

      {recent && recent.length > 0 && (
        <InsightCard
          tone="gold"
          eyebrow="Latest grades"
          title="Recent results"
          action={
            <Button
              variant="ghost"
              size="sm"
              iconRight="arrow-right"
              onClick={() => navigate('/account/results')}
            >
              All
            </Button>
          }
        >
          <RowList
            items={recent.slice(0, 5)}
            getKey={(pick) => pick._id}
            renderItem={(pick) => (
              <PersonRow
                name={pick.title}
                sub={`${pick.creatorName} · ${pick.sport}`}
                mono={pick.creatorMono}
                color={pick.creatorColor}
                trailing={
                  <Badge
                    tone={
                      pick.grade === 'win'
                        ? 'green'
                        : pick.grade === 'loss'
                          ? 'red'
                          : pick.grade === 'push'
                            ? 'gold'
                            : 'mute'
                    }
                    dot
                  >
                    {pick.grade ?? 'pending'}
                  </Badge>
                }
              />
            )}
          />
        </InsightCard>
      )}

      <InsightCard tone="blue" eyebrow="Shortcuts" title="Jump to" sub="Frequent destinations">
        <RowList
          items={[
            {
              name: 'Saved picks',
              sub: 'Review bookmarks',
              mono: 'B',
              color: 'var(--blue)',
              to: '/account/saved',
            },
            {
              name: 'Discover creators',
              sub: 'Find your next edge',
              mono: 'D',
              color: 'var(--green)',
              to: '/account/discover',
            },
            {
              name: 'Community',
              sub: 'Join the conversation',
              mono: 'C',
              color: 'var(--amber)',
              to: '/account/community',
            },
          ]}
          getKey={(it) => it.to}
          renderItem={(it) => (
            <PersonRow
              name={it.name}
              sub={it.sub}
              mono={it.mono}
              color={it.color}
              trailing={<Icon name="arrow-right" size={14} />}
              onClick={() => navigate(it.to)}
            />
          )}
        />
      </InsightCard>
    </>
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        crumbs={[{ label: 'Account' }, { label: 'Dashboard' }]}
        actions={
          <Row gap={2}>
            <Button
              variant="secondary"
              size="sm"
              iconLeft="card"
              onClick={() => navigate('/account/subscriptions')}
            >
              Manage subs
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconRight="arrow-right"
              onClick={() => navigate('/account/discover')}
            >
              Discover
            </Button>
          </Row>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PortfolioHero
            eyebrow={hasPortfolio ? 'Portfolio · live' : 'Welcome'}
            title={`Welcome back, ${displayName}`}
            sub={
              hasPortfolio
                ? 'Your followed plays at a glance — units, record, and streak.'
                : 'Subscribe to creators and your tracked plays will build your portfolio here.'
            }
            empty={!hasPortfolio}
            emptyTitle="No tracked plays yet"
            emptySub="Subscribe to a creator and any followed picks they grade will start populating your portfolio."
            emptyAction={
              <Button
                variant="primary"
                size="sm"
                iconRight="arrow-right"
                onClick={() => navigate('/account/discover')}
              >
                Discover creators
              </Button>
            }
            winRate={hasPortfolio ? portfolio!.winRate : undefined}
            winRateLabel={hasPortfolio ? winRateLabel(portfolio!.winRate) : undefined}
            kpis={
              hasPortfolio
                ? [
                    {
                      label: 'Net units',
                      value: `${portfolio!.netUnits > 0 ? '+' : ''}${portfolio!.netUnits}u`,
                      tone:
                        portfolio!.netUnits > 0
                          ? 'green'
                          : portfolio!.netUnits < 0
                            ? 'red'
                            : 'neutral',
                    },
                    {
                      label: 'Record',
                      value: `${portfolio!.wins}W-${portfolio!.losses}L`,
                      tone: 'neutral',
                    },
                    {
                      label: 'Active subs',
                      value: String(activeSubs.length),
                      tone: 'neutral',
                    },
                    {
                      label: 'Streak',
                      value: portfolio!.streak,
                      tone: portfolio!.streak.startsWith('W')
                        ? 'gold'
                        : portfolio!.streak.startsWith('L')
                          ? 'red'
                          : 'neutral',
                    },
                  ]
                : []
            }
            spark={hasPortfolio ? sparkData : undefined}
          />

          <SectionHead
            eyebrow="Your feed"
            title={feed?.personalized ? 'Latest from creators you follow' : 'Trending picks'}
            sub={
              feed?.personalized
                ? `${feedItems.length} pick${feedItems.length === 1 ? '' : 's'} from your subscriptions`
                : 'Discover mode — subscribe to personalize your feed.'
            }
            action={
              <FilterChips
                options={SPORT_FILTERS}
                value={sport}
                onChange={setSport}
                allLabel="All sports"
              />
            }
          />

          <DashGrid aside={aside}>
            {feed && !feed.personalized && (
              <Card>
                <Row gap={3} between>
                  <Row gap={2}>
                    <Badge tone="blue" dot>
                      Discover mode
                    </Badge>
                    <Muted>Subscribe to personalize your feed.</Muted>
                  </Row>
                  <Button
                    variant="outline"
                    size="sm"
                    iconRight="arrow-right"
                    onClick={() => navigate('/account/discover')}
                  >
                    Browse creators
                  </Button>
                </Row>
              </Card>
            )}

            {isLoading && <EmptyState icon="feed" title="Loading your feed…" />}

            {isEmpty && (
              <EmptyState
                icon="feed"
                title="No picks yet"
                subtitle="Check back later — your subscribed creators publish daily."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    iconRight="arrow-right"
                    onClick={() => navigate('/account/discover')}
                  >
                    Discover creators
                  </Button>
                }
              />
            )}

            {!isEmpty &&
              feedItems.map(({ pick, creator }) => {
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
                    posted={pick.publishedAt ? timeAgo(pick.publishedAt) : timeAgo(pick.createdAt)}
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
                    onSave={() => toggleSave(pick._id, isSaved)}
                    onOpen={() => creator && navigate(`/creators/${creator.handle}`)}
                  />
                );
              })}
          </DashGrid>
        </Stack>
      </Container>
    </>
  );
}
