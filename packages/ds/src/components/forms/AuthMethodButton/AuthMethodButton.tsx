import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './AuthMethodButton.module.css';

export interface AuthMethodButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon rendered in the leading circle. */
  icon: React.ReactNode;
  /** Primary label — e.g. "Log in with email" */
  label: string;
  /** Secondary description — e.g. "We'll send a one-time code to your email" */
  description?: string;
  /** Show trailing arrow indicator */
  arrow?: boolean;
}

/**
 * Styled auth method row — email OTP, SMS, Google, etc.
 * Pure presentational; onClick handled by the consumer.
 */
export const AuthMethodButton = React.forwardRef<
  HTMLButtonElement,
  AuthMethodButtonProps
>(function AuthMethodButton(
  { icon, label, description, arrow = true, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cx(s.methodBtn, className)}
      {...rest}
    >
      <span className={s.iconWrap}>{icon}</span>
      <span className={s.text}>
        <span className={s.label}>{label}</span>
        {description && <span className={s.desc}>{description}</span>}
      </span>
      {arrow && (
        <span className={s.arrow}>
          <Icon name="arrow-right" size={16} />
        </span>
      )}
    </button>
  );
});

/** Saved email group header — "Previously used emails" label. */
export function AuthSavedGroup({
  label = 'Previously used emails',
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={s.savedGroup}>
      <span className={s.savedLabel}>{label}</span>
      {children}
    </div>
  );
}
