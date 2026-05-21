export type ModerationTypeFilter = 'all' | 'event' | 'application' | 'dispute' | 'billing';

export const MODERATION_TYPE_FILTERS: { value: ModerationTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'event', label: 'Events' },
  { value: 'application', label: 'Applications' },
  { value: 'dispute', label: 'Disputes' },
  { value: 'billing', label: 'Billing' },
];

export function parseModerationType(raw: string | null): ModerationTypeFilter {
  if (raw === 'event' || raw === 'application' || raw === 'dispute' || raw === 'billing') {
    return raw;
  }
  return 'all';
}

export type ModerationQueueItem = {
  key: string;
  itemType: 'event' | 'application' | 'dispute' | 'billing';
  entityId: string;
  subject: string;
  creatorLabel: string;
  reason: string;
  severity: 'critical' | 'high' | 'normal';
  status: string;
  createdAt: number;
  detail?: string;
};

export function itemTypeLabel(type: ModerationQueueItem['itemType']): string {
  switch (type) {
    case 'event':
      return 'Event';
    case 'application':
      return 'Application';
    case 'dispute':
      return 'Pick dispute';
    case 'billing':
      return 'Billing case';
    default:
      return type;
  }
}

export function severityTone(severity: ModerationQueueItem['severity']): 'red' | 'amber' | 'mute' {
  if (severity === 'critical') return 'red';
  if (severity === 'high') return 'amber';
  return 'mute';
}

export function formatFlaggedAt(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function matchesModerationSearch(item: ModerationQueueItem, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    item.subject,
    item.creatorLabel,
    item.reason,
    item.status,
    item.detail ?? '',
    itemTypeLabel(item.itemType),
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}
