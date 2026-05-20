import React from 'react';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  PageHead,
  Section,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  Field,
  Input,
  TextArea,
  Mono,
  Muted,
  Badge,
  EmptyState,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

function fmtDate(ms: number): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtDiscount(row: { percentOff?: number; amountOffCents?: number }): string {
  if (typeof row.percentOff === 'number') return `${row.percentOff}% off`;
  if (typeof row.amountOffCents === 'number') {
    return `$${(row.amountOffCents / 100).toFixed(2)} off`;
  }
  return '—';
}

/**
 * Admin coupon administration. Mirror of Stripe coupons — admin enters
 * the Stripe coupon ID + DigiPicks code mapping. Stripe enforces the
 * actual discount; this surface manages issuance + caps.
 */
export function Coupons() {
  const coupons = useQuery(api.coupons.list, { limit: 100 });
  const create = useMutation(api.coupons.create);
  const archive = useMutation(api.coupons.archive);

  const [code, setCode] = React.useState('');
  const [stripeCouponId, setStripeCouponId] = React.useState('');
  const [percentOff, setPercentOff] = React.useState('');
  const [maxRedemptions, setMaxRedemptions] = React.useState('');
  const [expiresOn, setExpiresOn] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    if (!code.trim() || !stripeCouponId.trim()) {
      setError('Code and Stripe coupon ID are required.');
      return;
    }
    setBusy(true);
    try {
      const expiresAt = expiresOn ? new Date(expiresOn).getTime() : 0;
      const pct = percentOff.trim() ? Number(percentOff) : undefined;
      const max = maxRedemptions.trim() ? Number(maxRedemptions) : 0;
      await create({
        code: code.trim().toUpperCase(),
        stripeCouponId: stripeCouponId.trim(),
        percentOff: Number.isFinite(pct) ? pct : undefined,
        maxRedemptions: Number.isFinite(max) ? max : 0,
        expiresAt,
        notes: notes.trim() || undefined,
      });
      setCode('');
      setStripeCouponId('');
      setPercentOff('');
      setMaxRedemptions('');
      setExpiresOn('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create coupon.');
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive(couponId: Id<'couponCodes'>) {
    if (!window.confirm('Archive this coupon? It will no longer be redeemable.')) return;
    try {
      await archive({ couponId });
    } catch (err) {
      console.warn('archive coupon:', err);
    }
  }

  const list = coupons ?? [];

  return (
    <Container size="2xl">
      <Stack gap={5}>
        <PageHead
          eyebrow="Admin"
          title="Promo coupons"
          sub="Map Stripe coupons to DigiPicks codes. Stripe enforces the discount; this surface manages issuance + caps + expiry."
        />

        <Section>
          <Row gap={4} wrap>
            <Card>
              <CardHead title="Active coupons" sub={`${list.length} live`} />
              {coupons === undefined ? (
                <EmptyState icon="card" title="Loading…" />
              ) : list.length === 0 ? (
                <EmptyState
                  icon="card"
                  title="No coupons yet"
                  subtitle="Create one in the form to start running promos."
                />
              ) : (
                <Table>
                  <THead>
                    <Tr>
                      <Th>Code</Th>
                      <Th>Discount</Th>
                      <Th>Stripe ID</Th>
                      <Th>Redeemed</Th>
                      <Th>Expires</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {list.map((c) => (
                      <Tr key={c._id}>
                        <Td>
                          <Mono>{c.code}</Mono>
                        </Td>
                        <Td>{fmtDiscount(c)}</Td>
                        <Td>
                          <Mono>{c.stripeCouponId}</Mono>
                        </Td>
                        <Td>
                          {c.redemptionCount}
                          {c.maxRedemptions > 0 ? ` / ${c.maxRedemptions}` : ''}
                          {c.maxRedemptions > 0 && c.redemptionCount >= c.maxRedemptions && (
                            <Badge tone="amber">capped</Badge>
                          )}
                        </Td>
                        <Td>{c.expiresAt > 0 ? fmtDate(c.expiresAt) : '—'}</Td>
                        <Td>
                          <Button variant="ghost" size="sm" onClick={() => handleArchive(c._id)}>
                            <Icon name="trash" size={13} />
                            Archive
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              )}
            </Card>

            <Card>
              <CardHead
                title="New coupon"
                sub="Create the coupon in Stripe first, then enter the IDs here."
              />
              <Stack gap={3}>
                <Field label="Code" help="Visible to customers. e.g. LAUNCH50" required>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={32}
                    placeholder="LAUNCH50"
                  />
                </Field>
                <Field label="Stripe coupon ID" required>
                  <Input
                    value={stripeCouponId}
                    onChange={(e) => setStripeCouponId(e.target.value)}
                    placeholder="VWb1tGtQ"
                  />
                </Field>
                <Row gap={3} wrap>
                  <Field label="Percent off (display only)">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={percentOff}
                      onChange={(e) => setPercentOff(e.target.value)}
                      placeholder="50"
                    />
                  </Field>
                  <Field label="Max redemptions (0 = unlimited)">
                    <Input
                      type="number"
                      min={0}
                      value={maxRedemptions}
                      onChange={(e) => setMaxRedemptions(e.target.value)}
                      placeholder="100"
                    />
                  </Field>
                </Row>
                <Field label="Expires (optional)">
                  <Input
                    type="date"
                    value={expiresOn}
                    onChange={(e) => setExpiresOn(e.target.value)}
                  />
                </Field>
                <Field label="Internal notes">
                  <TextArea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Launch campaign · Q2 push…"
                  />
                </Field>
                {error && <Muted>{error}</Muted>}
                <Row gap={2}>
                  <Button variant="primary" size="sm" onClick={handleCreate} disabled={busy}>
                    <Icon name="plus" size={13} />
                    Create coupon
                  </Button>
                </Row>
              </Stack>
            </Card>
          </Row>
        </Section>
      </Stack>
    </Container>
  );
}
