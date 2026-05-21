import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Stack,
  Row,
  StudioPageHeader,
  Button,
  Card,
  CardHead,
  Mono,
  Badge,
  EmptyState,
  StudioSummaryGrid,
  StudioSubNav,
  StudioFilterBar,
  StudioMetaChip,
  StudioChartCard,
  StudioAreaChart,
  TitleSub,
} from '@digipicks/ds';
import { useStudioContext } from '../useStudioContext';
import { chartHighlightForPeriod } from '../studioMetrics';
import { STUDIO } from '../../lib/studioRoutes';
import { MARKET_PERF } from '../data/studio';

const RANGE_OPTIONS = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'YTD', value: 'ytd' },
];

const VIEW_TABS = [
  { label: 'By market', value: 'markets' },
  { label: 'Discipline', value: 'discipline' },
];

interface MarketPerfRow {
  market: string;
  picks: number;
  wins: number;
  winRate: number;
  units: string;
}

function computeMarketPerf(
  picks: Array<{ market: string; grade?: string | null; netUnits?: string }>,
): MarketPerfRow[] {
  const map = new Map<string, { picks: number; wins: number; net: number }>();
  for (const p of picks) {
    if (!p.grade || p.grade === 'pending') continue;
    const entry = map.get(p.market) ?? { picks: 0, wins: 0, net: 0 };
    entry.picks++;
    if (p.grade === 'win') entry.wins++;
    if (p.netUnits) entry.net += parseFloat(p.netUnits) || 0;
    map.set(p.market, entry);
  }
  return Array.from(map.entries())
    .map(([market, { picks, wins, net }]) => ({
      market,
      picks,
      wins,
      winRate: picks > 0 ? wins / picks : 0,
      units: net >= 0 ? `+${net.toFixed(1)}u` : `${net.toFixed(1)}u`,
    }))
    .sort((a, b) => b.picks - a.picks);
}

function matchesMarketSearch(row: MarketPerfRow, query: string): boolean {
  if (!query.trim()) return true;
  return row.market.toLowerCase().includes(query.toLowerCase());
}

