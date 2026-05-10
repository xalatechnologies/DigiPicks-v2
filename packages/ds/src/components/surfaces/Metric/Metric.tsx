import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Metric.module.css';

export type MetricDir = 'up' | 'down' | 'flat';

export interface MetricProps {
  label: string;
  value: React.ReactNode;
  delta?: { value: string | number; dir: MetricDir };
  icon?: React.ReactNode;
  className?: string;
}

const DIR_CLASS: Record<MetricDir, string> = {
  up: 'metricUp',
  down: 'metricDown',
  flat: 'metricFlat',
};

export function Metric({ label, value, delta, icon, className }: MetricProps) {
  // Drive the persistent left-accent stripe from the delta direction.
  // Metrics without a delta render the muted-line variant so cards still
  // share a rhythm — no orphan stripeless tile in the row.
  const dirClass = delta ? s[DIR_CLASS[delta.dir]] : s.metricFlat;
  return (
    <div className={cx(s.metric, dirClass, className)}>
      <div className={s.label}>
        {icon && <span className={s.icon}>{icon}</span>}
        <span>{label}</span>
      </div>
      <div className={s.value}>{value}</div>
      {delta && (
        <div className={cx(s.delta, s[delta.dir])}>
          <span className={s.arrow} aria-hidden="true">
            {delta.dir === 'up' ? '▲' : delta.dir === 'down' ? '▼' : '—'}
          </span>
          <span>{delta.value}</span>
        </div>
      )}
    </div>
  );
}
