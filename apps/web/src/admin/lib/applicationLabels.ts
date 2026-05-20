/** Admin applications queue tab (Stitch zip 73). */
export type ApplicationQueueTab = 'pending' | 'review' | 'approved' | 'rejected';

export const APPLICATION_QUEUE_TABS: { value: ApplicationQueueTab; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'review', label: 'In review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export type ApplicationConvexStatus =
  | 'submitted'
  | 'review'
  | 'more_info'
  | 'flagged'
  | 'approved'
  | 'rejected';

export function applicationStatusLabel(status: ApplicationConvexStatus | string): string {
  switch (status) {
    case 'submitted':
      return 'Pending';
    case 'review':
      return 'In review';
    case 'more_info':
      return 'More info';
    case 'flagged':
      return 'Flagged';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}

export type ApplicationBadgeTone = 'blue' | 'green' | 'red' | 'amber' | 'mute';

export function applicationStatusTone(
  status: ApplicationConvexStatus | string,
): ApplicationBadgeTone {
  switch (status) {
    case 'submitted':
      return 'blue';
    case 'review':
      return 'amber';
    case 'more_info':
      return 'amber';
    case 'flagged':
      return 'red';
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    default:
      return 'mute';
  }
}

export function monogramFromName(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function nicheLabel(sport: string, niche: string): string {
  return `${sport} · ${niche}`;
}

export function professionalOverview(parts: {
  niche: string;
  sport: string;
  winClaim?: string;
}): string {
  const lines = [`${parts.niche} creator focused on ${parts.sport}.`];
  if (parts.winClaim?.trim()) {
    lines.push(parts.winClaim.trim());
  }
  return lines.join(' ');
}
