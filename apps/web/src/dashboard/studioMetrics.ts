import type { StudioSummaryGridItem } from '@digipicks/ds';
import type { NavigateFunction } from 'react-router-dom';
import { STUDIO } from '../lib/studioRoutes';

const CHART_HIGHLIGHTS: Record<string, { label: string; value: string }> = {
  '7d': { label: 'Today', value: '$1,142.00' },
  '30d': { label: 'May 12', value: '$4,280.00' },
  '90d': { label: 'Q1 peak', value: '$12,450.00' },
};

function formatUsd(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(0)}`;
  }
}

export function chartHighlightForPeriod(period: string) {
  return CHART_HIGHLIGHTS[period] ?? CHART_HIGHLIGHTS['7d']!;
}

/** Live earnings buckets from Convex — falls back to demo highlights in preview. */
export function chartHighlightFromEarnings(
  buckets: Array<{ key: string; paid: number }>,
  period: string,
  currency: string,
  devPreview: boolean,
): { label: string; value: string } {
  if (buckets.length === 0) {
    return devPreview ? chartHighlightForPeriod(period) : { label: '—', value: '—' };
  }
  const last = buckets[buckets.length - 1]!;
  const [year, month] = last.key.split('-');
  const label = month && year ? `${month}/${year.slice(2)}` : last.key;
  return { label, value: formatUsd(last.paid, currency) };
}

export function buildOverviewSummary(
  ctx: {
    devPreview: boolean;
    isLive: boolean;
    activeSubs: number;
    newSubs7d: number;
    churnRate: string | null;
    publishedPicks: number;
    units: string;
    mrrEstimateCents?: number;
    mrrCurrency?: string;
  },
  navigate: NavigateFunction,
): StudioSummaryGridItem[] {
  const subsDisplay =
    ctx.activeSubs > 0 ? ctx.activeSubs.toLocaleString() : ctx.devPreview ? '420' : '—';

  const mrrDisplay =
    ctx.mrrEstimateCents && ctx.mrrEstimateCents > 0
      ? formatUsd(ctx.mrrEstimateCents / 100, ctx.mrrCurrency ?? 'USD')
      : ctx.devPreview
        ? '$12,450'
        : '—';

  const showDemoDelta = ctx.devPreview && !ctx.isLive;

  return [
    {
      id: 'mrr',
      icon: 'dollar',
      iconTone: 'amber',
      label: 'Monthly revenue',
      value: mrrDisplay,
      delta: showDemoDelta ? { value: '+12%', dir: 'up' } : undefined,
      onClick: () => navigate(STUDIO.payouts),
    },
    {
      id: 'subs',
      icon: 'users',
      iconTone: 'primary',
      label: 'Active subscribers',
      value: subsDisplay,
      delta: showDemoDelta ? { value: '+8.4%', dir: 'up' } : undefined,
      onClick: () => navigate(STUDIO.subscribers),
    },
    {
      id: 'new',
      icon: 'users',
      iconTone: 'violet',
      label: 'New last 7d',
      value: ctx.newSubs7d > 0 ? `+${ctx.newSubs7d}` : ctx.devPreview ? '+18' : '—',
      delta: showDemoDelta ? { value: '+4%', dir: 'up' } : undefined,
      onClick: () => navigate(STUDIO.subscribers),
    },
    {
      id: 'churn',
      icon: 'chart',
      iconTone: 'danger',
      label: 'Churn rate',
      value: ctx.churnRate ? `${ctx.churnRate}%` : ctx.devPreview ? '2.4%' : '—',
      delta: showDemoDelta ? { value: '-0.5%', dir: 'down' } : undefined,
      onClick: () => navigate(STUDIO.subscribers),
    },
    {
      id: 'picks',
      icon: 'feed',
      iconTone: 'violet',
      label: 'Total picks',
      value: ctx.publishedPicks > 0 ? String(ctx.publishedPicks) : ctx.devPreview ? '156' : '—',
      delta: showDemoDelta ? { value: 'Stable', dir: 'flat' } : undefined,
      onClick: () => navigate(STUDIO.picks),
    },
    {
      id: 'perf',
      icon: 'chart',
      iconTone: 'primary',
      label: '30d performance',
      value: ctx.units,
      delta: showDemoDelta ? { value: '+3.1u', dir: 'up' } : undefined,
      onClick: () => navigate(STUDIO.analytics),
    },
  ];
}
