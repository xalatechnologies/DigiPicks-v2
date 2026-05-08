import React from 'react';
import { cx } from '../../../utils/cx';
import s from './PageHead.module.css';

export interface PageHeadProps {
  title: string;
  sub?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHead: React.FC<PageHeadProps> = ({
  title,
  sub,
  eyebrow,
  actions,
  className,
}) => {
  return (
    <header className={cx(s.head, className)}>
      <div className={s.text}>
        {eyebrow && <div className={s.eyebrow}>{eyebrow}</div>}
        <h1 className={s.title}>{title}</h1>
        {sub && <p className={s.sub}>{sub}</p>}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </header>
  );
};