export function Performance() {
  const navigate = useNavigate();
  const ctx = useStudioContext();
  const [range, setRange] = useState('30d');
  const [view, setView] = useState('markets');
  const [search, setSearch] = useState('');

  const marketPerf = useMemo(() => {
    const computed = computeMarketPerf(ctx.picks);
    if (computed.length > 0) return computed;
    if (ctx.devPreview) {
      return MARKET_PERF.map((m) => ({
        market: m.market,
        picks: m.picks,
        wins: Math.round(m.picks * m.winRate),
        winRate: m.winRate,
        units: m.units,
      }));
    }
    return [];
  }, [ctx.picks, ctx.devPreview]);

  const filteredMarkets = useMemo(
    () => marketPerf.filter((m) => matchesMarketSearch(m, search)),
    [marketPerf, search],
  );

  const graded = useMemo(
    () => ctx.picks.filter((p) => p.grade && p.grade !== 'pending').length,
    [ctx.picks],
  );

  const gradedDisplay = graded > 0 ? graded.toLocaleString() : ctx.devPreview ? '156' : '0';

  const winRateLabel = ctx.creator
    ? `${(ctx.creator.winRate * 100).toFixed(1)}%`
    : ctx.devPreview
      ? '58.2%'
      : '—';

  const chartHighlight = chartHighlightForPeriod(range);
  const loading = ctx.picksLoading && !ctx.devPreview;

  const rangeLabel =
    range === '7d'
      ? 'Last 7 days'
      : range === '90d'
        ? 'Last 90 days'
        : range === 'ytd'
          ? 'Year to date'
          : 'Last 30 days';

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Analytics"
          title="Analytics"
          sub="Win rate, ROI, and unit results — sliced by market and rolling window."
          actions={
            <Button variant="primary" iconLeft="feed" onClick={() => navigate(STUDIO.picks)}>
              View picks
            </Button>
          }
        />

        <StudioSubNav items={VIEW_TABS} value={view} onChange={setView} />

        <StudioSummaryGrid
          items={[
            {
              id: 'win',
              icon: 'chart',
              iconTone: 'primary',
              label: 'Win rate',
              value: winRateLabel,
              delta: ctx.devPreview
                ? { value: '+3.1%', dir: 'up' as const }
                : { value: rangeLabel, dir: 'flat' as const },
              active: view === 'markets',
              onClick: () => setView('markets'),
            },
            {
              id: 'record',
              icon: 'trophy',
              iconTone: 'violet',
              label: 'Record',
              value: ctx.record,
              onClick: () => navigate(STUDIO.picks),
            },
            {
              id: 'units',
              icon: 'flame',
              iconTone: 'amber',
              label: 'Units',
              value: ctx.units,
              delta: { value: rangeLabel, dir: 'up' as const },
              active: view === 'discipline',
              onClick: () => setView('discipline'),
            },
            {
              id: 'graded',
              icon: 'feed',
              iconTone: 'danger',
              label: 'Graded picks',
              value: gradedDisplay,
              delta: { value: `${marketPerf.length} markets`, dir: 'flat' as const },
              onClick: () => navigate(STUDIO.picks),
            },
          ]}
        />

        <StudioFilterBar
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
          ariaLabel="Analytics date range"
          search={{
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: 'Search markets…',
            'aria-label': 'Search markets',
          }}
          trailing={<StudioMetaChip icon="calendar" label={rangeLabel} />}
        />

        {view === 'markets' ? (
          <>
            <StudioChartCard
              title="Performance trend"
              sub={`Unit results · ${rangeLabel.toLowerCase()}`}
              periodOptions={RANGE_OPTIONS}
              period={range}
              onPeriodChange={setRange}
            >
              <StudioAreaChart
                highlightLabel={chartHighlight.label}
                highlightValue={chartHighlight.value}
              />
            </StudioChartCard>

            <Card pad="lg" elev>
              <CardHead
                title="By market"
                sub="Performance breakdown across the markets you publish in"
                action={
                  ctx.creator?.streak ? (
                    <Badge tone="gold" dot>
                      {ctx.creator.streak}
                    </Badge>
                  ) : null
                }
              />
              {loading ? (
                <EmptyState icon="chart" title="Loading analytics…" />
              ) : filteredMarkets.length === 0 ? (
                <EmptyState
                  icon="chart"
                  title={search ? 'No markets match your search' : 'No graded picks yet'}
                  subtitle={
                    search
                      ? 'Try a different query or clear filters.'
                      : 'Publish and grade picks to see market breakdowns.'
                  }
                  action={
                    search ? (
                      <Button variant="secondary" onClick={() => setSearch('')}>
                        Clear search
                      </Button>
                    ) : (
                      <Button variant="primary" onClick={() => navigate(STUDIO.createPick)}>
                        Create pick
                      </Button>
                    )
                  }
                />
              ) : (
                <Stack gap={4}>
                  {filteredMarkets.map((m) => (
                    <Row key={m.market} gap={4} between wrap>
                      <TitleSub
                        title={m.market}
                        sub={`${m.picks} picks · ${(m.winRate * 100).toFixed(1)}% win`}
                      />
                      <Mono>{m.units}</Mono>
                    </Row>
                  ))}
                </Stack>
              )}
            </Card>
          </>
        ) : null}

        {view === 'discipline' ? (
          <Card pad="lg" elev>
            <CardHead title="Discipline" sub="Risk hygiene tied to your pick history" />
            <Stack gap={6}>
              <Row gap={6} wrap>
                <Stack gap={1}>
                  <TitleSub title="Total picks" sub="Published and graded" />
                  <Mono>{ctx.picks.length > 0 ? ctx.picks.length : ctx.devPreview ? 156 : 0}</Mono>
                </Stack>
                <Stack gap={1}>
                  <TitleSub title="Markets tracked" sub="With graded results" />
                  <Mono>{marketPerf.length}</Mono>
                </Stack>
                <Stack gap={1}>
                  <TitleSub title="Last 10" sub="Recent graded slate" />
                  <Mono>{ctx.creator?.last10 ?? (ctx.devPreview ? '7-3' : '—')}</Mono>
                </Stack>
              </Row>
              <Button variant="outline" onClick={() => navigate(STUDIO.picks)}>
                Open picks table
              </Button>
            </Stack>
          </Card>
        ) : null}
      </Stack>
    </Container>
  );
}
