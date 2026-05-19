import React from 'react';
import { cx } from '../../../utils/cx';
import s from './SplitPageLayout.module.css';

export interface SplitPageLayoutProps {
  main: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}

/** Editorial two-column page shell (primary content + sidebar). */
export function SplitPageLayout({ main, aside, className }: SplitPageLayoutProps) {
  return (
    <div className={cx(s.split, className)}>
      <div className={s.main}>{main}</div>
      {aside ? <aside className={s.aside}>{aside}</aside> : null}
    </div>
  );
}
