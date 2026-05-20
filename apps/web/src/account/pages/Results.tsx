import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Card,
  Button,
  Badge,
  PersonRow,
  EmptyState,
  Divider,
  Muted,
  StudioPageHeader,
  StudioDashLayout,
  StudioDashCol,
  AccountRefineCard,
  StudioFilterPills,
  Grid,
  AccountStatCard,
  AccountSidebarPanel,
  RowList,
  NextStepsPanel,
  QuickActionGrid,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { accountCrossLinks } from '../../lib/accountCrossLinks';

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

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Wins', value: 'wins' },
  { label: 'Losses', value: 'losses' },
  { label: 'Pending', value: 'pending' },
];

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

  const filterOptions = React.useMemo(
    () =>
      FILTER_OPTIONS.map((opt) => {
        const count = counts[opt.value as keyof typeof counts];
        return { ...opt, label: `${opt.label} ${count}` };
      }),
    [counts],
  );

  const bestCreator = portfolio?.byCreator?.[0];

  const aside = (
    <Stack gap={4}>
      {portfolio && portfolio.byCreator.length > 0 ? (
        <AccountSidebarPanel title="By creator">
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
        </AccountSidebarPanel>
      ) : null}

      {portfolio && portfolio.bySport.length > 0 ? (
        <AccountSidebarPanel title="By sport">
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
        </AccountSidebarPanel>
      ) : null}

      {bestCreator ? (
        <AccountSidebarPanel title="Top performer" variant="accent">
          <Stack gap={3}>
            <PersonRow
              name={bestCreator.creatorName}
              sub={`${bestCreator.wins}W-${bestCreator.losses}L · ${bestCreator.winRate}% win rate`}
              mono={bestCreator.creatorMono}
              color={bestCreator.creatorColor}
              trailing={
                <Badge tone="green">
                  {bestCreator.netUnits > 0 ? '+' : ''}
                  {bestCreator.netUnits}u
                </Badge>
              }
            />
            <Button
              variant="outline"
              size="sm"
              iconRight="arrow-right"
              onClick={() => navigate(`/creators/${bestCreator.creatorHandle}`)}
            >
              View profile
            </Button>
          </Stack>
        </AccountSidebarPanel>
      ) : null}

      <NextStepsPanel
        title="Improve your edge"
        sub="Diversify across creators and sports to smooth variance."
        items={[
          {
            id: 'discover',
            label: 'Discover new creators',
            onClick: () => navigate('/account/discover'),
          },
          {
            id: 'saved',
            label: 'Review saved picks',
            onClick: () => navigate('/account/saved'),
          },
          {
            id: 'events',
            label: "Check tonight's slate",
            onClick: () => navigate('/account/events'),
          },
        ]}
      />
    </Stack>
  );

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Account · Track"
          title="My Results"
          sub={
            hasData
              ? 'Win rate, units, and streak across every graded play you have followed.'
              : 'Once your subscribed creators grade picks you have followed, your performance shows up here.'
          }
          actions={
            <>
              <Button
                variant="outline"
                iconLeft="bookmark"
                onClick={() => navigate('/account/saved')}
              >
                Saved
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

        {isLoading ? <EmptyState icon="chart" title="Loading results…" /> : null}

        {!isLoading && !hasData ? (
          <EmptyState
            icon="chart"
            title="No picks tracked yet"
            subtitle="Subscribe to creators and their graded picks will build your portfolio."
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

        {hasData && portfolio ? (
          <>
            <Grid cols={4} gap={5} stagger={false}>
              <AccountStatCard
                icon="chart"
                value={`${portfolio.winRate}%`}
                label={`Win rate · ${winRateLabel(portfolio.winRate)}`}
              />
              <AccountStatCard
                icon="dollar"
                iconTone={portfolio.netUnits >= 0 ? 'primary' : 'danger'}
                value={`${portfolio.netUnits > 0 ? '+' : ''}${portfolio.netUnits}u`}
                label="Net units"
              />
              <AccountStatCard
                icon="feed"
                value={`${portfolio.wins}W-${portfolio.losses}L`}
                label={`Record · ${portfolio.pending} pending`}
              />
              <AccountStatCard
                icon="flame"
                iconTone={portfolio.streak.startsWith('L') ? 'danger' : 'primary'}
                value={portfolio.streak}
                label={
                  portfolio.streak.startsWith('W')
                    ? 'Streak · hot'
                    : portfolio.streak.startsWith('L')
                      ? 'Streak · cold'
                      : 'Streak'
                }
              />
            </Grid>

            <AccountRefineCard
              sub="Filter graded plays by outcome."
              summary={`${filteredResults.length} of ${counts.all} plays in view`}
              onReset={tab !== 'all' ? () => setTab('all') : undefined}
              resetLabel="Show all plays"
            >
              <StudioFilterPills
                options={filterOptions}
                value={tab}
                onChange={(v) => setTab(v as ResultTab)}
                ariaLabel="Filter by result"
                nowrap
              />
            </AccountRefineCard>

            <StudioDashLayout>
              <StudioDashCol span={8}>
                <Stack gap={4}>
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
                    {filteredResults.length > 0 && filteredResults.length < counts.all ? (
                      <>
                        <Divider />
                        <Muted>{`Showing ${filteredResults.length} of ${counts.all} plays`}</Muted>
                      </>
                    ) : null}
                  </Card>
                </Stack>
              </StudioDashCol>

              <StudioDashCol span={4}>{aside}</StudioDashCol>
            </StudioDashLayout>
          </>
        ) : null}

        <QuickActionGrid title="Related" items={accountCrossLinks('results', navigate)} />
      </Stack>
    </Container>
  );
}
