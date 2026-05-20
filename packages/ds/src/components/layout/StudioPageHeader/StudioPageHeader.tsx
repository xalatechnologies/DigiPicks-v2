import React from 'react';
import { cx } from '../../../utils/cx';
import s from './StudioPageHeader.module.css';

export interface StudioPageHeaderProps {
  eyebrow: string;
  title: string;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function StudioPageHeader({
  eyebrow,
  title,
  sub,
  actions,
  className,
}: StudioPageHeaderProps) {
  return (
    <header className={cx(s.wrap, className)}>
      <div className={s.row}>
        <div className={s.copy}>
          <p className={s.eyebrow}>{eyebrow}</p>
          <h1 className={s.title}>{title}</h1>
          {sub ? <p className={s.sub}>{sub}</p> : null}
        </div>
        {actions ? <div className={s.actions}>{actions}</div> : null}
      </div>
    </header>
  );
}
