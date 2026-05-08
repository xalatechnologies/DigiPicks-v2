import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Radio.module.css';

export interface RadioProps
  extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  name?: string;
  value?: string;
}

export const Radio = React.forwardRef<HTMLLabelElement, RadioProps>(function Radio(
  { checked, onChange, label, disabled, name, value, className, ...rest },
  ref,
) {
  return (
    <label ref={ref} className={cx(s.row, disabled && s.disabled, className)} {...rest}>
      <input
        type="radio"
        className={s.input}
        checked={checked}
        disabled={disabled}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={cx(s.radio, checked && s.on)} aria-hidden="true" />
      {label != null && <span className={s.label}>{label}</span>}
    </label>
  );
});
