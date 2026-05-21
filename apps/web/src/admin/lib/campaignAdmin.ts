import type { IconName } from '@digipicks/ds';

export type CampaignStatusFilter = 'all' | 'draft' | 'scheduled' | 'sent';
export type CampaignChannelFilter = 'all' | 'email' | 'push' | 'in_app';

export const CAMPAIGN_STATUS_FILTERS: { value: CampaignStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'sent', label: 'Sent' },
];

export const CAMPAIGN_CHANNEL_FILTERS: { value: CampaignChannelFilter; label: string }[] = [
  { value: 'all', label: 'All channels' },
  { value: 'email', label: 'Email' },
  { value: 'push', label: 'Push' },
  { value: 'in_app', label: 'In-app' },
];

export const CAMPAIGN_TEMPLATES = [
  { id: 'billing', title: 'Billing issue', category: 'Transactional', icon: 'card' as IconName },
  {
    id: 'approved',
    title: 'Creator approved',
    category: 'Onboarding',
    icon: 'verified' as IconName,
  },
  { id: 'rejected', title: 'Application update', category: 'Outbound', icon: 'flag' as IconName },
  { id: 'maintenance', title: 'Maintenance', category: 'System alert', icon: 'gear' as IconName },
] as const;

export function parseCampaignStatus(raw: string | null): CampaignStatusFilter {
  if (raw === 'draft' || raw === 'scheduled' || raw === 'sent') return raw;
  return 'all';
}

export function parseCampaignChannel(raw: string | null): CampaignChannelFilter {
  if (raw === 'email' || raw === 'push' || raw === 'in_app') return raw;
  return 'all';
}

export type CampaignRow = {
  _id: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  createdByLabel: string;
  scheduledLabel: string;
  sentLabel: string;
};

export function channelLabel(channel: string): string {
  switch (channel) {
    case 'email':
      return 'Email';
    case 'push':
      return 'Push';
    case 'in_app':
      return 'In-app';
    default:
      return channel;
  }
}

export function channelIcon(channel: string): IconName {
  switch (channel) {
    case 'email':
      return 'message';
    case 'push':
      return 'bell';
    case 'in_app':
      return 'inbox';
    default:
      return 'megaphone';
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'scheduled':
      return 'Scheduled';
    case 'sent':
      return 'Sent';
    default:
      return status;
  }
}

export function statusTone(status: string): 'green' | 'amber' | 'mute' {
  switch (status) {
    case 'sent':
      return 'green';
    case 'scheduled':
      return 'amber';
    default:
      return 'mute';
  }
}

export function matchesCampaignFilters(
  row: CampaignRow,
  search: string,
  status: CampaignStatusFilter,
  channel: CampaignChannelFilter,
): boolean {
  if (status !== 'all' && row.status !== status) return false;
  if (channel !== 'all' && row.channel !== channel) return false;

  const q = search.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    row.title,
    row.body,
    row.createdByLabel,
    channelLabel(row.channel),
    statusLabel(row.status),
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}
