import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Col,
  Card,
  CardHead,
  Button,
  PageHead,
  Badge,
  Muted,
  Mono,
  Metric,
  PersonRow,
  EmptyState,
  Divider,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

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

function gradeColor(grade?: string): 'green' | 'red' | 'mute' | 'gold' {
  if (grade === 'win') return 'green';
  if (grade === 'loss') return 'red';
  if (grade === 'push') return 'gold';
  return 'mute';
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

  return (
    <>
      <PageHeader
        title="My Results"
        crumbs={[{ label: 'Account' }, { label: 'Results' }]}
        actions={
          <Row gap={2}>
            <Button variant="secondary" size="sm" iconLeft="feed" onClick={() => navigate('/account/feed')}>
              Open feed
            </Button>
          </Row>
        }
      />

      <Container size="xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Portfolio"
            title="Your portfolio"
            sub="Performance across every play from your subscribed creators."
          />

          {isLoading && (
            <EmptyState icon="chart" title="Loading your results…" />
          )}

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
              <Row gap={3} wrap>
                <Metric label="Win rate" value={`${portfolio.winRate}%`} />
                <Metric
                  label="Net units"
                  value={`${portfolio.netUnits > 0 ? '+' : ''}${portfolio.netUnits}u`}
                  delta={portfolio.netUnits >= 0 ? { value: 'Profit', dir: 'up' as const } : { value: 'Loss', dir: 'down' as const }}
                />
                <Metric label="Followed plays" value={String(portfolio.totalPicks)} />
                <Metric label="Wins · Losses" value={`${portfolio.wins} · ${portfolio.losses}`} />
                <Metric label="Streak" value={portfolio.streak} />
              </Row>

              <Row gap={4} wrap>
                <Col gap={4}>
                  {portfolio.byCreator.length > 0 && (
                    <Card>
                      <CardHead title="By creator" sub="Performance per creator" />
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
                                <Mono>
                                  {c.netUnits > 0 ? '+' : ''}{c.netUnits}u
                                </Mono>
                              }
                            />
                          </React.Fragment>
                        ))}
                      </Stack>
                    </Card>
                  )}
                </Col>

                <Col gap={4}>
                  {portfolio.bySport.length > 0 && (
                    <Card>
                      <CardHead title="By sport" sub="Performance per sport" />
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
                                <Mono>
                                  {sp.netUnits > 0 ? '+' : ''}{sp.netUnits}u
                                </Mono>
                              }
                            />
                          </React.Fragment>
                        ))}
                      </Stack>
                    </Card>
                  )}
                </Col>
              </Row>
            </>
          )}

          {recent && recent.length > 0 && (
            <Card>
              <CardHead
                title="Recent plays"
                action={
                  <Row gap={1}>
                    {(['all', 'wins', 'losses', 'pending'] as const).map((t) => (
                      <Button
                        key={t}
                        variant={tab === t ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setTab(t)}
                      >
                        {t === 'all' ? 'All' : t === 'wins' ? 'Wins' : t === 'losses' ? 'Losses' : 'Pending'}
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
                      sub={`${pick.creatorName} · ${pick.sport} · ${pick.publishedAt ? timeAgo(pick.publishedAt) : timeAgo(pick.createdAt)}`}
                      mono={pick.creatorMono}
                      color={pick.creatorColor}
                      trailing={
                        <Row gap={2}>
                          <Mono>{pick.odds}</Mono>
                          <Mono>{pick.units}</Mono>
                          <Badge tone={gradeColor(pick.grade)}>
                            {pick.grade ?? 'pending'}
                          </Badge>
                        </Row>
                      }
                    />
                  </React.Fragment>
                ))}
                {filteredResults.length === 0 && (
                  <Muted>No picks match this filter.</Muted>
                )}
              </Stack>
            </Card>
          )}
        </Stack>
      </Container>
    </>
  );
}
