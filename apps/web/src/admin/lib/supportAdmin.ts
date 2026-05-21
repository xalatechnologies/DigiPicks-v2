import type { AdminSupportRow, AdminSupportStatusTone } from '@digipicks/ds';

export type SupportQueueFilter = 'all' | 'pick' | 'billing' | 'chargeback';

export const SUPPORT_QUEUE_FILTERS: { value: SupportQueueFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pick', label: 'Pick disputes' },
  { value: 'billing', label: 'Billing disputes' },
  { value: 'chargeback', label: 'Chargebacks' },
];

export function parseSupportQueue(
  raw: string | null,
  preset?: SupportQueueFilter,
): SupportQueueFilter {
  if (preset) return preset;
  if (raw === 'pick' || raw === 'billing' || raw === 'chargeback') return raw;
  return 'all';
}

export function parseSupportKind(raw: string | null): 'pick' | 'billing' | null {
  if (raw === 'pick' || raw === 'billing') return raw;
  return null;
}

export type SupportHubRow = {
  kind: 'pick' | 'billing';
  id: string;
  ticketLabel: string;
  partyName: string;
  partyRole: string;
  issueLabel: string;
  priorityLabel: string;
  priorityTone: 'urgent' | 'normal';
  status: string;
  statusLabel: string;
  statusTone: AdminSupportStatusTone;
  createdAt: number;
  createdLabel: string;
  slaAtRisk: boolean;
};

export function toSupportTableRows(rows: SupportHubRow[]): AdminSupportRow[] {
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    ticketLabel: row.ticketLabel,
    partyName: row.partyName,
    partyRole: row.partyRole,
    issueLabel: row.issueLabel,
    priorityLabel: row.priorityLabel,
    priorityUrgent: row.priorityTone === 'urgent',
    statusLabel: row.statusLabel,
    statusTone: row.statusTone,
    createdLabel: row.createdLabel,
    slaAtRisk: row.slaAtRisk,
  }));
}

export function matchesSupportSearch(row: SupportHubRow, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    row.ticketLabel,
    row.partyName,
    row.partyRole,
    row.issueLabel,
    row.statusLabel,
    row.priorityLabel,
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}
