import React from 'react';
import { cx } from '../../../utils/cx';
import s from './DashGrid.module.css';

export interface DashGridProps {
  /** Main content (left / wider column). */
  children: React.ReactNode;
  /** Sidebar content (right / narrower column). */
  aside: React.ReactNode;
  /** Reverse: aside on left, main on right. Default false. */
  reverse?: boolean;
  className?: string;
}

/**
 * Two-column dashboard layout using CSS Grid.
 * Main column takes ~62%, aside takes ~38% — collapses to a single
 * column below 1024px.
 */
export function DashGrid({ children, aside, reverse, className }: DashGridProps) {
  return (
    <div className={cx(s.grid, reverse && s.reverse, className)}>
      <div className={s.main}>{children}</div>
      <aside className={s.aside}>{aside}</aside>
    </div>
  );
}
