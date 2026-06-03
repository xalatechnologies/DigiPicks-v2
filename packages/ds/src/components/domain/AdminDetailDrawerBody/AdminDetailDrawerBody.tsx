import React from 'react';
import { cx } from '../../../utils/cx';
import s from './AdminDetailDrawerBody.module.css';

export interface AdminDetailDrawerBodyProps {
  title: string;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  footer?: React.ReactNode;
  /** `grid` — two-column primary actions; `row` — wrapped row; `stack` — single column. */
  footerLayout?: 'grid' | 'row' | 'stack';
  children?: React.ReactNode;
  className?: string;
}

export interface AdminDetailMetaCardProps {
  label: string;
  value?: string;
}

export function AdminDetailMetaCard({ label, value }: AdminDetailMetaCardProps) {
  return (
    <div className={s.metaCard}>
      <p className={s.metaLabel}>{label}</p>
      <p className={s.metaValue}>{value ?? '—'}</p>
    </div>
  );
}

export interface AdminDetailSectionProps {
  title: string;
  children?: React.ReactNode;
}

export function AdminDetailSection({ title, children }: AdminDetailSectionProps) {
  return (
    <section>
      <h4 className={s.sectionTitle}>{title}</h4>
      {children}
    </section>
  );
}

export function AdminDetailDrawerBody({
  title,
  subtitle,
  badges,
  footer,
  footerLayout = 'row',
  children,
  className,
}: AdminDetailDrawerBodyProps) {
  const footerClass =
    footerLayout === 'grid'
      ? s.actions
      : footerLayout === 'stack'
        ? s.actionsSingle
        : s.actionsWide;

  return (
    <div className={cx(s.wrap, className)}>
      <header className={s.header}>
        <h2 className={s.title}>{title}</h2>
        {subtitle ? <div className={s.subtitle}>{subtitle}</div> : null}
        {badges ? <div className={s.badges}>{badges}</div> : null}
      </header>
      <div className={s.scroll}>{children}</div>
      {footer ? (
        <footer className={s.footer}>
          <div className={footerClass}>{footer}</div>
        </footer>
      ) : null}
    </div>
  );
}
