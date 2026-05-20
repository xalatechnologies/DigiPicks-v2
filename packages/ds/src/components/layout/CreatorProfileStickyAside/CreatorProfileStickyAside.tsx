import React from 'react';
import { cx } from '../../../utils/cx';
import s from './CreatorProfileStickyAside.module.css';

export interface CreatorProfileStickyAsideProps {
  children?: React.ReactNode;
  className?: string;
}

export function CreatorProfileStickyAside({ children, className }: CreatorProfileStickyAsideProps) {
  return (
    <div className={cx(s.wrap, className)}>
      <div className={s.sticky}>{children}</div>
    </div>
  );
}
