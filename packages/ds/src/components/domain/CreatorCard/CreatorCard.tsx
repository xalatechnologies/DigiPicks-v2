import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Icon } from '../../atoms/Icon/Icon';
import { VerifiedMark } from '../../atoms/VerifiedMark/VerifiedMark';
import s from './CreatorCard.module.css';

export interface CreatorCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  name: string;
  handle: string;
  mono: string;
  color: string;
  verified?: boolean;
  bio?: string;
  winRate?: number | string;
  record?: string;
  subs?: number | string;
  /** "WWLWWLLW--" style string of last 10 results. */
  last10?: string;
  /** Optional small streak badge (e.g., "🔥 W6"). */
  streak?: React.ReactNode;
  tags?: string[];
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

function formatWinRate(v?: number | string): string {
  if (v == null) return '—';
  if (typeof v === 'number') {
    const pct = v <= 1 ? v * 100 : v;
    return `${pct.toFixed(1)}%`;
  }
  return v;
}

function formatSubs(v?: number | string): string {
  if (v == null) return '—';
  if (typeof v === 'number') return v.toLocaleString();
  return v;
}

function dotClass(c: string): 'win' | 'loss' | 'push' | undefined {
  if (c === 'W') return 'win';
  if (c === 'L') return 'loss';
  if (c === 'P') return 'push';
  return undefined;
}

export const CreatorCard = React.forwardRef<HTMLDivElement, CreatorCardProps>(function CreatorCard(
  {
    name,
    handle,
    mono,
    color,
    verified,
    bio,
    winRate,
    record,
    subs,
    last10,
    streak,
    tags,
    onClick,
    className,
    style,
    ...rest
  },
  ref,
) {
  const interactive = Boolean(onClick);
  const cssVars = { '--av-color': color, ...style } as React.CSSProperties;
  const dots = (last10 ?? '').slice(0, 10).padEnd(10, '-').split('');

  return (
    <div
      ref={ref}
      className={cx(s.card, interactive && s.interactive, className)}
      onClick={onClick}
      style={cssVars}
      {...rest}
    >
      <span className={s.shine} aria-hidden="true" />

      <div className={s.head}>
        <Avatar mono={mono} color={color} size={56} />
        <div className={s.headText}>
          <div className={s.nameRow}>
            <span className={s.name}>{name}</span>
            {verified && <VerifiedMark size={14} />}
          </div>
          <div className={s.handle}>{handle}</div>
        </div>
        {streak && <span className={s.headBadge}>{streak}</span>}
      </div>

      {bio && <p className={s.bio}>{bio}</p>}

      <div className={s.stats}>
        <div className={s.stat}>
          <span className={s.statLabel}>Win rate</span>
          <span className={cx(s.statValue, s.statAccent)}>{formatWinRate(winRate)}</span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>Record</span>
          <span className={s.statValue}>{record ?? '—'}</span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>Subs</span>
          <span className={s.statValue}>{formatSubs(subs)}</span>
        </div>
      </div>

      {last10 && (
        <div className={s.formRow}>
          <span className={s.formLabel}>Last 10</span>
          <div className={s.formDots} aria-label={`Last 10: ${last10}`}>
            {dots.map((c, i) => {
              const cls = dotClass(c);
              return (
                <span
                  key={i}
                  className={cx(s.formDot, cls && s[cls])}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        </div>
      )}

      {((tags && tags.length > 0) || interactive) && (
        <div className={s.foot}>
          {tags && tags.length > 0 ? (
            <div className={s.tags}>
              {tags.map((t) => (
                <span key={t} className={s.tag}>
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <span className={s.tagSpacer} aria-hidden="true" />
          )}
          {interactive && (
            <span className={s.arrow} aria-hidden="true">
              <Icon name="arrow-right" size={16} />
            </span>
          )}
        </div>
      )}
    </div>
  );
});
