import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { Button } from '../../atoms/Button/Button';
import type { IconName } from '../../atoms/Icon/Icon';
import s from './NotificationInboxCard.module.css';

export type NotificationInboxIconTone = 'primary' | 'secondary' | 'muted';

export interface NotificationInboxCardProps {
  title: string;
  body?: string;
  timeLabel: string;
  unread?: boolean;
  badge?: string;
  icon?: IconName;
  iconTone?: NotificationInboxIconTone;
  ctaLabel?: string;
  onCta?: () => void;
  onMarkRead?: () => void;
  className?: string;
}

export function NotificationInboxCard({
  title,
  body,
  timeLabel,
  unread,
  badge,
  icon = 'bell',
  iconTone = 'primary',
  ctaLabel,
  onCta,
  onMarkRead,
  className,
}: NotificationInboxCardProps) {
  const iconClass =
    iconTone === 'muted' ? s.iconMuted : iconTone === 'secondary' ? s.iconSecondary : s.iconPrimary;

  return (
    <article className={cx(s.card, unread && s.unread, className)}>
      {unread ? <span className={s.unreadBar} aria-hidden="true" /> : null}
      <span className={cx(s.iconWrap, iconClass)} aria-hidden="true">
        <Icon name={icon} size={24} />
      </span>
      <div className={s.copy}>
        <div className={s.head}>
          <div className={s.titleRow}>
            <h3 className={s.title}>{title}</h3>
            {badge ? <span className={s.badge}>{badge}</span> : null}
          </div>
          <p className={s.time}>{timeLabel}</p>
        </div>
        {body ? <p className={s.body}>{body}</p> : null}
        {ctaLabel && onCta ? (
          <Button variant={unread ? 'primary' : 'secondary'} size="sm" onClick={onCta}>
            {ctaLabel}
          </Button>
        ) : null}
      </div>
      {unread ? (
        <button
          type="button"
          className={s.unreadDot}
          onClick={onMarkRead}
          aria-label="Mark as read"
        />
      ) : null}
    </article>
  );
}
