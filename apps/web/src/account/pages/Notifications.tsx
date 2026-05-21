import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Button,
  EmptyState,
  StudioPageHeader,
  StudioDashLayout,
  StudioDashCol,
  AccountRefineCard,
  StudioFilterPills,
  Muted,
  NotificationInboxCard,
  type NotificationInboxIconTone,
  AccountNotificationSidebar,
} from '@digipicks/ds';
import type { IconName } from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

type NotifyFilter = 'all' | 'picks' | 'subscription' | 'events' | 'platform';

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'New picks', value: 'picks' },
  { label: 'Subscription updates', value: 'subscription' },
  { label: 'Events', value: 'events' },
  { label: 'Platform', value: 'platform' },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function matchesFilter(type: string, filter: NotifyFilter): boolean {
  switch (filter) {
    case 'picks':
      return type === 'pick_published' || type === 'pick_graded';
    case 'subscription':
      return type.startsWith('subscription_');
    case 'events':
      return type === 'line_moved';
    case 'platform':
      return type === 'welcome';
    case 'all':
    default:
      return true;
  }
}

function presentation(type: string): {
  icon: IconName;
  iconTone: NotificationInboxIconTone;
  badge?: string;
  ctaLabel: string;
} {
  switch (type) {
    case 'pick_published':
      return {
        icon: 'tag',
        iconTone: 'primary',
        badge: 'Expert insight',
        ctaLabel: 'View pick',
      };
    case 'pick_graded':
      return {
        icon: 'check',
        iconTone: 'primary',
        badge: 'Result',
        ctaLabel: 'View result',
      };
    case 'subscription_active':
      return {
        icon: 'card',
        iconTone: 'secondary',
        ctaLabel: 'View receipt',
      };
    case 'subscription_past_due':
      return {
        icon: 'card',
        iconTone: 'secondary',
        badge: 'Billing',
        ctaLabel: 'Update payment',
      };
    case 'subscription_cancelled':
      return {
        icon: 'card',
        iconTone: 'muted',
        ctaLabel: 'Manage plan',
      };
    case 'line_moved':
      return {
        icon: 'clock',
        iconTone: 'muted',
        ctaLabel: 'Explore picks',
      };
    case 'welcome':
    default:
      return {
        icon: 'megaphone',
        iconTone: 'primary',
        ctaLabel: 'Learn more',
      };
  }
}

function navigateForType(navigate: ReturnType<typeof useNavigate>, type: string): void {
  switch (type) {
    case 'pick_graded':
      navigate('/account/results');
      break;
    case 'pick_published':
    case 'line_moved':
      navigate('/account');
      break;
    case 'subscription_active':
    case 'subscription_cancelled':
      navigate('/account/subscriptions');
      break;
    case 'subscription_past_due':
      navigate('/account/billing/payment-issue');
      break;
    default:
      navigate('/account/settings');
  }
}

export function Notifications() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<NotifyFilter>('all');

  const me = useQuery(api.users.meSafe);
  const notifications = useQuery(api.notifications.listMine, { limit: 100 });
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const isLoading = notifications === undefined;
  const items = notifications ?? [];

  const filtered = useMemo(
    () => items.filter((n) => matchesFilter(n.type, filter)),
    [items, filter],
  );

  const unreadInView = filtered.filter((n) => n.readAt === undefined);
  const firstUnread = unreadInView[0];

  const engagementPercent = useMemo(() => {
    const weekAgo = Date.now() - WEEK_MS;
    const recent = items.filter((n) => n.createdAt >= weekAgo);
    if (recent.length === 0) return 0;
    const acted = recent.filter((n) => n.readAt !== undefined).length;
    return Math.round((acted / recent.length) * 100);
  }, [items]);

  const prefs = me?.notifyPrefs;

  const channels = useMemo(
    () => [
      {
        id: 'email',
        label: 'Email',
        icon: 'message' as const,
        active: prefs?.email === true,
        muted: false,
      },
      {
        id: 'inapp',
        label: 'In-app',
        icon: 'bell' as const,
        active: true,
      },
      {
        id: 'push',
        label: 'Push',
        icon: 'megaphone' as const,
        active: prefs?.push === true,
        muted: prefs?.push !== true,
      },
    ],
    [prefs],
  );

  async function handleMarkRead(id: Id<'notifications'>) {
    try {
      await markRead({ id });
    } catch {
      /* useQuery recovers */
    }
  }

  async function handleMarkFirstRead() {
    if (!firstUnread) return;
    await handleMarkRead(firstUnread._id);
  }

  async function handleMarkAll() {
    try {
      await markAllRead({});
    } catch {
      /* useQuery recovers */
    }
  }

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Account · Inbox"
          title="Notifications"
          sub="Stay updated on picks, creators, and subscription activity."
          actions={
            <Button
              variant="outline"
              size="sm"
              disabled={unreadInView.length === 0}
              onClick={handleMarkAll}
            >
              Mark all as read
            </Button>
          }
        />

        <AccountRefineCard
          title="Refine inbox"
          sub="Filter by type, then mark items read in bulk."
          footer={
            <Row between wrap>
              <Muted>
                {isLoading
                  ? 'Loading notifications…'
                  : `${filtered.length} notification${filtered.length === 1 ? '' : 's'} · ${unreadInView.length} unread`}
              </Muted>
              <Row gap={3}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!firstUnread}
                  onClick={handleMarkFirstRead}
                >
                  Mark as read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={unreadInView.length === 0}
                  onClick={handleMarkAll}
                >
                  Mark all as read
                </Button>
              </Row>
            </Row>
          }
        >
          <StudioFilterPills
            options={FILTER_OPTIONS}
            value={filter}
            onChange={(v) => setFilter(v as NotifyFilter)}
            ariaLabel="Filter notifications"
            nowrap
          />
        </AccountRefineCard>

        <StudioDashLayout>
          <StudioDashCol span={8}>
            <Stack gap={4}>
              {isLoading && <EmptyState icon="bell" title="Loading notifications…" />}

              {!isLoading && filtered.length === 0 && (
                <EmptyState
                  icon="bell"
                  title="You're all caught up."
                  subtitle="No notifications in this view. We'll surface new picks, billing, and platform updates here."
                />
              )}

              {!isLoading && filtered.length > 0 && (
                <Stack gap={4}>
                  {filtered.map((n) => {
                    const unread = n.readAt === undefined;
                    const view = presentation(n.type);
                    return (
                      <NotificationInboxCard
                        key={n._id}
                        title={n.title}
                        body={n.body}
                        timeLabel={timeAgo(n.createdAt)}
                        unread={unread}
                        badge={view.badge}
                        icon={view.icon}
                        iconTone={view.iconTone}
                        ctaLabel={view.ctaLabel}
                        onCta={() => navigateForType(navigate, n.type)}
                        onMarkRead={unread ? () => handleMarkRead(n._id) : undefined}
                      />
                    );
                  })}
                </Stack>
              )}
            </Stack>
          </StudioDashCol>

          <StudioDashCol span={4}>
            <AccountNotificationSidebar
              channels={channels}
              engagementPercent={items.length > 0 ? engagementPercent : undefined}
              onManagePreferences={() => navigate('/account/settings')}
            />
          </StudioDashCol>
        </StudioDashLayout>
      </Stack>
    </Container>
  );
}
