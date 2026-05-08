import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Chip.module.css';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  greenActive?: boolean;
  count?: number | string;
  children?: React.ReactNode;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { active, greenActive, count, children, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(s.chip, active && s.active, greenActive && s.greenActive, className)}
      aria-pressed={active || greenActive ? true : undefined}
      {...rest}
    >
      {children}
      {count !== undefined && count !== null && <span className={s.count}>{count}</span>}
    </button>
  );
});
