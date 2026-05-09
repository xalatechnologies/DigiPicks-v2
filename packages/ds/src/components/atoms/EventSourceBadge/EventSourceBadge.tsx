import React from 'react';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';

export type EventSourceType =
  | 'provider'
  | 'sport_source'
  | 'federation'
  | 'platform'
  | 'creator'
  | 'community';

export interface EventSourceBadgeProps {
  source: EventSourceType;
  className?: string;
}

export const EventSourceBadge: React.FC<EventSourceBadgeProps> = ({
  source,
  className,
}) => {
  if (source === 'provider') return null;

  if (source === 'creator') {
    return (
      <Badge tone="blue" icon={<Icon name="user" size={11} />} className={className}>
        Creator
      </Badge>
    );
  }
  if (source === 'platform') {
    return (
      <Badge tone="violet" icon={<Icon name="sparkles" size={11} />} className={className}>
        Platform
      </Badge>
    );
  }
  if (source === 'sport_source') {
    return (
      <Badge tone="green" icon={<Icon name="verified" size={11} />} className={className}>
        Source
      </Badge>
    );
  }
  if (source === 'federation') {
    return (
      <Badge tone="amber" icon={<Icon name="shield" size={11} />} className={className}>
        Federation
      </Badge>
    );
  }
  if (source === 'community') {
    return (
      <Badge tone="mute" icon={<Icon name="users" size={11} />} className={className}>
        Community
      </Badge>
    );
  }
  return null;
};
