import React from 'react';
import { cx } from '../../../utils/cx';
import s from './CardHead.module.css';

export interface CardHeadProps {
  /** Optional leading icon, rendered inline with the title. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function CardHead({ icon, title, sub, action, className }: CardHeadProps) {
  return (
    <div className={cx(s.head, className)}>
      {icon && <div className={s.icon}>{icon}</div>}
      <div className={s.text}>
        <h3 className={s.title}>{title}</h3>
        {sub && <div className={s.sub}>{sub}</div>}
      </div>
      <div className={s.spacer} />
      {action && <div className={s.action}>{action}</div>}
    </div>
  );
}
