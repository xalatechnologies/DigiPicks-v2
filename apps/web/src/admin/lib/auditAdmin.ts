export const AUDIT_ENTITY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'user', label: 'Users' },
  { value: 'creator', label: 'Creators' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'billingCase', label: 'Billing' },
  { value: 'dispute', label: 'Disputes' },
  { value: 'campaign', label: 'Campaigns' },
  { value: 'application', label: 'Applications' },
] as const;

export type AuditEntityFilter = (typeof AUDIT_ENTITY_FILTERS)[number]['value'];

export function parseAuditEntity(raw: string | null): AuditEntityFilter {
  const found = AUDIT_ENTITY_FILTERS.find((f) => f.value === raw);
  return found?.value ?? 'all';
}

export function formatAuditTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function matchesAuditSearch(
  row: { action: string; entityType: string; entityId?: string },
  search: string,
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const hay = [row.action, row.entityType, row.entityId ?? ''].join(' ').toLowerCase();
  return hay.includes(q);
}
