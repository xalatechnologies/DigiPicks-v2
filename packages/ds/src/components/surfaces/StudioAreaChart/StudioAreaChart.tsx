import React from 'react';
import { cx } from '../../../utils/cx';
import s from './StudioAreaChart.module.css';

export interface StudioAreaChartProps {
  className?: string;
  size?: 'md' | 'sm';
  /** Optional highlight label for the active point tooltip. */
  highlightLabel?: string;
  highlightValue?: string;
}

/** Decorative revenue-style area chart for studio dashboards (QA / empty data). */
export function StudioAreaChart({
  className,
  size = 'md',
  highlightLabel = 'Today',
  highlightValue = '$1,142.00',
}: StudioAreaChartProps) {
  return (
    <div className={cx(s.wrap, size === 'sm' && s.sm, className)}>
      <svg className={s.svg} viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="studioChartFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line className={s.baseline} x1="0" y1="280" x2="1000" y2="280" />
        <line className={s.grid} x1="0" y1="180" x2="1000" y2="180" />
        <line className={s.grid} x1="0" y1="80" x2="1000" y2="80" />
        <path
          className={s.area}
          d="M0,280 L0,220 C100,200 150,240 250,210 C350,180 450,120 550,140 C650,160 750,60 850,80 L1000,40 L1000,280 Z"
        />
        <path
          className={s.line}
          d="M0,220 C100,200 150,240 250,210 C350,180 450,120 550,140 C650,160 750,60 850,80 L1000,40"
        />
        <circle className={s.dot} cx="850" cy="80" r="6" />
        <circle className={s.dotRing} cx="850" cy="80" r="12" />
      </svg>
      {highlightValue ? (
        <div className={s.tooltip}>
          <p className={s.tooltipLabel}>{highlightLabel}</p>
          <p className={s.tooltipValue}>{highlightValue}</p>
        </div>
      ) : null}
    </div>
  );
}
