import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Row.module.css';

export type RowGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

export interface RowProps {
  gap?: RowGap;
  between?: boolean;
  wrap?: boolean;
  children?: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

const gapClass = (g: RowGap) => `gap${g}`;

export const Row: React.FC<RowProps> = ({
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
        s.row,
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
