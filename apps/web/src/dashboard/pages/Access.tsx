// TODO: convex — access matrix and defaults are mocked. Needs an
// api.access.matrixByCreator query + api.access.update mutation.
import React from 'react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  PageHead,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  AccessBadge,
  Switch,
  Muted,
  Mono,
} from '@digipicks/ds';

interface AccessRow {
  market: string;
  free: boolean;
  premium: boolean;
  vip: boolean;
  cap: string;
}

const ROWS: AccessRow[] = [
  { market: 'Soccer · Goalscorer', free: false, premium: true, vip: true, cap: 'Unlimited' },
  { market: 'Soccer · Totals', free: true, premium: true, vip: true, cap: '1 free / week' },
  { market: 'Soccer · Moneyline', free: true, premium: true, vip: true, cap: '1 free / week' },
  { market: 'Cricket · Match Winner', free: false, premium: true, vip: true, cap: 'Unlimited' },
  { market: 'Tennis · Match Totals', free: false, premium: true, vip: true, cap: 'Unlimited' },
  { market: 'Tennis · Set Spread', free: false, premium: false, vip: true, cap: 'VIP only' },
];

interface DefaultEntry {
  id: 'free' | 'premium' | 'vip';
  caption: string;
}

const DEFAULTS: DefaultEntry[] = [
  { id: 'free', caption: 'New free market default' },
  { id: 'premium', caption: 'Premium default' },
  { id: 'vip', caption: 'VIP exclusive default' },
];

export function Access() {
  const [rows, setRows] = React.useState<AccessRow[]>(ROWS);

  const toggle = (i: number, key: 'free' | 'premium' | 'vip', value: boolean) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  };

  return (
    <>
      <PageHeader
        title="Access Control"
        crumbs={[{ label: 'Growth' }, { label: 'Access' }]}
        actions={
          <Button variant="primary" size="sm">
            <Icon name="check" size={13} />
            Save changes
          </Button>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Growth"
            title="Map plans to content"
            sub="Decide which markets are part of each plan — preview shown to subscribers honors these toggles."
          />

          <Row gap={3} wrap>
            <AccessBadge access="free" />
            <Muted>Public — used for funnel</Muted>
          </Row>

          <Card pad="sm">
            <Table>
              <THead>
                <Tr>
                  <Th>Market</Th>
                  <Th>Free</Th>
                  <Th>Premium</Th>
                  <Th>VIP</Th>
                  <Th>Cap</Th>
                </Tr>
              </THead>
              <TBody>
                {rows.map((r, i) => (
                  <Tr key={r.market}>
                    <Td>{r.market}</Td>
                    <Td>
                      <Switch checked={r.free} onChange={(v) => toggle(i, 'free', v)} />
                    </Td>
                    <Td>
                      <Switch checked={r.premium} onChange={(v) => toggle(i, 'premium', v)} />
                    </Td>
                    <Td>
                      <Switch checked={r.vip} onChange={(v) => toggle(i, 'vip', v)} />
                    </Td>
                    <Td>
                      <Mono>{r.cap}</Mono>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>

          <Card>
            <CardHead title="Defaults for new markets" sub="Applied automatically when you publish in a new market" />
            <Row gap={4} wrap>
              {DEFAULTS.map((d) => (
                <Stack key={d.id} gap={1}>
                  <Muted>{d.caption}</Muted>
                  <AccessBadge access={d.id} />
                </Stack>
              ))}
            </Row>
          </Card>
        </Stack>
      </Container>
    </>
  );
}
