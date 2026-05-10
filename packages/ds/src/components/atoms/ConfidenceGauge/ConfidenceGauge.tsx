import React from 'react';
import { cx } from '../../../utils/cx';
import { Bar, type BarTone } from '../Bar/Bar';
import s from './ConfidenceGauge.module.css';

export interface ConfidenceGaugeProps {
  /** 0–100. */
  value: number;
  /** Display label, e.g. "AI confidence". */
  label?: string;
  className?: string;
}

function toneFor(value: number): BarTone {
  if (value >= 75) return 'green';
  if (value >= 50) return 'primary';
  if (value >= 25) return 'amber';
  return 'red';
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({
  value,
  label = 'Confidence',
  className,
}) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const tone = toneFor(pct);
  return (
    <div
      className={cx(s.gauge, className)}
      role="meter"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${pct} percent`}
    >
      <div className={s.head}>
        <span className={s.label}>{label}</span>
        <span className={s.value}>{pct}%</span>
      </div>
      <Bar value={pct} tone={tone} size="md" />
    </div>
  );
};
