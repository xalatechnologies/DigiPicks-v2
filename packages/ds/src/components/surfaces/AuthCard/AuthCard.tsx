import React from 'react';
import { cx } from '../../../utils/cx';
import s from './AuthCard.module.css';

export interface AuthCardProps {
  /** Card title — e.g. "Sign In", "Create Account" */
  title: string;
  /** Subtitle below the title */
  subtitle?: string;
  /** Error message shown as a banner above the form body */
  error?: string;
  /** Footer content — typically a "Don't have an account?" toggle */
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Centered auth card container.
 * Composes with Field + Input + Button for login/signup forms.
 * Pure presentational — no auth logic baked in.
 */
export function AuthCard({ title, subtitle, error, footer, className, children }: AuthCardProps) {
  return (
    <div className={cx(s.authCard, className)}>
      <div className={s.header}>
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {error && (
        <div className={s.error} role="alert">
          {error}
        </div>
      )}
      <div className={s.body}>{children}</div>
      {footer && <div className={s.footer}>{footer}</div>}
    </div>
  );
}

/** Separator line with text, e.g. "or continue with" */
export function AuthDivider({ text = 'or' }: { text?: string }) {
  return <div className={s.divider}>{text}</div>;
}

/** Footer text + link helper */
export function AuthFooterLink({
  text,
  linkText,
  onClick,
}: {
  text: string;
  linkText: string;
  onClick: () => void;
}) {
  return (
    <p className={s.footerText}>
      {text}{' '}
      <button type="button" className={s.footerLink} onClick={onClick}>
        {linkText}
      </button>
    </p>
  );
}
