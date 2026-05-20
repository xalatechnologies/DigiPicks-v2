import type { StudioSummaryGridItem } from '@digipicks/ds';
import type { NavigateFunction } from 'react-router-dom';

export function buildAccountSummary(
  input: {
    hasPortfolio: boolean;
    netUnits: number;
    winRate: number;
    wins: number;
    losses: number;
    activeSubs: number;
    totalMonthly: number;
  },
  navigate: NavigateFunction,
): StudioSummaryGridItem[] {
  const record =
    input.wins + input.losses > 0
      ? `${input.wins}W-${input.losses}L`
      : input.hasPortfolio
        ? '0W-0L'
        : '—';

  const netDisplay = input.hasPortfolio
    ? `${input.netUnits > 0 ? '+' : ''}${input.netUnits}u`
    : '—';

  const winRateDisplay = input.hasPortfolio ? `${Math.round(input.winRate)}%` : '—';

  const subsDisplay = input.activeSubs > 0 ? String(input.activeSubs) : '0';

  const spendDisplay = input.activeSubs > 0 ? `$${input.totalMonthly}/mo` : '—';

  return [
    {
      id: 'units',
      icon: 'chart',
      iconTone: input.netUnits > 0 ? 'primary' : input.netUnits < 0 ? 'danger' : 'amber',
      label: 'Net units',
      value: netDisplay,
      onClick: () => navigate('/account/results'),
    },
    {
      id: 'winrate',
      icon: 'flame',
      iconTone: input.winRate >= 55 ? 'primary' : input.winRate >= 50 ? 'amber' : 'danger',
      label: 'Win rate',
      value: winRateDisplay,
      onClick: () => navigate('/account/results'),
    },
    {
      id: 'subs',
      icon: 'card',
      iconTone: 'violet',
      label: 'Active subs',
      value: subsDisplay,
      onClick: () => navigate('/account/subscriptions'),
    },
    {
      id: 'spend',
      icon: 'dollar',
      iconTone: 'primary',
      label: 'Monthly spend',
      value: spendDisplay,
      onClick: () => navigate('/account/subscriptions'),
    },
    {
      id: 'record',
      icon: 'feed',
      iconTone: 'violet',
      label: 'Graded record',
      value: record,
      onClick: () => navigate('/account/results'),
    },
    {
      id: 'saved',
      icon: 'bookmark',
      iconTone: 'primary',
      label: 'Saved picks',
      value: 'View',
      onClick: () => navigate('/account/saved'),
    },
  ];
}
