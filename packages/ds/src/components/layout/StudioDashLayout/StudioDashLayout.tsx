import React from 'react';
import { cx } from '../../../utils/cx';
import s from './StudioDashLayout.module.css';

export interface StudioDashLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export function StudioDashLayout({ children, className }: StudioDashLayoutProps) {
  return <div className={cx(s.layout, className)}>{children}</div>;
}

export interface StudioDashColProps {
  children?: React.ReactNode;
  /** 12-column span at large breakpoints (full width on small screens). */
  span?: 4 | 5 | 6 | 7 | 8 | 12;
  className?: string;
}

export function StudioDashCol({ children, span = 12, className }: StudioDashColProps) {
  const spanClass =
    span === 4
      ? s.span4
      : span === 5
        ? s.span5
        : span === 6
          ? s.span6
          : span === 7
            ? s.span7
            : span === 8
              ? s.span8
              : s.span12;
  return <div className={cx(s.col, spanClass, className)}>{children}</div>;
}
