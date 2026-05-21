import type {
  ActivityFeedItemData,
  AdminActionPanelItem,
  AdminCriticalAlertItem,
  AdminMetricStripItem,
} from '@digipicks/ds';
import type { NavigateFunction } from 'react-router-dom';
import { ADMIN } from './adminRoutes';

export type OverviewKpis = {
  totalUsers: number;
  activeSubscribers: number;
  activeCreators: number;
  pendingApplications: number;
  flaggedApplications: number;
  pendingEventReview: number;
  openTickets: number;
  mrr: number | null;
  churnRate: number | null;
};

type OverviewCapped = {
  users: boolean;
  subscriptions: boolean;
  creators: boolean;
};

type OverviewActivity = {
  id: string;
  action: string;
  entityType: string;
  timeLabel: string;
  title: string;
  sub: string;
};

type OverviewAlert = {
  id: string;
  tone: 'amber' | 'danger' | 'primary';
  title: string;
  sub: string;
};

function cappedSuffix(capped: OverviewCapped): string {
  if (capped.users || capped.subscriptions || capped.creators) {
    return '+';
  }
  return '';
}

export function buildAdminKpiStrip(
  kpis: OverviewKpis,
  capped: OverviewCapped,
  navigate: NavigateFunction,
): AdminMetricStripItem[] {
  const suffix = cappedSuffix(capped);

  return [
    {
      id: 'users',
      label: 'Total users',
      value: `${kpis.totalUsers.toLocaleString()}${suffix}`,
    },
    {
      id: 'subs',
      label: 'Active subs',
      value: `${kpis.activeSubscribers.toLocaleString()}${capped.subscriptions ? '+' : ''}`,
    },
    {
      id: 'creators',
      label: 'Creators',
      value: `${kpis.activeCreators.toLocaleString()}${capped.creators ? '+' : ''}`,
      badge:
        kpis.activeCreators > 0
          ? { text: 'Active on platform', tone: 'primary' }
          : { text: 'None live yet', tone: 'muted' },
    },
    {
      id: 'applications',
      label: 'Applications',
      value: String(kpis.pendingApplications),
      badge:
        kpis.pendingApplications > 0
          ? { text: 'Urgent', tone: 'urgent' }
          : { text: 'Queue clear', tone: 'muted' },
      onClick:
        kpis.pendingApplications > 0
          ? () => navigate(`${ADMIN.applications}?status=submitted`)
          : undefined,
    },
    {
      id: 'mrr',
      label: 'MRR',
      value: kpis.mrr === null ? '—' : `$${kpis.mrr.toLocaleString()}`,
      badge: kpis.mrr === null ? { text: 'Stripe not connected', tone: 'muted' } : undefined,
    },
    {
      id: 'churn',
      label: 'Churn',
      value: kpis.churnRate === null ? '—' : `${kpis.churnRate}%`,
      badge: kpis.churnRate === null ? { text: 'Needs billing data', tone: 'muted' } : undefined,
    },
    {
      id: 'flagged',
      label: 'Flagged',
      value: String(kpis.flaggedApplications),
      badge:
        kpis.flaggedApplications > 0
          ? { text: 'Review needed', tone: 'muted' }
          : { text: 'None flagged', tone: 'muted' },
      onClick:
        kpis.flaggedApplications > 0
          ? () => navigate(`${ADMIN.applications}?status=flagged`)
          : undefined,
    },
    {
      id: 'tickets',
      label: 'Tickets',
      value: String(kpis.openTickets),
      badge:
        kpis.openTickets > 0
          ? { text: 'Open queue', tone: 'priority' }
          : { text: 'Inbox clear', tone: 'muted' },
      onClick: kpis.openTickets > 0 ? () => navigate(ADMIN.support) : undefined,
    },
  ];
}

const ACTIVITY_ICON: Record<string, ActivityFeedItemData['icon']> = {
  application: 'user',
  dispute: 'shield',
  pick: 'feed',
  event: 'calendar',
  user: 'users',
};

const ACTIVITY_TONE: Record<string, ActivityFeedItemData['tone']> = {
  'application.submitted': 'primary',
  'application.approved': 'success',
  'application.rejected': 'muted',
  'dispute.opened': 'info',
};

export function buildAdminActivityItems(
  rows: OverviewActivity[],
  navigate: NavigateFunction,
): ActivityFeedItemData[] {
  return rows.map((row) => {
    const tone = ACTIVITY_TONE[row.action] ?? 'muted';
    const icon = ACTIVITY_ICON[row.entityType] ?? 'audit';

    let onClick: (() => void) | undefined;
    if (row.entityType === 'application') {
      onClick = () => navigate(ADMIN.applications);
    } else if (row.entityType === 'dispute') {
      onClick = () => navigate(ADMIN.support);
    } else if (row.entityType === 'event') {
      onClick = () => navigate(ADMIN.eventsReview);
    }

    return {
      id: row.id,
      icon,
      tone,
      title: row.title,
      sub: row.sub,
      time: row.timeLabel,
      trailingIcon: onClick ? 'chevron-right' : undefined,
      onClick,
    };
  });
}

const ALERT_EYEBROW: Record<string, string> = {
  applications: 'Onboarding',
  'flagged-apps': 'Trust & safety',
  events: 'Content',
  disputes: 'Support',
  stripe: 'Infrastructure',
};

const ALERT_TONE_MAP: Record<OverviewAlert['tone'], AdminCriticalAlertItem['tone']> = {
  amber: 'amber',
  danger: 'danger',
  primary: 'primary',
};

export function buildAdminCriticalAlerts(
  alerts: OverviewAlert[],
  navigate: NavigateFunction,
): AdminCriticalAlertItem[] {
  return alerts.map((alert) => {
    let onOpen: (() => void) | undefined;
    if (alert.id === 'applications' || alert.id === 'flagged-apps') {
      onOpen = () => navigate(`${ADMIN.applications}?status=submitted`);
    } else if (alert.id === 'events') {
      onOpen = () => navigate(ADMIN.eventsReview);
    } else if (alert.id === 'disputes') {
      onOpen = () => navigate(ADMIN.support);
    }

    return {
      id: alert.id,
      eyebrow: ALERT_EYEBROW[alert.id] ?? 'Operations',
      title: alert.title,
      sub: alert.sub,
      tone: ALERT_TONE_MAP[alert.tone],
      onOpen,
    };
  });
}

export function buildAdminQuickActions(navigate: NavigateFunction): AdminActionPanelItem[] {
  return [
    {
      id: 'applications',
      label: 'Review applications',
      onClick: () => navigate(`${ADMIN.applications}?status=submitted`),
    },
    {
      id: 'events',
      label: 'Review flagged content',
      onClick: () => navigate(ADMIN.eventsReview),
    },
    {
      id: 'disputes',
      label: 'Support & disputes',
      onClick: () => navigate(ADMIN.support),
    },
    {
      id: 'coupons',
      label: 'Promo coupons',
      onClick: () => navigate(ADMIN.coupons),
    },
    {
      id: 'suspend',
      label: 'Suspend creator',
      disabled: true,
    },
    {
      id: 'broadcast',
      label: 'Broadcast announcement',
      disabled: true,
    },
    {
      id: 'financial',
      label: 'Financial report',
      variant: 'primary',
      disabled: true,
    },
  ];
}
