import React from 'react';
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
} from '@digipicks/ds';
import { MARKET_PERF } from '../data/mock';

const RANGE_OPTIONS = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'YTD', value: 'ytd' },
];

interface TopEarner {
  id: string;
  title: string;
  meta: string;
  saves: string;
}

const TOP_EARNERS: TopEarner[] = [
  { id: 'lakers-h1', title: 'Lakers vs Nuggets H1 Over', meta: 'NBA · Totals', saves: '+312 saves' },
  { id: 'knicks-ml', title: 'Knicks ML preview', meta: 'NBA · Moneyline', saves: '+522 saves' },
  { id: 'saka', title: 'Saka anytime scorer', meta: 'EPL · Goalscorer', saves: '+198 saves' },
];

export function Performance() {
  const [range, setRange] = React.useState('30d');

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
                value: <Mono>61.2%</Mono>,
                sub: (
                  <Row gap={2}>
                    <Badge tone="green" dot>+1.8 pts</Badge>
                    <Muted>vs prior 30d</Muted>
                  </Row>
                ),
              },
              {
                id: 'roi',
                label: 'ROI',
                value: <Mono>+11.4%</Mono>,
                sub: (
                  <Row gap={2}>
                    <Badge tone="green" dot>+2.1 pts</Badge>
                    <Muted>units-weighted</Muted>
                  </Row>
                ),
              },
              {
                id: 'units',
                label: 'Units',
                value: <Mono>+41.4u</Mono>,
                sub: (
                  <Row gap={2}>
                    <Badge tone="green" dot>+6.2u</Badge>
                    <Muted>this month</Muted>
                  </Row>
                ),
              },
              {
                id: 'streak',
                label: 'Streak',
                value: <Mono>W4</Mono>,
                sub: (
                  <Row gap={2}>
                    <Badge tone="gold" dot>Hot</Badge>
                    <Muted>3 graded today</Muted>
                  </Row>
                ),
              },
            ]}
          />

          <Row gap={5} wrap>
            <Col gap={4}>
              <Card>
                <CardHead title="By market" sub="Performance breakdown across the markets you publish in" />
                <Stack gap={4}>
                  {MARKET_PERF.map((m) => (
                    <Row key={m.market} gap={4} between wrap>
                      <TitleSub
                        title={m.market}
                        sub={`${m.picks} picks · ${(m.winRate * 100).toFixed(1)}%`}
                      />
                      <Sparkline values={m.trend} width={140} height={32} />
                      <Mono>{m.units}</Mono>
                    </Row>
                  ))}
                </Stack>
              </Card>
            </Col>

            <Col gap={4}>
              <Card>
                <CardHead title="Discipline" sub="Closing line value and risk hygiene" />
                <Stack gap={2}>
                  <KV k="CLV beat rate" v={<Mono>58.2%</Mono>} />
                  <KV k="Avg unit size" v={<Mono>1.6u</Mono>} />
                  <KV k="Max drawdown" v={<Mono>−8.4u</Mono>} />
                  <KV k="Picks per week" v={<Mono>9.3</Mono>} />
                  <KV k="Pre-game share" v={<Mono>96%</Mono>} />
                </Stack>
              </Card>

              <Card>
                <CardHead title="Top earners" sub="Picks that drove the most subscriber action" />
                <Stack gap={3}>
                  {TOP_EARNERS.map((t) => (
                    <Row key={t.id} gap={3} between>
                      <TitleSub title={t.title} sub={t.meta} />
                      <Mono>{t.saves}</Mono>
                    </Row>
                  ))}
                </Stack>
              </Card>
            </Col>
          </Row>
        </Stack>
      </Container>
    </>
  );
}
