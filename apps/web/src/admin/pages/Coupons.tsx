import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Button,
  StudioPageHeader,
  AdminMetricStrip,
  AdminCouponsTable,
  AdminCouponComposerDrawer,
  Search,
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

function useCouponParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const compose = searchParams.get('compose') === '1';

  const setCompose = (open: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (open) params.set('compose', '1');
    else params.delete('compose');
    setSearchParams(params, { replace: true });
  };

  return { compose, setCompose };
}

export function Coupons() {
  const { compose, setCompose } = useCouponParams();
  const [search, setSearch] = useState('');

  const summary = useQuery(api.coupons.couponsSummary, {});
  const coupons = useQuery(api.coupons.list, { limit: 100 });
  const create = useMutation(api.coupons.create);
  const archive = useMutation(api.coupons.archive);

  const [code, setCode] = useState('');
  const [stripeCouponId, setStripeCouponId] = useState('');
  const [percentOff, setPercentOff] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!coupons) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter((c) =>
      [c.code, c.stripeCouponId, c.notes ?? ''].join(' ').toLowerCase().includes(q),
    );
  }, [coupons, search]);

  const tableRows = useMemo(() => {
    if (!filtered) return [];
    return filtered.map((c) => ({
      id: c._id,
      code: c.code,
      discountLabel: fmtDiscount(c),
      stripeCouponId: c.stripeCouponId,
      redemptionLabel:
        c.maxRedemptions > 0
          ? `${c.redemptionCount} / ${c.maxRedemptions}`
          : String(c.redemptionCount),
      expiresLabel: fmtDate(c.expiresAt),
      capped: c.maxRedemptions > 0 && c.redemptionCount >= c.maxRedemptions,
    }));
  }, [filtered]);

  const kpiItems = useMemo(() => {
    if (!summary) {
      return [
        { label: 'Active', value: '—' },
        { label: 'Archived', value: '—' },
        { label: 'Near cap', value: '—' },
        { label: 'Redemptions', value: '—' },
      ];
    }
    return [
      { label: 'Active', value: String(summary.activeCount) },
      { label: 'Archived', value: String(summary.archivedCount) },
      {
        label: 'Near cap',
        value: String(summary.nearCapCount),
        badge: summary.nearCapCount > 0 ? { text: 'Review', tone: 'urgent' as const } : undefined,
      },
      { label: 'Redemptions', value: String(summary.totalRedemptions) },
    ];
  }, [summary]);

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
      setCompose(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create coupon.');
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive(couponId: string) {
    try {
      await archive({ couponId: couponId as Id<'couponCodes'> });
    } catch (err) {
      console.warn('archive coupon:', err);
    }
  }

  const footerLabel =
    filtered === undefined
      ? undefined
      : `Showing ${filtered.length} coupon${filtered.length === 1 ? '' : 's'}`;

  return (
    <Container size="2xl">
      <Stack gap={10}>
        <StudioPageHeader
          eyebrow="Operational hub"
          title="Promo coupons"
          sub="Map Stripe coupons to DigiPicks codes. Stripe enforces the discount; this surface manages issuance, caps, and expiry."
          actions={
            <Button variant="primary" iconLeft="plus" onClick={() => setCompose(true)}>
              New coupon
            </Button>
          }
        />

        <AdminMetricStrip columns={5} items={kpiItems} />

        <Stack gap={4}>
          <Search
            layout="toolbar"
            placeholder="Search code or Stripe ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search coupons"
          />

          <AdminCouponsTable
            rows={tableRows}
            selectedId={selectedId}
            loading={coupons === undefined}
            footerLabel={footerLabel}
            onSelect={setSelectedId}
            onArchive={handleArchive}
          />
        </Stack>
      </Stack>

      <AdminCouponComposerDrawer
        open={compose}
        onClose={() => setCompose(false)}
        code={code}
        stripeCouponId={stripeCouponId}
        percentOff={percentOff}
        maxRedemptions={maxRedemptions}
        expiresOn={expiresOn}
        notes={notes}
        onCodeChange={setCode}
        onStripeCouponIdChange={setStripeCouponId}
        onPercentOffChange={setPercentOff}
        onMaxRedemptionsChange={setMaxRedemptions}
        onExpiresOnChange={setExpiresOn}
        onNotesChange={setNotes}
        onSave={handleCreate}
        busy={busy}
        error={error}
      />
    </Container>
  );
}
