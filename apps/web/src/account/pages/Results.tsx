import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  Badge,
  Muted,
  Mono,
  Stat,
  PersonRow,
  EmptyState,
  Divider,
  DashGrid,
  MetricGrid,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function gradeColor(grade?: string): 'green' | 'red' | 'mute' | 'gold' {
  if (grade === 'win') return 'green';
  if (grade === 'loss') return 'red';
  if (grade === 'push') return 'gold';
  return 'mute';
}

function gradeBadgeLabel(grade?: string): string {
  if (grade === 'win') return 'Win';
  if (grade === 'loss') return 'Loss';
  if (grade === 'push') return 'Push';
  return 'Pending';
}

export function Results() {
  const navigate = useNavigate();
  const portfolio = useQuery(api.subscriberStats.myPortfolio);
  const recent = useQuery(api.subscriberStats.recentResults);

  const [tab, setTab] = React.useState<'all' | 'wins' | 'losses' | 'pending'>('all');

  const isLoading = portfolio === undefined;

  const filteredResults = React.useMemo(() => {
    if (!recent) return [];
    if (tab === 'all') return recent;
    if (tab === 'wins') return recent.filter((p) => p.grade === 'win');
    if (tab === 'losses') return recent.filter((p) => p.grade === 'loss');
    return recent.filter((p) => p.grade === 'pending' || !p.grade);
  }, [recent, tab]);

  const counts = React.useMemo(() => {
    if (!recent) return { all: 0, wins: 0, losses: 0, pending: 0 };
    return {
      all: recent.length,
      wins: recent.filter((p) => p.grade === 'win').length,
      losses: recent.filter((p) => p.grade === 'loss').length,
      pending: recent.filter((p) => !p.grade || p.grade === 'pending').length,
    };
  }, [recent]);

  const bestCreator = portfolio?.byCreator?.[0];

  // ── Sidebar content ──────────────────────────────────────────────────
  const aside = (
    <>
      {/* By creator */}
      {portfolio && portfolio.byCreator.length > 0 && (
        <Card>
          <CardHead
            title="By creator"
            action={
              <Badge tone="blue">
                {portfolio.byCreator.length} creator{portfolio.byCreator.length !== 1 ? 's' : ''}
              </Badge>
            }
          />
          <Stack gap={0}>
            {portfolio.byCreator.map((c, i) => (
              <React.Fragment key={c.creatorId}>
                {i > 0 && <Divider />}
                <PersonRow
                  name={c.creatorName}
                  sub={`${c.wins}W-${c.losses}L · ${c.winRate}%`}
                  mono={c.creatorMono}
                  color={c.creatorColor}
                  trailing={
                    <Badge tone={c.netUnits >= 0 ? 'green' : 'red'}>
                      {c.netUnits > 0 ? '+' : ''}
                      {c.netUnits}u
                    </Badge>
                  }
                />
              </React.Fragment>
            ))}
          </Stack>
        </Card>
      )}

      {/* By sport */}
      {portfolio && portfolio.bySport.length > 0 && (
        <Card>
          <CardHead
            title="By sport"
            action={
              <Badge tone="blue">
                {portfolio.bySport.length} sport{portfolio.bySport.length !== 1 ? 's' : ''}
              </Badge>
            }
          />
          <Stack gap={0}>
            {portfolio.bySport.map((sp, i) => (
              <React.Fragment key={sp.sport}>
                {i > 0 && <Divider />}
                <PersonRow
                  name={sp.sport}
                  sub={`${sp.wins}W-${sp.losses}L · ${sp.winRate}%`}
                  mono={sp.sport[0] ?? 'S'}
                  color="var(--primary)"
                  trailing={
                    <Badge tone={sp.netUnits >= 0 ? 'green' : 'red'}>
                      {sp.netUnits > 0 ? '+' : ''}
                      {sp.netUnits}u
                    </Badge>
                  }
                />
              </React.Fragment>
            ))}
          </Stack>
        </Card>
      )}

      {/* Best performer spotlight */}
      {bestCreator && (
        <Card>
          <CardHead title="Best performer" />
          <Stack gap={3}>
            <PersonRow
              name={bestCreator.creatorName}
              sub={`${bestCreator.wins}W-${bestCreator.losses}L`}
              mono={bestCreator.creatorMono}
              color={bestCreator.creatorColor}
              trailing={
                <Badge tone="green">
                  {bestCreator.netUnits > 0 ? '+' : ''}
                  {bestCreator.netUnits}u
                </Badge>
              }
            />
            <Divider />
            <Row gap={3} wrap>
              <Stat label="Win rate" value={`${bestCreator.winRate}%`} />
              <Stat
                label="Net units"
                value={`${bestCreator.netUnits > 0 ? '+' : ''}${bestCreator.netUnits}u`}
              />
              <Stat label="Record" value={`${bestCreator.wins}-${bestCreator.losses}`} />
            </Row>
            <Button
              variant="outline"
              size="sm"
              iconRight="arrow-right"
              onClick={() => navigate(`/creators/${bestCreator.creatorHandle}`)}
            >
              View profile
            </Button>
          </Stack>
        </Card>
      )}

      {/* Suggested action */}
      <Card>
        <CardHead title="Improve your edge" />
        <Stack gap={2}>
          <Muted>
            Diversify across creators and sports to reduce variance. Track results weekly to
            identify which creators fit your style.
          </Muted>
          <Row gap={2}>
            <Button
              variant="outline"
              size="sm"
              iconRight="arrow-right"
              onClick={() => navigate('/account/discover')}
            >
              Find creators
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/account/subscriptions')}>
              Manage subs
            </Button>
          </Row>
        </Stack>
      </Card>
    </>
  );

  return (
    <>
      <PageHeader
        title="My Results"
        crumbs={[{ label: 'Account' }, { label: 'Results' }]}
        actions={
          <Row gap={2}>
            <Button
              variant="outline"
              size="sm"
              iconLeft="bookmark"
              onClick={() => navigate('/account/saved')}
            >
              Saved picks
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/account')}>
              Dashboard
            </Button>
          </Row>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          {isLoading && <EmptyState icon="chart" title="Loading your results…" />}

          {portfolio && portfolio.totalPicks === 0 && (
            <EmptyState
              icon="chart"
              title="No picks tracked yet."
              subtitle="Subscribe to creators and their graded picks will build your portfolio here."
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

          {portfolio && portfolio.totalPicks > 0 && (
            <>
              {/* ── Portfolio metrics ──────────────────────────────────── */}
              <MetricGrid
                items={[
                  {
                    id: 'winRate',
                    label: 'Win rate',
                    value: <Mono>{portfolio.winRate}%</Mono>,
                    delta:
                      portfolio.winRate >= 55
                        ? { value: 'Profitable', dir: 'up' }
                        : portfolio.winRate >= 50
                          ? { value: 'Break-even', dir: 'flat' }
                          : { value: 'Below .500', dir: 'down' },
                    icon: <Icon name="chart" size={14} />,
                  },
                  {
                    id: 'netUnits',
                    label: 'Net units',
                    value: (
                      <Mono>
                        {portfolio.netUnits > 0 ? '+' : ''}
                        {portfolio.netUnits}u
                      </Mono>
                    ),
                    delta:
                      portfolio.netUnits >= 0
                        ? { value: 'Profit', dir: 'up' }
                        : { value: 'Loss', dir: 'down' },
                    icon: <Icon name="dollar" size={14} />,
                  },
                  {
                    id: 'record',
                    label: 'Record',
                    value: (
                      <Mono>
                        {portfolio.wins}W-{portfolio.losses}L
                      </Mono>
                    ),
                    delta: {
                      value: `${portfolio.pushes} push · ${portfolio.pending} pending`,
                      dir: 'flat',
                    },
                    icon: <Icon name="trophy" size={14} />,
                  },
                  {
                    id: 'streak',
                    label: 'Streak',
                    value: <Mono>{portfolio.streak}</Mono>,
                    delta: portfolio.streak.startsWith('W')
                      ? { value: 'Hot', dir: 'up' }
                      : portfolio.streak.startsWith('L')
                        ? { value: 'Cold', dir: 'down' }
                        : undefined,
                    icon: <Icon name="flame" size={14} />,
                  },
                ]}
              />

              {/* ── Two-column: plays + breakdowns ────────────────────── */}
              <DashGrid aside={aside}>
                {/* Recent plays table */}
                <Card>
                  <CardHead
                    title="Recent plays"
                    sub={`${recent?.length ?? 0} plays from subscribed creators`}
                    action={
                      <Row gap={1}>
                        {(['all', 'wins', 'losses', 'pending'] as const).map((t) => (
                          <Button
                            key={t}
                            variant={tab === t ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setTab(t)}
                          >
                            {t === 'all'
                              ? `All (${counts.all})`
                              : t === 'wins'
                                ? `Wins (${counts.wins})`
                                : t === 'losses'
                                  ? `Losses (${counts.losses})`
                                  : `Pending (${counts.pending})`}
                          </Button>
                        ))}
                      </Row>
                    }
                  />
                  <Stack gap={0}>
                    {filteredResults.map((pick, i) => (
                      <React.Fragment key={pick._id}>
                        {i > 0 && <Divider />}
                        <PersonRow
                          name={pick.title}
                          sub={`${pick.creatorName} · ${pick.sport} · ${pick.market} · ${pick.publishedAt ? fmtDate(pick.publishedAt) : fmtDate(pick.createdAt)}`}
                          mono={pick.creatorMono}
                          color={pick.creatorColor}
                          trailing={
                            <Row gap={2}>
                              <Mono>{pick.odds}</Mono>
                              <Mono>{pick.units}</Mono>
                              <Badge tone={gradeColor(pick.grade)} dot>
                                {gradeBadgeLabel(pick.grade)}
                              </Badge>
                            </Row>
                          }
                        />
                      </React.Fragment>
                    ))}
                    {filteredResults.length === 0 && (
                      <EmptyState
                        icon="feed"
                        title="No picks match this filter."
                        subtitle="Try a different tab."
                      />
                    )}
                  </Stack>
                </Card>
              </DashGrid>
            </>
          )}
        </Stack>
      </Container>
    </>
  );
}
