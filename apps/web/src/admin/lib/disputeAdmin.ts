export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export function disputeStatusLabel(status: string): string {
  switch (status) {
    case 'open':
      return 'Open';
    case 'under_review':
      return 'In progress';
    case 'resolved':
      return 'Resolved';
    case 'dismissed':
      return 'Dismissed';
    default:
      return status;
  }
}

export function disputeStatusTone(status: string): 'green' | 'amber' | 'red' | 'mute' {
  switch (status) {
    case 'resolved':
      return 'green';
    case 'dismissed':
      return 'red';
    case 'under_review':
      return 'amber';
    default:
      return 'mute';
  }
}

export function fmtDisputeTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
