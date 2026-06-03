import type { Doc } from '../../../../../convex/_generated/dataModel';

export type UserTypeFilter = 'all' | 'subscriber' | 'creator' | 'admin';
export type UserAccountFilter = 'all' | 'active' | 'inactive';

export const USER_TYPE_FILTERS: { value: UserTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'subscriber', label: 'Subscribers' },
  { value: 'creator', label: 'Creators' },
  { value: 'admin', label: 'Admins' },
];

export const USER_ACCOUNT_FILTERS: { value: UserAccountFilter; label: string }[] = [
  { value: 'all', label: 'Account: all' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export type UserStatusTone = 'green' | 'amber' | 'red' | 'mute';

const ADMIN_ROLES = new Set(['super_admin', 'tenant_admin', 'admin', 'moderator']);

export function parseUserType(value: string | null): UserTypeFilter {
  if (value === 'subscriber' || value === 'creator' || value === 'admin') return value;
  return 'all';
}

export function parseAccountFilter(value: string | null): UserAccountFilter {
  if (value === 'active' || value === 'inactive') return value;
  return 'all';
}

export function userTypeLabel(role: string | undefined, creatorId: string | undefined): string {
  if (creatorId) return 'Creator';
  if (role && ADMIN_ROLES.has(role)) return formatRole(role);
  return 'Subscriber';
}

export function formatRole(role: string | undefined): string {
  if (!role) return 'User';
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function accountStatus(user: { isActive: boolean; pastDueCount?: number }): {
  label: string;
  tone: UserStatusTone;
} {
  if (!user.isActive) return { label: 'Inactive', tone: 'red' };
  if ((user.pastDueCount ?? 0) > 0) return { label: 'Billing issue', tone: 'amber' };
  return { label: 'Active', tone: 'green' };
}

export function formatJoinedLabel(ms: number | undefined): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatAdminDateTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Display name for UI — never duplicates the full email when a real name is missing. */
export function displayUserName(name: string | undefined, email: string | undefined): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const mail = email?.trim();
  if (mail) {
    const local = mail.split('@')[0]?.trim();
    if (local) return local;
  }
  return 'Unnamed user';
}

export function monogram(name: string | undefined, email: string | undefined): string {
  const source = name?.trim() || email?.trim() || '?';
  return source
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export type UserListRow = {
  _id: string;
  email?: string;
  name?: string;
  role?: string;
  creatorId?: string;
  creatorHandle?: string;
  isActive: boolean;
  lastLoginAt?: number;
  joinedAt?: number;
  subscriptionCount: number;
  activeSubscriptionCount: number;
  pastDueCount: number;
};

export function matchesUserFilters(
  user: UserListRow,
  search: string,
  type: UserTypeFilter,
  account: UserAccountFilter,
  quick?: 'billing' | null,
): boolean {
  if (type === 'creator' && !user.creatorId) return false;
  if (type === 'admin' && !(user.role && ADMIN_ROLES.has(user.role))) return false;
  if (type === 'subscriber' && (user.creatorId || (user.role && ADMIN_ROLES.has(user.role)))) {
    return false;
  }
  if (account === 'active' && !user.isActive) return false;
  if (account === 'inactive' && user.isActive) return false;
  if (quick === 'billing' && user.pastDueCount <= 0) return false;

  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    user.email?.toLowerCase().includes(q) ||
    user.name?.toLowerCase().includes(q) ||
    user.creatorHandle?.toLowerCase().includes(q) ||
    user._id.includes(q)
  );
}

export function auditToHistory(
  rows: { action: string; createdAt: number }[],
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
