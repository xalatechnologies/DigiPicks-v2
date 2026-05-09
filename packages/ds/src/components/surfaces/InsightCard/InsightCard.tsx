import React from 'react';
import { cx } from '../../../utils/cx';
import s from './InsightCard.module.css';

export type InsightTone = 'blue' | 'green' | 'gold' | 'red' | 'amber' | 'mute';

export interface InsightCardProps {
  tone?: InsightTone;
  icon?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  /** Optional dense body slot (rows, lists, controls). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Card variant with a left accent strip and tone-tinted ambient gradient.
 * Used for tips, callouts, quick-links, danger zones — gives sidebars and
 * mixed surfaces visual rhythm vs. plain Cards.
 */
export function InsightCard({
  tone = 'blue',
  icon,
  eyebrow,
  title,
  sub,
  action,
  children,
  className,
}: InsightCardProps) {
  return (
    <div className={cx(s.card, s[tone], className)}>
      <div className={s.strip} aria-hidden="true" />
      <div className={s.body}>
        <div className={s.head}>
          {icon && <div className={s.icon}>{icon}</div>}
          <div className={s.text}>
            {eyebrow && <div className={s.eyebrow}>{eyebrow}</div>}
            <div className={s.title}>{title}</div>
            {sub && <div className={s.sub}>{sub}</div>}
          </div>
          {action && <div className={s.action}>{action}</div>}
        </div>
        {children && <div className={s.content}>{children}</div>}
      </div>
    </div>
  );
}
