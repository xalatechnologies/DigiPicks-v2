import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Tag.module.css';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { children, className, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx(s.tag, className)} {...rest}>
      {children}
    </span>
  );
});
