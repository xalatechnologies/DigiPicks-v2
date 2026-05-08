import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../Icon/Icon';
import s from './Checkbox.module.css';

export interface CheckboxProps
  extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  name?: string;
}

export const Checkbox = React.forwardRef<HTMLLabelElement, CheckboxProps>(function Checkbox(
  { checked, onChange, label, disabled, name, className, ...rest },
  ref,
) {
  return (
    <label ref={ref} className={cx(s.row, disabled && s.disabled, className)} {...rest}>
      <input
        type="checkbox"
        className={s.input}
        checked={checked}
        disabled={disabled}
        name={name}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={cx(s.check, checked && s.on)} aria-hidden="true">
        <Icon name="check" size={11} />
      </span>
      {label != null && <span className={s.label}>{label}</span>}
    </label>
  );
});
