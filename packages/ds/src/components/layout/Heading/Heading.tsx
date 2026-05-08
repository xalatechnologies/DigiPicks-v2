import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Heading.module.css';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
export type HeadingWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type HeadingTone = 'default' | 'muted' | 'accent';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  size?: HeadingSize;
  weight?: HeadingWeight;
  tone?: HeadingTone;
  /** Apply text-wrap: balance for visually-balanced multi-line headings. */
  balance?: boolean;
  children?: React.ReactNode;
}

const SIZE_BY_LEVEL: Record<HeadingLevel, HeadingSize> = {
  1: '3xl',
  2: 'xl',
  3: 'md',
  4: 'sm',
  5: 'xs',
  6: 'xs',
};

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 2, size, weight, tone, balance, className, children, ...rest },
  ref,
) {
  const Tag = (`h${level}`) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const resolvedSize: HeadingSize = size ?? SIZE_BY_LEVEL[level];
  return (
    <Tag
      ref={ref}
      className={cx(
        s.h,
        s[`size-${resolvedSize}`],
        weight && s[`weight-${weight}`],
        tone && s[`tone-${tone}`],
        balance && s.balance,
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
});
