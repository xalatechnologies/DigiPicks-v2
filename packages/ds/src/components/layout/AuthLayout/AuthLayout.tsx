import React from 'react';
import { cx } from '../../../utils/cx';
import s from './AuthLayout.module.css';

export interface AuthLayoutProps {
  /** Logo element rendered above the card */
  logo?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Full-screen centered layout for auth pages (sign in, sign up, forgot password).
 * Place an AuthCard inside children.
 */
export function AuthLayout({ logo, className, children }: AuthLayoutProps) {
  return (
    <div className={cx(s.layout, className)}>
      {logo && <div className={s.logo}>{logo}</div>}
      <div className={s.content}>{children}</div>
    </div>
  );
}
