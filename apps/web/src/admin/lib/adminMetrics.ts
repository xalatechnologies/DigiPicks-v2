import type {
  ActivityFeedItemData,
  AdminActionPanelItem,
  InsightTone,
  StudioSummaryGridItem,
} from '@digipicks/ds';
import type { NavigateFunction } from 'react-router-dom';
import { ADMIN } from './adminRoutes';

type OverviewKpis = {
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

export function buildAdminKpiRows(
  kpis: OverviewKpis,
  capped: OverviewCapped,
  navigate: NavigateFunction,
): StudioSummaryGridItem[] {
  const suffix = cappedSuffix(capped);

  return [
    {
      id: 'users',
      icon: 'users',
      iconTone: 'primary',
      label: 'Total users',
      value: `${kpis.totalUsers.toLocaleString()}${suffix}`,
    },
    {
      id: 'subs',
      icon: 'card',
      iconTone: 'violet',
      label: 'Active subs',
      value: `${kpis.activeSubscribers.toLocaleString()}${capped.subscriptions ? '+' : ''}`,
    },
    {
      id: 'creators',
      icon: 'verified',
      iconTone: 'primary',
      label: 'Creators',
      value: `${kpis.activeCreators.toLocaleString()}${capped.creators ? '+' : ''}`,
    },
    {
      id: 'applications',
      icon: 'user',
      iconTone: kpis.pendingApplications > 0 ? 'amber' : 'primary',
      label: 'Applications',
      value: String(kpis.pendingApplications),
      delta: kpis.pendingApplications > 0 ? { value: 'Queue', dir: 'up' as const } : undefined,
      onClick: () => navigate(`${ADMIN.applications}?status=submitted`),
    },
    {
      id: 'mrr',
      icon: 'dollar',
      iconTone: 'amber',
      label: 'MRR',
      value: kpis.mrr === null ? '—' : `$${kpis.mrr.toLocaleString()}`,
    },
    {
      id: 'churn',
      icon: 'chart',
      iconTone: 'danger',
      label: 'Churn',
      value: kpis.churnRate === null ? '—' : `${kpis.churnRate}%`,
    },
    {
      id: 'flagged',
      icon: 'flag',
      iconTone: 'danger',
      label: 'Flagged',
      value: String(kpis.flaggedApplications),
      delta: kpis.flaggedApplications > 0 ? { value: 'Review', dir: 'up' as const } : undefined,
    },
    {
      id: 'tickets',
      icon: 'inbox',
      iconTone: kpis.openTickets > 0 ? 'danger' : 'primary',
      label: 'Tickets',
      value: String(kpis.openTickets),
      onClick: () => navigate(ADMIN.disputes),
    },
  ];
}

const ACTIVITY_ICON: Record<string, ActivityFeedItemData['icon']> = {
  application: 'user',
  dispute: 'shield',
  pick: 'feed',
  event: 'calendar',
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
      onClick = () => navigate(ADMIN.disputes);
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

const ALERT_TONE: Record<OverviewAlert['tone'], InsightTone> = {
  amber: 'amber',
  danger: 'red',
  primary: 'blue',
};

export type AdminAlertView = {
  id: string;
  tone: InsightTone;
  title: string;
  sub: string;
  onOpen?: () => void;
};

export function buildAdminAlerts(
  alerts: OverviewAlert[],
  navigate: NavigateFunction,
): AdminAlertView[] {
  return alerts.map((alert) => {
    let onOpen: (() => void) | undefined;
    if (alert.id === 'applications' || alert.id === 'flagged-apps') {
      onOpen = () => navigate(`${ADMIN.applications}?status=submitted`);
    } else if (alert.id === 'events') {
      onOpen = () => navigate(ADMIN.eventsReview);
    } else if (alert.id === 'disputes') {
      onOpen = () => navigate(ADMIN.disputes);
    }

    return {
      id: alert.id,
      tone: ALERT_TONE[alert.tone],
      title: alert.title,
      sub: alert.sub,
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
      variant: 'primary',
    },
    {
      id: 'events',
      label: 'Review flagged content',
      onClick: () => navigate(ADMIN.eventsReview),
    },
    {
      id: 'disputes',
      label: 'Support & disputes',
      onClick: () => navigate(ADMIN.disputes),
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
