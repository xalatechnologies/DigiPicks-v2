import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Field.module.css';

export interface FieldProps {
  label?: React.ReactNode;
  help?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, help, error, required, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cx(s.field, className)}>
      {label && (
        <label className={s.label} htmlFor={htmlFor}>
          {label}
          {required && (
            <span className={s.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {help && !error && <div className={s.help}>{help}</div>}
      {error && (
        <div className={s.error} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
