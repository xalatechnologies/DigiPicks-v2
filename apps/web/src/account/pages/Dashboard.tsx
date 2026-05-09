import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  Mono,
  Badge,
  Muted,
  Sparkline,
  MetricGrid,
  PersonRow,
  TitleSub,
  PickCard,
  EmptyState,
  Stat,
  Eyebrow,
  Divider,
  FilterChips,
  DashGrid,
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
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

interface QuickActionProps {
  icon: string;
  title: string;
  sub: string;
  cta: string;
  onClick?: () => void;
}

function QuickAction({ icon, title, sub, cta, onClick }: QuickActionProps) {
  return (
    <Card hover pad="sm" onClick={onClick}>
      <Row gap={3} between>
        <Row gap={3}>
          <Button variant="secondary" size="sm" iconOnly aria-label={title}>
            <Icon name={icon} size={16} />
          </Button>
          <TitleSub title={title} sub={sub} />
        </Row>
        <Button variant="ghost" size="sm">
          {cta}
          <Icon name="arrow-right" size={12} />
        </Button>
      </Row>
    </Card>
  );
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
  const activeSubs = subs?.filter((s) => s.status === 'active') ?? [];
  const totalMonthly = activeSubs.reduce((sum, s) => sum + s.creatorStartingPrice, 0);
  const feedItems = feed?.items ?? [];

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

  // Sparkline from portfolio results
  const sparkData = React.useMemo(() => {
    if (!recent || recent.length === 0) return [0];
    let running = 0;
    const points: number[] = [];
    for (const p of [...recent].reverse()) {
      if (p.grade === 'win') running += parseFloat(p.netUnits ?? p.units ?? '1');
      else if (p.grade === 'loss') running -= parseFloat(p.units ?? '1');
      points.push(Math.round(running * 10) / 10);
    }
    return points.length > 0 ? points : [0];
  }, [recent]);

  const isLoading = feed === undefined;
  const isEmpty = !isLoading && feedItems.length === 0;

  // ── Sidebar content ──────────────────────────────────────────────────
  const aside = (
    <>
      {/* Quick actions */}
      <Card>
        <CardHead title="Quick actions" />
        <Stack gap={2}>
          <QuickAction
            icon="bookmark"
            title="Saved picks"
            sub="Review bookmarks"
            cta="Open"
            onClick={() => navigate('/account/saved')}
          />
          <QuickAction
            icon="compass"
            title="Discover"
            sub="Find your next edge"
            cta="Browse"
            onClick={() => navigate('/account/discover')}
          />
          <QuickAction
            icon="message"
            title="Community"
            sub="Join the conversation"
            cta="Chat"
            onClick={() => navigate('/account/community')}
          />
        </Stack>
      </Card>

      {/* Active subscriptions */}
      <Card>
        <CardHead
          title="Subscriptions"
          sub={`${activeSubs.length} active`}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/account/subscriptions')}>
              Manage
              <Icon name="arrow-right" size={12} />
            </Button>
          }
        />
        {activeSubs.length === 0 ? (
          <EmptyState
            icon="card"
            title="No subscriptions"
            subtitle="Subscribe to unlock premium picks."
            action={
              <Button variant="primary" size="sm" onClick={() => navigate('/account/discover')}>
                Browse creators
              </Button>
            }
          />
        ) : (
          <Stack gap={0}>
            {activeSubs.slice(0, 4).map((sub, i) => (
              <React.Fragment key={sub._id}>
                {i > 0 && <Divider />}
                <PersonRow
                  name={sub.creatorName}
                  sub={sub.plan}
                  mono={sub.creatorMono}
                  color={sub.creatorColor}
                  trailing={<Mono>${sub.creatorStartingPrice}/mo</Mono>}
                />
              </React.Fragment>
            ))}
          </Stack>
        )}
      </Card>

      {/* Recent results */}
      {recent && recent.length > 0 && (
        <Card>
          <CardHead
            title="Recent results"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/account/results')}>
                View all
                <Icon name="arrow-right" size={12} />
              </Button>
            }
          />
          <Stack gap={0}>
            {recent.slice(0, 5).map((pick, i) => (
              <React.Fragment key={pick._id}>
                {i > 0 && <Divider />}
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
              </React.Fragment>
            ))}
          </Stack>
        </Card>
      )}

      {/* Portfolio trend */}
      {portfolio && portfolio.totalPicks > 0 && (
        <Card>
          <CardHead
            title="Portfolio"
            action={
              <Badge tone={portfolio.netUnits >= 0 ? 'green' : 'red'}>
                {portfolio.netUnits > 0 ? '+' : ''}
                {portfolio.netUnits}u
              </Badge>
            }
          />
          <Row gap={4} between>
            <Stack gap={1}>
              <Eyebrow>Win rate</Eyebrow>
              <Mono>{portfolio.winRate}%</Mono>
            </Stack>
            <Stack gap={1}>
              <Eyebrow>Record</Eyebrow>
              <Mono>
                {portfolio.wins}W-{portfolio.losses}L
              </Mono>
            </Stack>
            <Sparkline values={sparkData} width={120} height={32} />
          </Row>
          <Divider />
          <Row gap={3} wrap>
            <Stat label="Total" value={String(portfolio.totalPicks)} />
            <Stat label="Wins" value={String(portfolio.wins)} tone="success" />
            <Stat label="Losses" value={String(portfolio.losses)} />
            <Stat label="Pending" value={String(portfolio.pending)} />
          </Row>
        </Card>
      )}
    </>
  );

  // ── Main content ────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title={`Welcome back, ${displayName}`}
        crumbs={[{ label: 'Account' }, { label: 'Dashboard' }]}
        actions={
          <Row gap={2}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/account/subscriptions')}
            >
              <Icon name="card" size={13} />
              Manage subs
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/account/discover')}>
              <Icon name="compass" size={13} />
              Discover creators
            </Button>
          </Row>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          {/* ── Top-level metrics ────────────────────────────────────── */}
          <MetricGrid
            items={[
              {
                id: 'winRate',
                label: 'Win rate',
                value: <Mono>{portfolio ? `${portfolio.winRate}%` : '—'}</Mono>,
                delta:
                  portfolio && portfolio.winRate >= 55
                    ? { value: 'Profitable', dir: 'up' }
                    : portfolio && portfolio.winRate > 0
                      ? { value: `${portfolio.wins}W-${portfolio.losses}L`, dir: 'flat' }
                      : undefined,
                icon: <Icon name="trophy" size={14} />,
              },
              {
                id: 'netUnits',
                label: 'Net units',
                value: (
                  <Mono>
                    {portfolio ? `${portfolio.netUnits > 0 ? '+' : ''}${portfolio.netUnits}u` : '—'}
                  </Mono>
                ),
                delta:
                  portfolio && portfolio.netUnits > 0
                    ? { value: 'Profit', dir: 'up' }
                    : portfolio && portfolio.netUnits < 0
                      ? { value: 'Loss', dir: 'down' }
                      : undefined,
                icon: <Icon name="chart" size={14} />,
              },
              {
                id: 'activeSubs',
                label: 'Active subs',
                value: <Mono>{activeSubs.length}</Mono>,
                delta: totalMonthly > 0 ? { value: `$${totalMonthly}/mo`, dir: 'flat' } : undefined,
                icon: <Icon name="users" size={14} />,
              },
              {
                id: 'streak',
                label: 'Streak',
                value: <Mono>{portfolio?.streak ?? '—'}</Mono>,
                icon: <Icon name="flame" size={14} />,
              },
            ]}
          />

          {/* ── Two-column: feed + sidebar ──────────────────────────── */}
          <DashGrid aside={aside}>
            {/* Sport filter */}
            <FilterChips
              options={SPORT_FILTERS}
              value={sport}
              onChange={setSport}
              allLabel="All sports"
            />

            {/* Discover mode hint */}
            {feed && !feed.personalized && (
              <Card>
                <Row gap={3} between>
                  <Row gap={2}>
                    <Badge tone="blue" dot>
                      Discover mode
                    </Badge>
                    <Muted>Showing picks across the network — subscribe to personalize.</Muted>
                  </Row>
                  <Button variant="outline" size="sm" onClick={() => navigate('/account/discover')}>
                    Browse creators
                  </Button>
                </Row>
              </Card>
            )}

            {/* Loading */}
            {isLoading && <EmptyState icon="feed" title="Loading your feed…" />}

            {/* Empty */}
            {isEmpty && (
              <EmptyState
                icon="feed"
                title="No picks yet."
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

            {/* Pick cards */}
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
