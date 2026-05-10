import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Sparkline.module.css';

export interface SparklineProps extends Omit<React.SVGProps<SVGSVGElement>, 'values' | 'color'> {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  /** Accessible label — defaults to a numeric trend description. */
  ariaLabel?: string;
  /** Optional unit suffix used in the auto-generated aria-label (e.g. "u"). */
  unit?: string;
}

function describeTrend(values: number[], unit = ''): string {
  if (values.length === 0) return 'Empty trend';
  const first = values[0]!;
  const last = values[values.length - 1]!;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const direction = last > first ? 'up' : last < first ? 'down' : 'flat';
  return `Trend ${direction}, ${values.length} points, range ${min}${unit} to ${max}${unit}, ending at ${last}${unit}.`;
}

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  color = 'var(--green)',
  width = 80,
  height = 22,
  className,
  ariaLabel,
  unit,
  ...rest
}) => {
  const label = ariaLabel ?? describeTrend(values ?? [], unit);
  if (!values || values.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        className={cx(s.spark, className)}
        role="img"
        aria-label={label}
        {...rest}
      />
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const denom = values.length > 1 ? values.length - 1 : 1;
  const pts = values
    .map((v, i) => {
      const x = (i / denom) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg
      width={width}
      height={height}
      className={cx(s.spark, className)}
      role="img"
      aria-label={label}
      {...rest}
    >
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  );
};
