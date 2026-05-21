export type BillingStatusFilter = 'all' | 'active' | 'past_due' | 'cancelled' | 'refunded';

export const BILLING_STATUS_FILTERS: { value: BillingStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'past_due', label: 'Past due' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

export function parseBillingStatus(raw: string | null): BillingStatusFilter {
  if (raw === 'active' || raw === 'past_due' || raw === 'cancelled' || raw === 'refunded') {
    return raw;
  }
  return 'all';
}

export type BillingRow = {
  sub: { _id: string; status: string; plan: string };
  subscriberName: string;
  subscriberEmail: string;
  monogram: string;
  creatorName: string;
  creatorHandle: string;
  priceLabel: string;
  healthLabel: string;
  healthTone: 'green' | 'amber' | 'red' | 'mute';
  renewsLabel: string;
};

export function subscriptionStatusLabel(status: string): string {
  switch (status) {
    case 'past_due':
      return 'Past due';
    case 'active':
      return 'Active';
    case 'cancelled':
      return 'Canceled';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
}

export function subscriptionStatusTone(status: string): 'green' | 'amber' | 'red' | 'mute' {
  switch (status) {
    case 'active':
      return 'green';
    case 'past_due':
      return 'red';
    case 'cancelled':
    case 'refunded':
      return 'mute';
    default:
      return 'mute';
  }
}

export function planLabel(plan: string): string {
  if (plan === 'free') return 'Free tier';
  if (plan === 'premium') return 'Premium';
  if (plan === 'vip') return 'VIP';
  return plan;
}

export function matchesBillingFilters(
  row: BillingRow,
  search: string,
  status: BillingStatusFilter,
  paymentIssueOnly: boolean,
): boolean {
  if (status !== 'all' && row.sub.status !== status) return false;
  if (paymentIssueOnly && row.sub.status !== 'past_due') return false;

  const q = search.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    row.subscriberName,
    row.subscriberEmail,
    row.creatorName,
    row.creatorHandle,
    row.sub.plan,
    planLabel(row.sub.plan),
    row.sub.status,
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export function formatMrr(cents: number): string {
  if (cents <= 0) return '$0';
  if (cents >= 100_000) {
    return `$${(cents / 100_000).toFixed(1)}K`;
  }
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatMoneyCents(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
