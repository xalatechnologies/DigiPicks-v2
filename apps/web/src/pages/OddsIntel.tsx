import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  Container,
  Section,
  PageHead,
  Row,
  Stack,
  Col,
  Card,
  CardHead,
  Button,
  Icon,
  Badge,
  Muted,
  PersonRow,
  EmptyState,
  OddsGrid,
  Sparkline,
  type OddsBook,
  type OddsRow,
} from '@digipicks/ds';
import { api } from '../../../../convex/_generated/api';
import type { Doc, Id } from '../../../../convex/_generated/dataModel';

type OddsSnapshot = Doc<'oddsSnapshots'>;

const MARKET_LABEL: Record<string, string> = {
  h2h: 'Moneyline',
  spreads: 'Spread',
  totals: 'Total',
};

function buildGridData(
  snapshots: OddsSnapshot[] | undefined,
): { books: OddsBook[]; rows: OddsRow[] } {
  if (!snapshots || snapshots.length === 0) return { books: [], rows: [] };

  const bookMap = new Map<string, OddsBook>();
  const rowMap = new Map<string, OddsRow>();

  for (const snap of snapshots) {
    if (!bookMap.has(snap.book)) {
      bookMap.set(snap.book, { key: snap.book, title: snap.bookTitle });
    }

    const rowKey = `${snap.market}|${snap.side}|${snap.point ?? ''}`;
    const rowLabel = (() => {
      const market = MARKET_LABEL[snap.market] ?? snap.market;
      if (snap.market === 'totals' && snap.point !== undefined) {
        return `${snap.side} ${snap.point}`;
      }
      if (snap.market === 'spreads' && snap.point !== undefined) {
        const sign = snap.point > 0 ? `+${snap.point}` : `${snap.point}`;
        return `${snap.side} ${sign}`;
      }
      return `${market} · ${snap.side}`;
    })();

    if (!rowMap.has(rowKey)) {
      rowMap.set(rowKey, {
        market: snap.market,
        side: snap.side,
        label: rowLabel,
        cells: {},
      });
    }
    const row = rowMap.get(rowKey)!;
    row.cells[snap.book] = { price: snap.price, point: snap.point };
  }

  const books = Array.from(bookMap.values()).sort((a, b) =>
    a.title.localeCompare(b.title),
  );
  const rows = Array.from(rowMap.values());
  return { books, rows };
}

export function OddsIntel() {
  const navigate = useNavigate();
  const events = useQuery(api.events.today, {});
  const [activeId, setActiveId] = React.useState<Id<'events'> | null>(null);

  const snapshots = useQuery(
    api.odds.byEvent,
    activeId ? { eventId: activeId, limit: 200 } : 'skip',
  );

  React.useEffect(() => {
    if (!activeId && events && events.length > 0) {
      setActiveId(events[0]!._id);
    }
  }, [activeId, events]);

  const active = events?.find((e) => e._id === activeId) ?? null;
  const { books, rows } = buildGridData(snapshots ?? undefined);

  // Pull a moneyline price history for the home team for the sparkline.
  const homeMoneylineHistory = useQuery(
    api.odds.lineMovement,
    activeId && active
      ? {
          eventId: activeId,
          market: 'h2h',
          book: snapshots?.[0]?.book ?? 'fanduel',
          side: active.home,
          limit: 60,
        }
      : 'skip',
  );

  return (
    <main>
      <Container size="xl">
        <PageHead
          eyebrow="Odds intelligence"
          title="Compare books, watch lines move."
          sub="Live moneyline, spread, and totals across major books — sourced from The Odds API. Best price per row is highlighted."
          actions={
            <Row gap={2}>
              <Button
                variant="secondary"
                iconLeft="calendar"
                onClick={() => navigate('/events')}
              >
                Today's events
              </Button>
            </Row>
          }
        />

        <Section>
          <Row gap={4} wrap>
            <Col gap={3}>
              <Card pad="sm">
                <CardHead title="Events" sub="Tap one to compare odds" />
                {events === undefined ? (
                  <EmptyState icon="calendar" title="Loading events…" />
                ) : events.length === 0 ? (
                  <EmptyState
                    icon="calendar"
                    title="No events scheduled."
                    subtitle="Check back when tonight's slate is loaded."
                  />
                ) : (
                  <Stack gap={1}>
                    {events.slice(0, 30).map((e) => {
                      const isActive = e._id === activeId;
                      return (
                        <Card
                          key={e._id}
                          hover
                          pad="sm"
                          onClick={() => setActiveId(e._id)}
                        >
                          <PersonRow
                            name={e.title ?? `${e.home} vs ${e.away}`}
                            sub={`${e.sport} · ${e.league} · ${e.time}`}
                            mono={e.sport[0] ?? 'E'}
                            color="#3A4F7A"
                            trailing={
                              isActive ? (
                                <Badge tone="blue" dot>
                                  Open
                                </Badge>
                              ) : null
                            }
                          />
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Card>
            </Col>

            <Col gap={3}>
              {!active ? (
                <Card>
                  <EmptyState
                    icon="chart"
                    title="Pick an event"
                    subtitle="Choose an event on the left to compare odds across books."
                  />
                </Card>
              ) : (
                <Stack gap={4}>
                  <Card>
                    <CardHead
                      title={active.title ?? `${active.home} vs ${active.away}`}
                      sub={`${active.sport} · ${active.league} · ${active.time}`}
                      action={
                        snapshots !== undefined && snapshots.length > 0 ? (
                          <Badge tone="green" dot>
                            {books.length} books
                          </Badge>
                        ) : (
                          <Badge tone="mute">No odds yet</Badge>
                        )
                      }
                    />
                    {snapshots === undefined ? (
                      <EmptyState icon="chart" title="Loading odds…" />
                    ) : (
                      <OddsGrid books={books} rows={rows} highlightBest />
                    )}
                  </Card>

                  {homeMoneylineHistory && homeMoneylineHistory.length > 1 && (
                    <Card>
                      <CardHead
                        title="Line movement"
                        sub={`${active.home} moneyline · ${snapshots?.[0]?.bookTitle ?? 'first book'}`}
                      />
                      <Row between>
                        <Stack gap={1}>
                          <Muted>
                            {homeMoneylineHistory.length} snapshots over time
                          </Muted>
                        </Stack>
                        <Sparkline
                          values={homeMoneylineHistory.map((h) => h.price)}
                          color="var(--accent-foreground)"
                          width={240}
                          height={48}
                        />
                      </Row>
                    </Card>
                  )}

                  {snapshots !== undefined && snapshots.length === 0 && (
                    <Card>
                      <EmptyState
                        icon="chart"
                        title="No odds captured yet."
                        subtitle="Set ODDS_SNAPSHOTS_ENABLED=true in Convex env and run pollOddsSnapshots to start collecting lines for this event."
                      />
                    </Card>
                  )}
                </Stack>
              )}
            </Col>
          </Row>
        </Section>
      </Container>
    </main>
  );
}
