import type { Doc } from '../../../../../convex/_generated/dataModel';

export type CreatorStatusFilter = 'all' | 'active' | 'suspended' | 'pending';
export type CreatorVerifiedFilter = 'all' | 'verified' | 'unverified';

export const CREATOR_STATUS_FILTERS: { value: CreatorStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
];

export const CREATOR_VERIFIED_FILTERS: { value: CreatorVerifiedFilter; label: string }[] = [
  { value: 'all', label: 'Verified: all' },
  { value: 'verified', label: 'Verified only' },
  { value: 'unverified', label: 'Unverified' },
];

export type CreatorStatusTone = 'green' | 'amber' | 'red' | 'mute';

export function parseCreatorStatus(value: string | null): CreatorStatusFilter {
  if (value === 'active' || value === 'suspended' || value === 'pending') return value;
  return 'all';
}

export function parseVerifiedFilter(value: string | null): CreatorVerifiedFilter {
  if (value === 'verified' || value === 'unverified') return value;
  return 'all';
}

export function statusDisplay(status: string): { label: string; tone: CreatorStatusTone } {
  switch (status) {
    case 'active':
      return { label: 'Active', tone: 'green' };
    case 'suspended':
      return { label: 'Suspended', tone: 'red' };
    case 'pending':
      return { label: 'Pending', tone: 'amber' };
    default:
      return { label: status, tone: 'mute' };
  }
}

export function formatJoinedLabel(createdAt: number): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatSubscriberCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return count.toLocaleString();
}

export function formatRevenue(amount: number): string {
  if (amount <= 0) return '—';
  return `$${amount.toLocaleString()}`;
}

export function formatTrustScore(score: number | undefined): string {
  if (score === undefined) return '—';
  return `${Math.round(score)}`;
}

export function nicheLabel(creator: Pick<Doc<'creators'>, 'niche' | 'sports'>): string {
  const sport = creator.sports[0];
  if (sport && creator.niche) return `${sport} · ${creator.niche}`;
  return creator.niche || sport || 'Creator';
}

type CreatorRow = Doc<'creators'> & {
  activeSubscriptions?: number;
  estMonthlyRevenue?: number;
};

export function matchesCreatorSearch(
  creator: CreatorRow,
  search: string,
  status: CreatorStatusFilter,
  sport: string,
  verified: CreatorVerifiedFilter,
): boolean {
  if (status !== 'all' && creator.status !== status) return false;
  if (verified === 'verified' && !creator.verified) return false;
  if (verified === 'unverified' && creator.verified) return false;
  if (sport !== 'all' && !creator.sports.includes(sport)) return false;
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    creator.name.toLowerCase().includes(q) ||
    creator.handle.toLowerCase().includes(q) ||
    creator.niche.toLowerCase().includes(q) ||
    creator._id.includes(q)
  );
}

export function auditToHistory(
  rows: { action: string; createdAt: number; actorUserId?: string }[],
): { label: string; at: string }[] {
  return rows.map((row) => ({
    label: row.action.replace(/\./g, ' · '),
    at: new Date(row.createdAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  }));
}
