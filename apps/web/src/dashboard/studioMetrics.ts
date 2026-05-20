import type { StudioSummaryGridItem } from '@digipicks/ds';
import type { NavigateFunction } from 'react-router-dom';
import { STUDIO } from '../lib/studioRoutes';

const CHART_HIGHLIGHTS: Record<string, { label: string; value: string }> = {
  '7d': { label: 'Today', value: '$1,142.00' },
  '30d': { label: 'May 12', value: '$4,280.00' },
  '90d': { label: 'Q1 peak', value: '$12,450.00' },
};

export function chartHighlightForPeriod(period: string) {
  return CHART_HIGHLIGHTS[period] ?? CHART_HIGHLIGHTS['7d']!;
}

export function buildOverviewSummary(
  ctx: {
    devPreview: boolean;
    activeSubs: number;
    newSubs7d: number;
    churnRate: string | null;
    publishedPicks: number;
    units: string;
  },
  navigate: NavigateFunction,
): StudioSummaryGridItem[] {
  const subsDisplay =
    ctx.activeSubs > 0 ? ctx.activeSubs.toLocaleString() : ctx.devPreview ? '420' : '—';

  return [
    {
      id: 'mrr',
      icon: 'dollar',
      iconTone: 'amber',
      label: 'Monthly revenue',
      value: ctx.devPreview ? '$12,450' : '—',
      delta: { value: '+12%', dir: 'up' },
      onClick: () => navigate(STUDIO.payouts),
    },
    {
      id: 'subs',
      icon: 'users',
      iconTone: 'primary',
      label: 'Active subscribers',
      value: subsDisplay,
      delta: { value: '+8.4%', dir: 'up' },
      onClick: () => navigate(STUDIO.subscribers),
    },
    {
      id: 'new',
      icon: 'users',
      iconTone: 'violet',
      label: 'New last 7d',
      value: ctx.newSubs7d > 0 ? `+${ctx.newSubs7d}` : ctx.devPreview ? '+18' : '—',
      delta: { value: '+4%', dir: 'up' },
      onClick: () => navigate(STUDIO.subscribers),
    },
    {
      id: 'churn',
      icon: 'chart',
      iconTone: 'danger',
      label: 'Churn rate',
      value: ctx.churnRate ? `${ctx.churnRate}%` : ctx.devPreview ? '2.4%' : '—',
      delta: { value: '-0.5%', dir: 'down' },
      onClick: () => navigate(STUDIO.subscribers),
    },
    {
      id: 'picks',
      icon: 'feed',
      iconTone: 'violet',
      label: 'Total picks',
      value: ctx.publishedPicks > 0 ? String(ctx.publishedPicks) : ctx.devPreview ? '156' : '—',
      delta: { value: 'Stable', dir: 'flat' },
      onClick: () => navigate(STUDIO.picks),
    },
    {
      id: 'perf',
      icon: 'chart',
      iconTone: 'primary',
      label: '30d performance',
      value: ctx.units,
      delta: { value: '+3.1u', dir: 'up' },
      onClick: () => navigate(STUDIO.analytics),
    },
  ];
}
