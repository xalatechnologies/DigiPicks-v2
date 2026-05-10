import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Card,
  Button,
  Badge,
  Muted,
  PersonRow,
  EmptyState,
  Divider,
  DashGrid,
  Tabs,
  PortfolioHero,
  StatTile,
  SectionHead,
  InsightCard,
  RowList,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function gradeColor(grade?: string): 'green' | 'red' | 'mute' | 'gold' {
  if (grade === 'win') return 'green';
  if (grade === 'loss') return 'red';
  if (grade === 'push') return 'gold';
  return 'mute';
}

function gradeLabel(grade?: string): string {
  if (grade === 'win') return 'Win';
  if (grade === 'loss') return 'Loss';
  if (grade === 'push') return 'Push';
  return 'Pending';
}

function winRateLabel(rate: number): string {
  if (rate >= 60) return 'On fire';
  if (rate >= 55) return 'Profitable';
  if (rate >= 50) return 'Break-even';
  if (rate > 0) return 'Below .500';
  return 'No data';
}

type ResultTab = 'all' | 'wins' | 'losses' | 'pending';

export function Results() {
  const navigate = useNavigate();
  const portfolio = useQuery(api.subscriberStats.myPortfolio);
  const recent = useQuery(api.subscriberStats.recentResults);
  const [tab, setTab] = React.useState<ResultTab>('all');

  const isLoading = portfolio === undefined;
  const hasData = Boolean(portfolio && portfolio.totalPicks > 0);

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

  const sparkData = React.useMemo(() => {
    if (!recent || recent.length === 0) return [0, 0];
    let running = 0;
    return [...recent].reverse().map((p) => {
      if (p.grade === 'win') running += parseFloat(p.netUnits ?? p.units ?? '1');
      else if (p.grade === 'loss') running -= parseFloat(p.units ?? '1');
      return Math.round(running * 10) / 10;
    });
  }, [recent]);

  const bestCreator = portfolio?.byCreator?.[0];

  const aside = (
    <>
      {portfolio && portfolio.byCreator.length > 0 && (
        <InsightCard
          tone="green"
          eyebrow="Performance breakdown"
          title="By creator"
          action={<Badge tone="green">{portfolio.byCreator.length}</Badge>}
        >
          <RowList
            items={portfolio.byCreator}
            getKey={(c) => c.creatorId}
            renderItem={(c) => (
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
            )}
          />
        </InsightCard>
      )}

      {portfolio && portfolio.bySport.length > 0 && (
        <InsightCard
          tone="blue"
          eyebrow="Performance breakdown"
          title="By sport"
          action={<Badge tone="blue">{portfolio.bySport.length}</Badge>}
        >
          <RowList
            items={portfolio.bySport}
            getKey={(sp) => sp.sport}
            renderItem={(sp) => (
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
            )}
          />
        </InsightCard>
      )}

      {bestCreator && (
        <InsightCard
          tone="gold"
          eyebrow="Top performer"
          title={bestCreator.creatorName}
          sub={`${bestCreator.wins}W-${bestCreator.losses}L · ${bestCreator.winRate}% win rate`}
          action={
            <Badge tone="green">
              {bestCreator.netUnits > 0 ? '+' : ''}
              {bestCreator.netUnits}u
            </Badge>
          }
        >
          <Button
            variant="outline"
            size="sm"
            iconRight="arrow-right"
            onClick={() => navigate(`/creators/${bestCreator.creatorHandle}`)}
          >
            View profile
          </Button>
        </InsightCard>
      )}

      <InsightCard
        tone="amber"
        eyebrow="Tip"
        title="Improve your edge"
        sub="Diversify across creators and sports to reduce variance and smooth your equity curve."
      >
        <Button
          variant="outline"
          size="sm"
          iconRight="arrow-right"
          onClick={() => navigate('/account/discover')}
        >
          Find creators
        </Button>
      </InsightCard>
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
              Saved
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconRight="arrow-right"
              onClick={() => navigate('/account')}
            >
              Dashboard
            </Button>
          </Row>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PortfolioHero
            eyebrow="My results"
            title={hasData ? 'Track your edge over time' : 'Your results page'}
            sub={
              hasData
                ? 'Win rate, units, and streak across every graded play you’ve followed.'
                : 'Once your subscribed creators grade picks you’ve followed, your performance shows up here.'
            }
            empty={!hasData}
            emptyTitle="No picks tracked yet"
            emptySub="Subscribe to creators and their graded picks will build your portfolio."
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
            winRate={hasData ? portfolio!.winRate : undefined}
            winRateLabel={hasData ? winRateLabel(portfolio!.winRate) : undefined}
            kpis={
              hasData
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
                      label: 'Streak',
                      value: portfolio!.streak,
                      tone: portfolio!.streak.startsWith('W')
                        ? 'gold'
                        : portfolio!.streak.startsWith('L')
                          ? 'red'
                          : 'neutral',
                    },
                    {
                      label: 'Pending',
                      value: String(portfolio!.pending),
                      tone: 'neutral',
                    },
                  ]
                : []
            }
            spark={hasData ? sparkData : undefined}
          />

          {isLoading && <EmptyState icon="chart" title="Loading results…" />}

          {hasData && (
            <>
              <Row gap={4} wrap>
                <StatTile
                  label="Win rate"
                  tone={
                    portfolio!.winRate >= 55 ? 'green' : portfolio!.winRate >= 50 ? 'blue' : 'red'
                  }
                  value={`${portfolio!.winRate}%`}
                  sub={winRateLabel(portfolio!.winRate)}
                  trend={
                    portfolio!.winRate >= 55
                      ? { value: 'Profitable', dir: 'up' }
                      : portfolio!.winRate >= 50
                        ? { value: 'Break-even', dir: 'flat' }
                        : { value: 'Below .500', dir: 'down' }
                  }
                />
                <StatTile
                  label="Net units"
                  tone={portfolio!.netUnits >= 0 ? 'green' : 'red'}
                  value={`${portfolio!.netUnits > 0 ? '+' : ''}${portfolio!.netUnits}u`}
                  sub={
                    portfolio!.netUnits >= 0 ? 'Profit on followed plays' : 'Loss on followed plays'
                  }
                  trend={
                    portfolio!.netUnits >= 0
                      ? { value: 'Profit', dir: 'up' }
                      : { value: 'Loss', dir: 'down' }
                  }
                />
                <StatTile
                  label="Record"
                  tone="neutral"
                  value={`${portfolio!.wins}W-${portfolio!.losses}L`}
                  sub={`${portfolio!.pending} pending`}
                />
                <StatTile
                  label="Streak"
                  tone={
                    portfolio!.streak.startsWith('W')
                      ? 'gold'
                      : portfolio!.streak.startsWith('L')
                        ? 'red'
                        : 'neutral'
                  }
                  value={portfolio!.streak}
                  sub={
                    portfolio!.streak.startsWith('W')
                      ? 'Hot stretch — stay disciplined.'
                      : portfolio!.streak.startsWith('L')
                        ? 'Cold stretch — review process.'
                        : 'No active streak.'
                  }
                />
              </Row>

              <SectionHead
                eyebrow="Recent plays"
                title="Activity"
                sub={`${recent?.length ?? 0} plays tracked`}
                action={
                  <Tabs
                    value={tab}
                    onChange={(v) => setTab(v as ResultTab)}
                    tabs={[
                      { value: 'all', label: `All ${counts.all}` },
                      { value: 'wins', label: `Wins ${counts.wins}` },
                      { value: 'losses', label: `Losses ${counts.losses}` },
                      { value: 'pending', label: `Pending ${counts.pending}` },
                    ]}
                    ariaLabel="Filter by result"
                  />
                }
              />

              <DashGrid aside={aside}>
                <Card pad="md">
                  {filteredResults.length === 0 ? (
                    <EmptyState icon="feed" title="No picks match this filter." />
                  ) : (
                    <RowList
                      items={filteredResults}
                      getKey={(pick) => pick._id}
                      renderItem={(pick) => (
                        <PersonRow
                          name={pick.title}
                          sub={`${pick.creatorName} · ${pick.sport} · ${fmtDate(pick.publishedAt ?? pick.createdAt)}`}
                          mono={pick.creatorMono}
                          color={pick.creatorColor}
                          trailing={
                            <Row gap={2}>
                              <Badge tone="mute">{pick.odds}</Badge>
                              <Badge tone={gradeColor(pick.grade)} dot>
                                {gradeLabel(pick.grade)}
                              </Badge>
                            </Row>
                          }
                        />
                      )}
                    />
                  )}
                  {filteredResults.length > 0 && filteredResults.length < counts.all && (
                    <>
                      <Divider />
                      <Muted>{`Showing ${filteredResults.length} of ${counts.all} plays`}</Muted>
                    </>
                  )}
                </Card>
              </DashGrid>
            </>
          )}
        </Stack>
      </Container>
    </>
  );
}
