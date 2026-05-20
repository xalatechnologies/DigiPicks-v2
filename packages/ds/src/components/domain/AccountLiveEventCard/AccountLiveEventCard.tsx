import React from 'react';
import { cx } from '../../../utils/cx';
import { Button } from '../../atoms/Button/Button';
import s from './AccountLiveEventCard.module.css';

export interface AccountLiveEventCardProps {
  sport: string;
  timeLabel: string;
  away: string;
  home: string;
  live?: boolean;
  scoreDisplay?: string;
  statusLabel?: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

export function AccountLiveEventCard({
  sport,
  timeLabel,
  away,
  home,
  live,
  scoreDisplay,
  statusLabel,
  ctaLabel = 'View event',
  onCta,
  className,
}: AccountLiveEventCardProps) {
  return (
    <article className={cx(s.card, live && s.live, className)}>
      <div className={s.head}>
        <p className={s.meta}>
          {sport} · {timeLabel}
        </p>
        {live ? (
          <span className={s.liveBadge}>
            <span className={s.liveDot} aria-hidden="true" />
            Live
          </span>
        ) : null}
      </div>
      <h3 className={s.title}>
        {away} <span className={s.vs}>vs</span> {home}
      </h3>
      <div className={s.foot}>
        {scoreDisplay ? (
          <p className={s.score}>{scoreDisplay}</p>
        ) : statusLabel ? (
          <p className={s.status}>{statusLabel}</p>
        ) : (
          <span aria-hidden="true" />
        )}
        {onCta ? (
          <Button variant={live ? 'primary' : 'outline'} size="sm" onClick={onCta}>
            {ctaLabel}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
