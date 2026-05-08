import React from 'react';
import { cx } from '../../../utils/cx';
import s from './FeatureCard.module.css';

export interface FeatureCardProps {
  icon?: React.ReactNode;
  title: string;
  body: string;
  className?: string;
}

export function FeatureCard({ icon, title, body, className }: FeatureCardProps) {
  return (
    <div className={cx(s.card, className)}>
      <span className={s.shine} aria-hidden="true" />
      <div className={s.head}>
        {icon && <div className={s.icon}>{icon}</div>}
        <h3 className={s.title}>{title}</h3>
      </div>
      <p className={s.body}>{body}</p>
    </div>
  );
}
