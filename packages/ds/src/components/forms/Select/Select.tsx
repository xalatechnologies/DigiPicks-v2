import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Select.module.css';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={cx(s.select, className)} {...rest}>
      {children}
    </select>
  );
});
