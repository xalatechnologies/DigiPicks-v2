export type BillingCaseStatus =
  | 'open'
  | 'under_review'
  | 'pending_finance'
  | 'escalated'
  | 'refunded'
  | 'denied'
  | 'closed';

export function billingStatusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function billingStatusTone(status: string): 'green' | 'amber' | 'red' | 'mute' {
  switch (status) {
    case 'refunded':
      return 'green';
    case 'denied':
    case 'closed':
      return 'mute';
    case 'escalated':
      return 'red';
    default:
      return 'amber';
  }
}

export function fmtBillingNoteTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
