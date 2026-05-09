import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Badge, type BadgeTone } from '../../atoms/Badge/Badge';
import s from './SubscriptionTile.module.css';

export type SubscriptionTileStatus = 'active' | 'past_due' | 'cancelled' | 'paused';

export interface SubscriptionTileProps {
  creatorName: string;
  creatorHandle?: string;
  creatorMono: string;
  creatorColor?: string;
  /** Plan name — Free / Standard / VIP, etc. */
  plan?: string;
  /** Numeric price displayed prominently (e.g. 29). */
  price?: number;
  /** Suffix for the price (defaults to "/mo"). */
  priceSuffix?: string;
  status?: SubscriptionTileStatus;
  /** Optional caption shown under the name (e.g. "Renews Mar 12"). */
  meta?: React.ReactNode;
  /** Primary right-side action (Manage / Retry / Resubscribe). */
  primaryAction?: React.ReactNode;
  /** Secondary action (View profile, …). */
  secondaryAction?: React.ReactNode;
  className?: string;
}

const STATUS_TONE: Record<SubscriptionTileStatus, BadgeTone> = {
  active: 'green',
  past_due: 'red',
  cancelled: 'mute',
  paused: 'gold',
};

const STATUS_LABEL: Record<SubscriptionTileStatus, string> = {
  active: 'Active',
  past_due: 'Past due',
  cancelled: 'Cancelled',
  paused: 'Paused',
};

/**
 * Rich subscription card for the Subscriptions page. Shows creator
 * identity on the left, status and plan in the middle, prominent
 * monthly price in the trailing column, with primary/secondary
 * actions stacked underneath. Replaces the generic PersonRow.
 */
export function SubscriptionTile({
  creatorName,
  creatorHandle,
  creatorMono,
  creatorColor,
  plan,
  price,
  priceSuffix = '/mo',
  status = 'active',
  meta,
  primaryAction,
  secondaryAction,
  className,
}: SubscriptionTileProps) {
  return (
    <article className={cx(s.tile, s[status], className)}>
      <div className={s.identity}>
        <Avatar mono={creatorMono} color={creatorColor} size={44} />
        <div className={s.idText}>
          <div className={s.name}>{creatorName}</div>
          {(creatorHandle || meta) && (
            <div className={s.meta}>
              {creatorHandle && <span className={s.handle}>{creatorHandle}</span>}
              {creatorHandle && meta && <span className={s.dot} aria-hidden="true">·</span>}
              {meta && <span>{meta}</span>}
            </div>
          )}
        </div>
      </div>

      <div className={s.middle}>
        <Badge tone={STATUS_TONE[status]} dot={status !== 'cancelled'}>
          {STATUS_LABEL[status]}
        </Badge>
        {plan && <span className={s.plan}>{plan}</span>}
      </div>

      {typeof price === 'number' && (
        <div className={s.price}>
          <span className={s.currency}>$</span>
          <span className={s.amount}>{price}</span>
          <span className={s.suffix}>{priceSuffix}</span>
        </div>
      )}

      {(primaryAction || secondaryAction) && (
        <div className={s.actions}>
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </article>
  );
}
