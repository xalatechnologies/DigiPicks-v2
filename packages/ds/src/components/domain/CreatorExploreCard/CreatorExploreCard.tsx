import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Button } from '../../atoms/Button/Button';
import s from './CreatorExploreCard.module.css';

export type CreatorExploreBadgeTone = 'success' | 'primary' | 'info';

export interface CreatorExploreCardProps {
  name: string;
  niche?: string;
  mono: string;
  color: string;
  badge?: string;
  badgeTone?: CreatorExploreBadgeTone;
  tags?: string[];
  winRate?: number | string;
  units?: string;
  followers?: number | string;
  ctaLabel?: string;
  onClick?: () => void;
  className?: string;
}

function formatWinRate(v?: number | string): string {
  if (v == null) return '—';
  if (typeof v === 'number') {
    const pct = v <= 1 ? v * 100 : v;
    return `${Math.round(pct)}%`;
  }
  return v;
}

function formatUnits(u?: string): string {
  if (!u) return '—';
  return u.startsWith('+') || u.startsWith('-') ? u : `+${u}`;
}

function formatFollowers(v?: number | string): string {
  if (v == null) return '—';
  if (typeof v === 'number') {
    if (v >= 1000) return `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k`;
    return v.toLocaleString();
  }
  return v;
}

export function CreatorExploreCard({
  name,
  niche,
  mono,
  color,
  badge,
  badgeTone = 'primary',
  tags,
  winRate,
  units,
  followers,
  ctaLabel = 'View picks',
  onClick,
  className,
}: CreatorExploreCardProps) {
  const cssVars = { '--av-color': color } as React.CSSProperties;
  const badgeClass =
    badgeTone === 'success' ? s.badgeSuccess : badgeTone === 'info' ? s.badgeInfo : s.badgePrimary;

  return (
    <article className={cx(s.card, className)} style={cssVars}>
      <div className={s.top}>
        <div className={s.head}>
          <Avatar mono={mono} color={color} size={64} />
          {badge ? <span className={cx(s.badge, badgeClass)}>{badge}</span> : null}
        </div>
        <div>
          <h3 className={s.name}>{name}</h3>
          {niche ? <p className={s.niche}>{niche}</p> : null}
        </div>
        {tags && tags.length > 0 ? (
          <div className={s.tags}>
            {tags.map((t) => (
              <span key={t} className={s.tag}>
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <div className={s.stats}>
          <div className={s.stat}>
            <p className={s.statValue}>{formatWinRate(winRate)}</p>
            <p className={s.statLabel}>Win rate</p>
          </div>
          <div className={s.stat}>
            <p className={cx(s.statValue, s.statValueAccent)}>{formatUnits(units)}</p>
            <p className={s.statLabel}>All time</p>
          </div>
          <div className={s.stat}>
            <p className={s.statValue}>{formatFollowers(followers)}</p>
            <p className={s.statLabel}>Subscribers</p>
          </div>
        </div>
        {onClick ? (
          <Button variant="primary" block className={s.cta} onClick={onClick}>
            {ctaLabel}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
