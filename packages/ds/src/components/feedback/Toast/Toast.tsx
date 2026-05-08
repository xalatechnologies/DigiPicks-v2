import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Toast.module.css';

export type ToastTone = 'default' | 'success' | 'error';

export interface ToastProps {
  tone?: ToastTone;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({ tone = 'default', icon, children, className }) => {
  return (
    <div className={cx(s.toast, s[tone], className)} role="status" aria-live="polite">
      {icon && <span className={s.icon}>{icon}</span>}
      <span className={s.body}>{children}</span>
    </div>
  );
};
