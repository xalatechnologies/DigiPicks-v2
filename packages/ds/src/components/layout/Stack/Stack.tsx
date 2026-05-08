import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Stack.module.css';

export type StackGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

export interface StackProps {
  gap?: StackGap;
  children?: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

const gapClass = (g: StackGap) => `gap${g}`;

export const Stack: React.FC<StackProps> = ({ gap = 3, children, as, className }) => {
  const Comp = (as ?? 'div') as React.ElementType;
  return <Comp className={cx(s.stack, s[gapClass(gap)], className)}>{children}</Comp>;
};
