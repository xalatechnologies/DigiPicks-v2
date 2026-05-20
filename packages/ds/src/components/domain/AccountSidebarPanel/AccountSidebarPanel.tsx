import React from 'react';
import { cx } from '../../../utils/cx';
import s from './AccountSidebarPanel.module.css';

export interface AccountSidebarPanelProps {
  title: string;
  variant?: 'default' | 'accent';
  children?: React.ReactNode;
  className?: string;
}

export function AccountSidebarPanel({
  title,
  variant = 'default',
  children,
  className,
}: AccountSidebarPanelProps) {
  return (
    <article className={cx(s.panel, variant === 'accent' && s.accent, className)}>
      <h3 className={cx(s.title, variant === 'accent' && s.accentTitle)}>{title}</h3>
      <div className={s.body}>{children}</div>
    </article>
  );
}
