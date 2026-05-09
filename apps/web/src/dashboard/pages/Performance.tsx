import React from 'react';
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
  Icon,
  Mono,
  Muted,
  Sparkline,
  Badge,
  PageHead,
  Segmented,
  KV,
  StatGrid,
  TitleSub,
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';

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

/** Compute market-level performance from graded picks. */
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
  const [range, setRange] = React.useState('30d');

  const me = useQuery(api.users.meSafe);
  const creator = useQuery(
    api.creators.get,
    me?.creatorId ? { id: me.creatorId } : 'skip',
  );
  const picks = useQuery(
    api.picks.byCreator,
    creator?._id ? { creatorId: creator._id, limit: 500 } : 'skip',
  );

  const marketPerf = React.useMemo(
    () => computeMarketPerf(picks ?? []),
    [picks],
  );

  const winRateLabel = creator
    ? `${(creator.winRate * 100).toFixed(1)}%`
    : '—';

  return (
    <>
      <PageHeader
        title="Performance"
        crumbs={[{ label: 'Audience' }, { label: 'Performance' }]}
        actions={
          <Button variant="secondary" size="sm">
            <Icon name="filter" size={13} />
            Export CSV
          </Button>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Audience"
            title="Performance"
            sub="Win rate, ROI, and unit results — sliced by market and rolling window."
            actions={
              <Segmented
                options={RANGE_OPTIONS}
                value={range}
                onChange={setRange}
                ariaLabel="Range"
              />
            }
          />

          <StatGrid
            items={[
              {
                id: 'win',
                label: 'Win rate',
                value: <Mono>{winRateLabel}</Mono>,
                sub: (
                  <Row gap={2}>
                    <Muted>Lifetime · public log</Muted>
                  </Row>
                ),
              },
              {
                id: 'record',
                label: 'Record',
                value: <Mono>{creator?.record ?? '—'}</Mono>,
                sub: (
                  <Row gap={2}>
                    <Muted>W-L-P</Muted>
                  </Row>
                ),
              },
              {
                id: 'units',
                label: 'Units',
                value: <Mono>{creator?.units ?? '—'}</Mono>,
                sub: (
                  <Row gap={2}>
                    <Muted>Net since opening</Muted>
                  </Row>
                ),
              },
              {
                id: 'last10',
                label: 'Last 10',
                value: <Mono>{creator?.last10 || '—'}</Mono>,
                sub: (
                  <Row gap={2}>
                    {creator?.streak ? (
                      <Badge tone="gold" dot>
                        {creator.streak}
                      </Badge>
                    ) : (
                      <Muted>—</Muted>
                    )}
                  </Row>
                ),
              },
            ]}
          />

          <Row gap={5} wrap>
            <Col gap={4}>
              <Card>
                <CardHead title="By market" sub="Performance breakdown across the markets you publish in" />
                {marketPerf.length === 0 ? (
                  <EmptyState
                    icon="chart"
                    title="No graded picks yet."
                    subtitle="Publish and grade picks to see market breakdowns."
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
            </Col>

            <Col gap={4}>
              {/* Discipline metrics — computed from pick history */}
              <Card>
                <CardHead title="Discipline" sub="Risk hygiene and consistency" />
                <Stack gap={2}>
                  <KV k="Total picks" v={<Mono>{(picks ?? []).length}</Mono>} />
                  <KV k="Graded" v={<Mono>{(picks ?? []).filter((p) => p.grade && p.grade !== 'pending').length}</Mono>} />
                  <KV k="Markets" v={<Mono>{marketPerf.length}</Mono>} />
                  <KV k="Avg unit size" v={<Mono>{creator?.units ?? '—'}</Mono>} />
                </Stack>
              </Card>
            </Col>
          </Row>
        </Stack>
      </Container>
    </>
  );
}
