import React from 'react';
import { cx } from '../../../utils/cx';
import s from './AccountDashboardSection.module.css';

export interface AccountDashboardSectionProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  rail?: boolean;
  className?: string;
}

export function AccountDashboardSection({
  title,
  actionLabel,
  onAction,
  children,
  rail,
  className,
}: AccountDashboardSectionProps) {
  return (
    <section className={cx(s.section, className)}>
      <header className={s.head}>
        <h2 className={s.eyebrow}>{title}</h2>
        {actionLabel && onAction ? (
          <button type="button" className={s.action} onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </header>
      <div className={rail ? s.rail : undefined}>{children}</div>
    </section>
  );
}
