import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Col.module.css';

export type ColGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

export interface ColProps {
  gap?: ColGap;
  between?: boolean;
  wrap?: boolean;
  children?: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

const gapClass = (g: ColGap) => `gap${g}`;

export const Col: React.FC<ColProps> = ({
  gap = 3,
  between,
  wrap,
  children,
  as,
  className,
}) => {
  const Comp = (as ?? 'div') as React.ElementType;
  return (
    <Comp
      className={cx(
        s.col,
        s[gapClass(gap)],
        between && s.between,
        wrap && s.wrap,
        className,
      )}
    >
      {children}
    </Comp>
  );
};
