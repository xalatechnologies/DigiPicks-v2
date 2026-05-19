import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Heading,
  Eyebrow,
  Muted,
  Button,
  Card,
  CardHead,
  Mono,
  Badge,
  EmptyState,
  StudioSummaryGrid,
  StudioFilterPills,
  QuickActionGrid,
  TitleSub,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { hasDevStudioPreview } from '../../lib/devDemoLogin';
import { studioCrossLinks } from '../../lib/studioCrossLinks';
import { STUDIO } from '../../lib/studioRoutes';
import { MARKET_PERF } from '../data/studio';

const RANGE_OPTIONS = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'YTD', value: 'ytd' },
];

interface MarketPerf {
  market: string;
  picks: number;
  wins: number;
  winRate: number;
  units: string;
}

function computeMarketPerf(
  picks: Array<{ market: string; grade?: string; netUnits?: string }>,
): MarketPerf[] {
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

export function Performance() {
  const navigate = useNavigate();
  const [range, setRange] = useState('30d');
  const devPreview = hasDevStudioPreview();

  const me = useQuery(api.users.meSafe);
  const creator = useQuery(api.creators.get, me?.creatorId ? { id: me.creatorId } : 'skip');
  const picks = useQuery(
    api.picks.byCreator,
    creator?._id ? { creatorId: creator._id, limit: 500 } : 'skip',
  );

  const marketPerf = useMemo(() => {
    const computed = computeMarketPerf(picks ?? []);
    if (computed.length > 0) return computed;
    if (devPreview) {
      return MARKET_PERF.map((m) => ({
        market: m.market,
        picks: m.picks,
        wins: Math.round(m.picks * m.winRate),
        winRate: m.winRate,
        units: m.units,
      }));
    }
    return [];
  }, [picks, devPreview]);

  const winRateLabel = creator
    ? `${(creator.winRate * 100).toFixed(1)}%`
    : devPreview
      ? '58.2%'
      : '—';

  const graded = (picks ?? []).filter((p) => p.grade && p.grade !== 'pending').length;

  return (
    <Container size="2xl">
      <Stack gap={8}>
        <Row between wrap>
          <Stack gap={2}>
            <Eyebrow>Studio · Analytics</Eyebrow>
            <Heading level={1} size="2xl">
              Analytics
            </Heading>
            <Muted>Win rate, ROI, and unit results — sliced by market and rolling window.</Muted>
          </Stack>
          <Row gap={2} wrap>
            <StudioFilterPills options={RANGE_OPTIONS} value={range} onChange={setRange} />
            <Button variant="outline" size="sm" onClick={() => navigate(STUDIO.picks)}>
              View picks
            </Button>
          </Row>
        </Row>

        <StudioSummaryGrid
          items={[
            {
              id: 'win',
              icon: 'chart',
              iconTone: 'primary',
              label: 'Win rate',
              value: winRateLabel,
              delta: devPreview ? { value: '+3.1%', dir: 'up' } : undefined,
            },
            {
              id: 'record',
              icon: 'trophy',
              iconTone: 'violet',
              label: 'Record',
              value: creator?.record ?? (devPreview ? '92-66-4' : '—'),
            },
            {
              id: 'units',
              icon: 'flame',
              iconTone: 'amber',
              label: 'Units',
              value: creator?.units ?? (devPreview ? '+14.2u' : '—'),
              delta: devPreview ? { value: '30d', dir: 'up' } : undefined,
            },
            {
              id: 'graded',
              icon: 'feed',
              iconTone: 'danger',
              label: 'Graded picks',
              value: devPreview && graded === 0 ? '156' : graded.toLocaleString(),
            },
          ]}
        />

        <Card pad="lg" elev>
          <CardHead
            title="By market"
            sub="Performance breakdown across the markets you publish in"
            action={
              creator?.streak ? (
                <Badge tone="gold" dot>
                  {creator.streak}
                </Badge>
              ) : null
            }
          />
          {marketPerf.length === 0 ? (
            <EmptyState
              icon="chart"
              title="No graded picks yet"
              subtitle="Publish and grade picks to see market breakdowns."
              action={
                <Button variant="primary" size="sm" onClick={() => navigate(STUDIO.createPick)}>
                  Create pick
                </Button>
              }
            />
          ) : (
            <Stack gap={4}>
              {marketPerf.map((m) => (
                <Row key={m.market} gap={4} between wrap>
                  <TitleSub
                    title={m.market}
                    sub={`${m.picks} picks · ${(m.winRate * 100).toFixed(1)}%`}
                  />
                  <Mono>{m.units}</Mono>
                </Row>
              ))}
            </Stack>
          )}
        </Card>

        <Card pad="lg" elev>
          <CardHead title="Discipline" sub="Risk hygiene tied to your pick history" />
          <Row gap={6} wrap>
            <Stack gap={1}>
              <Eyebrow>Total picks</Eyebrow>
              <Mono>{(picks ?? []).length || (devPreview ? 156 : 0)}</Mono>
            </Stack>
            <Stack gap={1}>
              <Eyebrow>Markets</Eyebrow>
              <Mono>{marketPerf.length}</Mono>
            </Stack>
            <Stack gap={1}>
              <Eyebrow>Last 10</Eyebrow>
              <Mono>{creator?.last10 || (devPreview ? '7-3' : '—')}</Mono>
            </Stack>
          </Row>
        </Card>

        <QuickActionGrid title="Related" items={studioCrossLinks('analytics', navigate)} />
      </Stack>
    </Container>
  );
}
