import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Sparkline.module.css';

export interface SparklineProps extends Omit<React.SVGProps<SVGSVGElement>, 'values' | 'color'> {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  color = 'var(--green)',
  width = 80,
  height = 22,
  className,
  ...rest
}) => {
  if (!values || values.length === 0) {
    return <svg width={width} height={height} className={cx(s.spark, className)} {...rest} />;
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
    <svg width={width} height={height} className={cx(s.spark, className)} {...rest}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  );
};
