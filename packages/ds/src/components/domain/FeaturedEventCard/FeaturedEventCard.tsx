import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { AvatarStack } from '../../atoms/AvatarStack/AvatarStack';
import { SportTag } from '../../atoms/SportTag/SportTag';
import s from './FeaturedEventCard.module.css';

export interface FeaturedEventCardCreator {
  mono: string;
  color: string;
}

export interface FeaturedEventCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  sport: string;
  league?: string;
  time: string;
  home: string;
  away: string;
  creators?: number;
  picks?: number;
  creatorsAvatars?: FeaturedEventCardCreator[];
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const FeaturedEventCard = React.forwardRef<HTMLDivElement, FeaturedEventCardProps>(
  function FeaturedEventCard(
    { sport, league, time, home, away, creators, picks, creatorsAvatars, onClick, className, ...rest },
    ref,
  ) {
    const interactive = Boolean(onClick);
    const hiddenCount =
      creators != null && creatorsAvatars && creators > creatorsAvatars.length
        ? creators - creatorsAvatars.length
        : 0;
    return (
      <div
        ref={ref}
        className={cx(s.card, interactive && s.interactive, className)}
        onClick={onClick}
        {...rest}
      >
        <span className={s.aurora} aria-hidden="true" />
        <span className={s.shine} aria-hidden="true" />
        <div className={s.head}>
          <div className={s.headLeft}>
            <SportTag sport={sport} />
            {league && <span className={s.league}>{league}</span>}
          </div>
          <span className={s.time}>{time}</span>
        </div>

        <div className={s.teams}>
          <span className={s.team}>{away}</span>
          <span className={s.vs}>vs</span>
          <span className={s.team}>{home}</span>
        </div>

        <div className={s.foot}>
          <div className={s.metrics}>
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

          {creatorsAvatars && creatorsAvatars.length > 0 && (
            <AvatarStack className={s.stack}>
              {creatorsAvatars.map((c, i) => (
                <Avatar key={i} mono={c.mono} color={c.color} size={26} />
              ))}
              {hiddenCount > 0 && (
                <span className={s.more}>+{hiddenCount}</span>
              )}
            </AvatarStack>
          )}
        </div>
      </div>
    );
  },
);
