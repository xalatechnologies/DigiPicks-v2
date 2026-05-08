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

export function Metric({ label, value, delta, icon, className }: MetricProps) {
  return (
    <div className={cx(s.metric, className)}>
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
