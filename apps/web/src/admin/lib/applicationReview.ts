import type {
  AdminApplicationStatusTone,
  ApplicationReviewDrawerApplicant,
  ApplicationReviewHistoryItem,
} from '@digipicks/ds';
import type { Doc } from '../../../../../convex/_generated/dataModel';

export type ApplicationStatus =
  | 'submitted'
  | 'review'
  | 'more_info'
  | 'flagged'
  | 'approved'
  | 'rejected';

export const APPLICATION_STATUS_FILTERS: { value: ApplicationStatus; label: string }[] = [
  { value: 'submitted', label: 'Pending' },
  { value: 'review', label: 'In review' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'more_info', label: 'More info' },
];

export function parseApplicationStatus(raw: string | null): ApplicationStatus {
  const allowed = new Set(APPLICATION_STATUS_FILTERS.map((f) => f.value));
  if (raw && allowed.has(raw as ApplicationStatus)) {
    return raw as ApplicationStatus;
  }
  return 'submitted';
}

export function formatSubmittedLabel(submittedAt: number): string {
  const diff = Date.now() - submittedAt;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export function tableStatusTone(
  tone: ApplicationReviewDrawerApplicant['statusTone'],
): AdminApplicationStatusTone {
  if (tone === 'gold') return 'amber';
  if (
    tone === 'blue' ||
    tone === 'green' ||
    tone === 'red' ||
    tone === 'amber' ||
    tone === 'violet'
  ) {
    return tone;
  }
  return 'mute';
}

export function statusDisplay(status: ApplicationStatus): {
  label: string;
  tone: ApplicationReviewDrawerApplicant['statusTone'];
} {
  switch (status) {
    case 'submitted':
      return { label: 'Pending', tone: 'amber' };
    case 'review':
      return { label: 'In review', tone: 'blue' };
    case 'more_info':
      return { label: 'More info', tone: 'violet' };
    case 'flagged':
      return { label: 'Flagged', tone: 'red' };
    case 'approved':
      return { label: 'Approved', tone: 'green' };
    case 'rejected':
      return { label: 'Rejected', tone: 'red' };
    default:
      return { label: status, tone: 'mute' };
  }
}

export function nicheChip(sport: string, niche: string): string {
  const base = niche.trim() || sport.trim();
  return base.length > 28 ? `${base.slice(0, 26)}…` : base;
}

export function buildApplicantOverview(app: Doc<'applications'>): string {
  const parts = [
    app.winClaim ? `Win claim: ${app.winClaim}.` : null,
    app.existingFollowing ? `Declared audience: ${app.existingFollowing}.` : null,
    app.priceHint ? `Suggested pricing: ${app.priceHint}.` : null,
    `${app.sport} · ${app.niche}`,
  ].filter(Boolean);
  return parts.join(' ');
}

export function toDrawerApplicant(app: Doc<'applications'>): ApplicationReviewDrawerApplicant {
  const display = statusDisplay(app.status as ApplicationStatus);
  return {
    name: app.name,
    handle: app.handle,
    email: app.email,
    sport: app.sport,
    niche: app.niche,
    nicheChip: nicheChip(app.sport, app.niche),
    status: app.status,
    statusLabel: display.label,
    statusTone: display.tone,
    submittedLabel: formatSubmittedLabel(app.submittedAt),
    overview: buildApplicantOverview(app),
    existingFollowing: app.existingFollowing,
    priceHint: app.priceHint,
    proofCount: app.proofCount,
    winClaim: app.winClaim,
    reviewNotes: app.reviewNotes,
    aiScore: app.aiAuthenticityScore,
    aiReasoning: app.aiAuthenticityReasoning,
  };
}

export function auditToHistory(
  rows: Array<{ _id: string; action: string; createdAt: number }>,
): ApplicationReviewHistoryItem[] {
  return rows.map((row) => ({
    id: row._id,
    action: row.action.replace(/\./g, ' · '),
    timeLabel: formatSubmittedLabel(row.createdAt),
  }));
}

export function matchesApplicationSearch(
  app: Doc<'applications'>,
  query: string,
  nicheFilter: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (nicheFilter !== 'all' && app.sport.toLowerCase() !== nicheFilter.toLowerCase()) {
    return false;
  }
  if (!q) return true;
  return (
    app.name.toLowerCase().includes(q) ||
    app.handle.toLowerCase().includes(q) ||
    app.email.toLowerCase().includes(q) ||
    app.niche.toLowerCase().includes(q)
  );
}
