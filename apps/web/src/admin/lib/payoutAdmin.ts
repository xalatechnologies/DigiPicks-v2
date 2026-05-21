export type ConnectFilter = 'all' | 'active' | 'pending' | 'not_started' | 'restricted';

export const CONNECT_FILTERS: { value: ConnectFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'not_started', label: 'Not started' },
  { value: 'restricted', label: 'Restricted' },
];

export function parseConnectFilter(raw: string | null): ConnectFilter {
  if (raw === 'active' || raw === 'pending' || raw === 'not_started' || raw === 'restricted') {
    return raw;
  }
  return 'all';
}

export type PayoutCreatorRow = {
  creatorId: string;
  name: string;
  handle: string;
  monogram: string;
  nicheLine: string;
  connectStatus: string;
  paidTotal: number;
  pendingTotal: number;
  failedCount: number;
  nextPendingAt?: number;
  stripeConnectAccountId?: string;
};

export function formatPayoutAmount(amount: number): string {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPayoutCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return formatPayoutAmount(amount);
}

export function connectStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'pending':
      return 'Onboarding';
    case 'restricted':
      return 'Restricted';
    case 'not_started':
      return 'Not connected';
    default:
      return status;
  }
}

export function connectStatusTone(status: string): 'green' | 'amber' | 'red' | 'mute' {
  switch (status) {
    case 'active':
      return 'green';
    case 'pending':
      return 'amber';
    case 'restricted':
      return 'red';
    default:
      return 'mute';
  }
}

export function payoutStatusLabel(row: PayoutCreatorRow): string {
  if (row.failedCount > 0) return 'Needs review';
  if (row.pendingTotal > 0) return 'Scheduled';
  if (row.connectStatus === 'restricted') return 'Hold';
  if (row.connectStatus === 'active') return 'Ready';
  if (row.connectStatus === 'pending') return 'Onboarding';
  return 'Not connected';
}

export function payoutStatusTone(row: PayoutCreatorRow): 'green' | 'amber' | 'red' | 'mute' {
  if (row.failedCount > 0) return 'red';
  if (row.pendingTotal > 0) return 'green';
  if (row.connectStatus === 'restricted') return 'amber';
  if (row.connectStatus === 'active') return 'green';
  return 'mute';
}

export function formatUpcomingLabel(nextPendingAt?: number): string {
  if (!nextPendingAt) return '—';
  return new Date(nextPendingAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function payoutMethodLabel(stripeConnectAccountId?: string): string {
  return stripeConnectAccountId ? 'Stripe' : '—';
}

export function matchesPayoutFilters(
  row: PayoutCreatorRow,
  search: string,
  connect: ConnectFilter,
  issuesOnly: boolean,
): boolean {
  if (connect !== 'all' && row.connectStatus !== connect) return false;
  if (issuesOnly && row.failedCount <= 0 && row.connectStatus !== 'restricted') {
    return false;
  }

  const q = search.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    row.name,
    row.handle,
    row.nicheLine,
    row.connectStatus,
    connectStatusLabel(row.connectStatus),
    row.stripeConnectAccountId ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}
