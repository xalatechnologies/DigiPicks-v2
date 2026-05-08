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
  /** 0-1 fraction or already-formatted string. */
  winRate?: number | string;
  /** "47-30-3" style W-L-P record. Demoted to a small pill near the form dots. */
  record?: string;
  /** Net units (e.g., "+38.4u" or "-3.2u"). Tinted by sign. */
  units?: string;
  /** Active subscriber count. */
  subs?: number | string;
  /** "WWLWWLLW--" style string of last 10 results. */
  last10?: string;
  /** Streak indicator (e.g., "W3" / "L1"). Auto-tinted by leading character. */
  streak?: string;
  /** Marks the creator as trending (gold pill in header). */
  trending?: boolean;
  /** Starting subscription price in dollars. */
  startingPrice?: number;
  /** Sport / niche tags. */
  tags?: string[];
  /** Footer CTA label. Default "View profile". */
  ctaLabel?: string;
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
  if (typeof v === 'number') {
    if (v >= 1000) return `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k`;
    return v.toLocaleString();
  }
  return v;
}

function dotClass(c: string): 'win' | 'loss' | 'push' | undefined {
  if (c === 'W') return 'win';
  if (c === 'L') return 'loss';
  if (c === 'P') return 'push';
  return undefined;
}

function unitsClass(u?: string): string | undefined {
  if (!u) return undefined;
  if (u.startsWith('+')) return 'statAccent';
  if (u.startsWith('-')) return 'statAccentDanger';
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
    units,
    subs,
    last10,
    streak,
    trending,
    startingPrice,
    tags,
    ctaLabel = 'View profile',
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
  const streakDown = Boolean(streak && streak.startsWith('L'));
  const unitsCls = unitsClass(units);

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
        {(streak || trending) && (
          <div className={s.headBadges}>
            {trending && (
              <span className={s.trendingBadge} title="Trending this week">
                <Icon name="flame" size={12} /> Trending
              </span>
            )}
            {streak && (
              <span
                className={cx(s.streakBadge, streakDown && s.down)}
                title={`Current streak: ${streak}`}
              >
                {streakDown ? '↓' : '↑'} {streak}
              </span>
            )}
          </div>
        )}
      </div>

      {bio && <p className={s.bio}>{bio}</p>}

      <div className={s.stats}>
        <div className={s.stat}>
          <span className={s.statLabel}>Win rate</span>
          <span className={cx(s.statValue, s.statAccent)}>{formatWinRate(winRate)}</span>
          <span className={s.statSub}>rolling 90-day</span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>Units</span>
          <span className={cx(s.statValue, unitsCls && s[unitsCls])}>{units ?? '—'}</span>
          <span className={s.statSub}>net ROI</span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>Subs</span>
          <span className={s.statValue}>{formatSubs(subs)}</span>
          <span className={s.statSub}>active</span>
        </div>
      </div>

      {(last10 || record) && (
        <div className={s.formRow}>
          {last10 && (
            <div className={s.formGroup}>
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
          {record && (
            <span className={s.recordPill} title="All-time record · wins · losses · pushes">
              <span className={s.recordPillKey}>W·L·P</span>
              {record}
            </span>
          )}
        </div>
      )}

      {tags && tags.length > 0 && (
        <div className={s.tagsRow}>
          {tags.map((t) => (
            <span key={t} className={s.tag}>
              {t}
            </span>
          ))}
        </div>
      )}

      <div className={s.foot}>
        {startingPrice != null ? (
          <span className={s.price}>
            <span className={s.priceFrom}>From</span>
            <span className={s.priceValue}>${startingPrice}</span>
            <span className={s.pricePeriod}>/mo</span>
          </span>
        ) : (
          <span className={s.spacer} aria-hidden="true" />
        )}
        {interactive && (
          <span className={s.cta}>
            {ctaLabel}
            <span className={s.ctaArrow} aria-hidden="true">
              <Icon name="arrow-right" size={14} />
            </span>
          </span>
        )}
      </div>
    </div>
  );
});
