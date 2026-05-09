import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { Button } from '../../atoms/Button/Button';
import s from './LockedChannelPanel.module.css';

export interface LockedChannelPanelProps {
  /** Tier required to unlock — drives the CTA copy. */
  requiredTier: 'public' | 'subscriber' | 'vip';
  /** Display name of the creator the channel belongs to. */
  creatorName?: string;
  /** Optional override for the unlock CTA label. */
  ctaLabel?: string;
  /** Called when the user clicks unlock — typically opens PricingModal. */
  onUnlock?: () => void;
  className?: string;
}

const TIER_COPY: Record<
  LockedChannelPanelProps['requiredTier'],
  { title: string; sub: string; cta: string }
> = {
  public: {
    title: 'Channel ready',
    sub: 'Anyone can read and post here.',
    cta: 'Open channel',
  },
  subscriber: {
    title: 'Subscribers-only channel',
    sub: 'Subscribe to read and post in this channel.',
    cta: 'Subscribe to unlock',
  },
  vip: {
    title: 'VIP channel',
    sub: 'Reserved for VIP-tier subscribers.',
    cta: 'Upgrade to VIP',
  },
};

/**
 * Empty-state panel rendered in place of channel messages when the caller
 * lacks the required subscription tier (FM-006). Keeps the channel listing
 * visible (drives conversion) while making the gate explicit.
 */
export const LockedChannelPanel: React.FC<LockedChannelPanelProps> = ({
  requiredTier,
  creatorName,
  ctaLabel,
  onUnlock,
  className,
}) => {
  const copy = TIER_COPY[requiredTier];
  return (
    <div className={cx(s.panel, className)}>
      <div className={s.iconWrap}>
        <Icon name="lock" size={24} />
      </div>
      <h3 className={s.title}>{copy.title}</h3>
      <p className={s.sub}>
        {copy.sub}
        {creatorName ? ` Posted by ${creatorName}.` : ''}
      </p>
      {requiredTier !== 'public' && onUnlock && (
        <Button variant="primary" size="md" onClick={onUnlock}>
          <Icon name="key" size={13} />
          {ctaLabel ?? copy.cta}
        </Button>
      )}
    </div>
  );
};
