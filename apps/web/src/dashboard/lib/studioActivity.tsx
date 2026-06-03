import type { ActivityFeedItemData, ActivityFeedTone } from '@digipicks/ds';
import type { IconName } from '@digipicks/ds';
import { Serif } from '@digipicks/ds';
import React from 'react';

export type StudioActivityItem = {
  id: string;
  kind: 'pick' | 'subscription' | 'payout';
  title: string;
  sub?: string;
  at: number;
  amountLabel?: string;
};

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} minutes ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hours ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} days ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function iconForKind(kind: StudioActivityItem['kind']): IconName {
  if (kind === 'pick') return 'feed';
  if (kind === 'payout') return 'card';
  return 'users';
}

function toneForKind(kind: StudioActivityItem['kind'], sub?: string): ActivityFeedTone {
  if (kind === 'pick') return 'primary';
  if (sub?.includes('cancelled')) return 'muted';
  return 'success';
}

export function mapStudioActivityFeed(
  items: StudioActivityItem[],
  routes: { picks: string; subscribers: string; payouts: string },
  navigate: (path: string) => void,
): ActivityFeedItemData[] {
  return items.map((item) => {
    const onClick =
      item.kind === 'pick'
        ? () => navigate(routes.picks)
        : item.kind === 'payout'
          ? () => navigate(routes.payouts)
          : () => navigate(routes.subscribers);

    return {
      id: item.id,
      icon: iconForKind(item.kind),
      tone: toneForKind(item.kind, item.sub),
      title: (
        <>
          {item.kind === 'pick' ? 'Pick: ' : item.kind === 'subscription' ? 'Subscriber: ' : ''}
          <Serif>{item.title}</Serif>
        </>
      ),
      sub: item.sub,
      time: formatRelativeTime(item.at),
      amount: item.amountLabel,
      onClick,
    };
  });
}
