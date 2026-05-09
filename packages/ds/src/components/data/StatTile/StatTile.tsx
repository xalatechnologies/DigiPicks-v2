import React from 'react';
import { cx } from '../../../utils/cx';
import s from './StatTile.module.css';

export type StatTileTone = 'neutral' | 'green' | 'red' | 'gold' | 'blue';
export type StatTileTrend = 'up' | 'down' | 'flat';

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  /** Optional small caption below the value. */
  sub?: React.ReactNode;
  /** Coloured directional chip rendered next to the value. */
  trend?: { value: React.ReactNode; dir: StatTileTrend };
  /** Optional leading icon (rendered top-right). */
  icon?: React.ReactNode;
  /** Accent stripe colour at the top of the tile. */
  tone?: StatTileTone;
  className?: string;
}

/**
 * Accent-stripe statistic tile. More expressive than Metric: tone-coloured
 * top stripe + ambient gradient, mono numerics, sub line, optional trend
 * chip, optional top-right icon.
 */
export function StatTile({
  label,
  value,
  sub,
  trend,
  icon,
  tone = 'neutral',
  className,
}: StatTileProps) {
  return (
    <div className={cx(s.tile, s[tone], className)}>
      <div className={s.stripe} aria-hidden="true" />
      <div className={s.head}>
        <span className={s.label}>{label}</span>
        {icon && <span className={s.icon}>{icon}</span>}
      </div>
      <div className={s.valueRow}>
        <span className={s.value}>{value}</span>
        {trend && (
          <span className={cx(s.trend, s[`t_${trend.dir}`])}>
            <span className={s.arrow} aria-hidden="true">
              {trend.dir === 'up' ? '▲' : trend.dir === 'down' ? '▼' : '—'}
            </span>
            <span>{trend.value}</span>
          </span>
        )}
      </div>
      {sub && <div className={s.sub}>{sub}</div>}
    </div>
  );
}
