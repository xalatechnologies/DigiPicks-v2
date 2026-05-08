import React from 'react';
import { cx } from '../../../utils/cx';
import { SportTag } from '../../atoms/SportTag/SportTag';
import s from './EventCard.module.css';

export interface EventCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  sport: string;
  league?: string;
  time: string;
  home: string;
  away: string;
  creators?: number;
  picks?: number;
  featured?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const EventCard = React.forwardRef<HTMLDivElement, EventCardProps>(function EventCard(
  { sport, league, time, home, away, creators, picks, featured, onClick, className, ...rest },
  ref,
) {
  const interactive = Boolean(onClick);
  return (
    <div
      ref={ref}
      className={cx(s.card, featured && s.featured, interactive && s.interactive, className)}
      onClick={onClick}
      {...rest}
    >
      <span className={s.shine} aria-hidden="true" />
      <div className={s.head}>
        <div className={s.headLeft}>
          <SportTag sport={sport} />
          {league && <span className={s.league}>{league}</span>}
        </div>
        <span className={s.time}>{time}</span>
      </div>

      <div className={cx(s.teams, featured && s.teamsFeatured)}>
        <span className={s.team}>{away}</span>
        <span className={s.vs}>vs</span>
        <span className={s.team}>{home}</span>
      </div>

      {(creators != null || picks != null) && (
        <div className={s.foot}>
          {creators != null && (
            <span className={s.metric}>
              <strong className={s.metricNum}>{creators}</strong>
              <span className={s.metricLabel}>creators</span>
            </span>
          )}
          {creators != null && picks != null && <span className={s.dot}>·</span>}
          {picks != null && (
            <span className={s.metric}>
              <strong className={cx(s.metricNum, s.metricNumAccent)}>{picks}</strong>
              <span className={s.metricLabel}>picks</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
});
