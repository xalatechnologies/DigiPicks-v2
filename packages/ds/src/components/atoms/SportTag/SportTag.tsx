import React from 'react';
import { cx } from '../../../utils/cx';
import s from './SportTag.module.css';

export interface SportTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  sport: string;
  lg?: boolean;
}

function abbr(sport: string): string {
  if (!sport) return '';
  if (sport.toLowerCase() === 'soccer') return 'SOC';
  return sport.slice(0, 3).toUpperCase();
}

function sportKey(sport: string): string {
  const k = sport.toLowerCase();
  if (k === 'soccer') return 'soc';
  if (k === 'tennis') return 'ten';
  return k.slice(0, 3);
}

export const SportTag = React.forwardRef<HTMLSpanElement, SportTagProps>(function SportTag(
  { sport, lg, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx(s.sport, lg && s.lg, className)}
      data-sport={sportKey(sport)}
      {...rest}
    >
      {abbr(sport)}
    </span>
  );
});
