import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Odds.module.css';

export interface OddsProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  value: string | number;
}

export const Odds = React.forwardRef<HTMLSpanElement, OddsProps>(function Odds(
  { value, className, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx(s.odds, className)} {...rest}>
      {value}
    </span>
  );
});
