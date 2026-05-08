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
  /** Hides redundant sport/league header (for use inside league-grouped sections). */
  compact?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

/** Get 2–3 letter initials from a team name. */
function initials(name: string): string {
  const words = name.split(/\s+/);
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
}

/** Deterministic color from team name. */
function teamColor(name: string): string {
  const colors = [
    'var(--primary)', 'var(--violet)', 'var(--green)',
    'var(--orange)', 'var(--red)', 'var(--blue)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export const EventCard = React.forwardRef<HTMLDivElement, EventCardProps>(function EventCard(
  { sport, league, time, home, away, creators, picks, featured, compact, onClick, className, ...rest },
  ref,
) {
  const interactive = Boolean(onClick);
  const hasMetrics = (creators != null && creators > 0) || (picks != null && picks > 0);
  return (
    <div
      ref={ref}
      className={cx(s.card, featured && s.featured, interactive && s.interactive, className)}
      onClick={onClick}
      {...rest}
    >
      <span className={s.shine} aria-hidden="true" />

      {/* Header: sport tag + time */}
      <div className={s.head}>
        <div className={s.headLeft}>
          {!compact && <SportTag sport={sport} />}
          {!compact && league && <span className={s.league}>{league}</span>}
        </div>
        <span className={s.time}>{time}</span>
      </div>

      {/* Matchup: avatar · name vs name · avatar */}
      <div className={s.matchup}>
        <div className={s.side}>
          <span
            className={s.teamBadge}
            style={{ '--tb-color': teamColor(away) } as React.CSSProperties}
            aria-hidden="true"
          >
            {initials(away)}
          </span>
          <span className={s.teamName}>{away}</span>
        </div>

        <span className={s.vs}>vs</span>

        <div className={cx(s.side, s.sideRight)}>
          <span className={s.teamName}>{home}</span>
          <span
            className={s.teamBadge}
            style={{ '--tb-color': teamColor(home) } as React.CSSProperties}
            aria-hidden="true"
          >
            {initials(home)}
          </span>
        </div>
      </div>

      {/* Footer metrics */}
      {hasMetrics && (
        <div className={s.foot}>
          {creators != null && creators > 0 && (
            <span className={s.metric}>
              <strong className={s.metricNum}>{creators}</strong>
              <span className={s.metricLabel}>creators</span>
            </span>
          )}
          {creators != null && creators > 0 && picks != null && picks > 0 && <span className={s.dot}>·</span>}
          {picks != null && picks > 0 && (
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
