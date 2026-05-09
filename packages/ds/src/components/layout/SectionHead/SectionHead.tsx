import React from 'react';
import { cx } from '../../../utils/cx';
import s from './SectionHead.module.css';

export interface SectionHeadProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'center';
  className?: string;
}

/**
 * Page-section header that sits between PageHeader (page title) and
 * CardHead (header inside a card). Editorial feel — eyebrow rule,
 * Serif title at lg size, sub line, optional action on the right.
 */
export function SectionHead({
  eyebrow,
  title,
  sub,
  action,
  size = 'md',
  align = 'start',
  className,
}: SectionHeadProps) {
  return (
    <div
      className={cx(
        s.head,
        size === 'sm' && s.sm,
        size === 'lg' && s.lg,
        align === 'center' && s.center,
        className,
      )}
    >
      <div className={s.text}>
        {eyebrow && <div className={s.eyebrow}>{eyebrow}</div>}
        <h2 className={s.title}>{title}</h2>
        {sub && <div className={s.sub}>{sub}</div>}
      </div>
      {action && <div className={s.action}>{action}</div>}
    </div>
  );
}
