import React from 'react';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';

export type AccessLevel = 'free' | 'premium' | 'vip';

export interface AccessBadgeProps {
  access: AccessLevel;
  className?: string;
}

export const AccessBadge: React.FC<AccessBadgeProps> = ({ access, className }) => {
  if (access === 'free') {
    return (
      <Badge tone="mute" className={className}>
        Free
      </Badge>
    );
  }
  if (access === 'premium') {
    return (
      <Badge tone="gold" icon={<Icon name="lock" size={11} />} className={className}>
        Premium
      </Badge>
    );
  }
  if (access === 'vip') {
    return (
      <Badge tone="violet" icon={<Icon name="sparkles" size={11} />} className={className}>
        VIP
      </Badge>
    );
  }
  return null;
};
