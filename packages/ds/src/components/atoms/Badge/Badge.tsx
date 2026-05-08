import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Badge.module.css';

export type BadgeTone = 'green' | 'gold' | 'red' | 'amber' | 'blue' | 'violet' | 'mute';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
  square?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'mute', dot, square, icon, children, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx(s.base, s[tone], square && s.square, className)}
      {...rest}
    >
      {dot && <span className={s.dot} />}
      {icon && <span className={s.icon}>{icon}</span>}
      {children}
    </span>
  );
});
