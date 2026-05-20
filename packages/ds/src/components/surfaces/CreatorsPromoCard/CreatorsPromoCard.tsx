import React from 'react';
import { cx } from '../../../utils/cx';
import s from './CreatorsPromoCard.module.css';

export interface CreatorsPromoCardProps {
  title: string;
  body?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function CreatorsPromoCard({ title, body, actions, className }: CreatorsPromoCardProps) {
  return (
    <article className={cx(s.card, className)}>
      <h4 className={s.title}>{title}</h4>
      {body ? <p className={s.body}>{body}</p> : null}
      {actions}
    </article>
  );
}
