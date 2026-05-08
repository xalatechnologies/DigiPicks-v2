import React from 'react';
import { cx } from '../../../utils/cx';
import s from './AvatarStack.module.css';

export interface AvatarStackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const AvatarStack = React.forwardRef<HTMLDivElement, AvatarStackProps>(function AvatarStack(
  { children, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx(s.stack, className)} {...rest}>
      {children}
    </div>
  );
});
