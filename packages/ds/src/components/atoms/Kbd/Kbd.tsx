import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Kbd.module.css';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const Kbd = React.forwardRef<HTMLElement, KbdProps>(function Kbd(
  { children, className, ...rest },
  ref,
) {
  return (
    <kbd ref={ref} className={cx(s.kbd, className)} {...rest}>
      {children}
    </kbd>
  );
});
