import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Card.module.css';

export type CardPad = 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  pad?: CardPad;
  hover?: boolean;
  elev?: boolean;
  as?: React.ElementType;
  children?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLElement, CardProps>(function Card(
  { pad = 'md', hover, elev, as: As = 'div', className, children, ...rest },
  ref,
) {
  const padClass =
    pad === 'sm' ? s.padSm : pad === 'lg' ? s.padLg : pad === 'xl' ? s.padXl : s.padMd;
  return (
    <As
      ref={ref}
      className={cx(s.card, padClass, hover && s.hover, elev && s.elev, className)}
      {...rest}
    >
      {children}
    </As>
  );
});
