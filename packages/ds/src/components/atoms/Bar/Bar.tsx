import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Bar.module.css';

export type BarTone = 'primary' | 'green' | 'amber' | 'red';
export type BarSize = 'thin' | 'md' | 'thick';

export interface BarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number;
  tone?: BarTone;
  size?: BarSize;
}

export const Bar = React.forwardRef<HTMLDivElement, BarProps>(function Bar(
  { value, tone = 'primary', size = 'md', className, style, ...rest },
  ref,
) {
  const pct = Math.max(0, Math.min(100, value));
  const cssVars = { '--pct': `${pct}%`, ...style } as React.CSSProperties;
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cx(s.bar, size !== 'md' && s[size], className)}
      style={cssVars}
      {...rest}
    >
      <i className={cx(s.fill, s[tone])} />
    </div>
  );
});
