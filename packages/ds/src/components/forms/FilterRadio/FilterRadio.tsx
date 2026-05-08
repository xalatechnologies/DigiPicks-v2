import React from 'react';
import { cx } from '../../../utils/cx';
import { Radio } from '../../atoms/Radio/Radio';
import s from './FilterRadio.module.css';

export interface FilterRadioProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  count?: number | string;
  name?: string;
  value?: string;
  disabled?: boolean;
  className?: string;
}

export function FilterRadio({
  checked,
  onChange,
  label,
  count,
  name,
  value,
  disabled,
  className,
}: FilterRadioProps) {
  return (
    <label className={cx(s.row, checked && s.active, disabled && s.disabled, className)}>
      <Radio
        checked={checked}
        onChange={(next) => onChange(next)}
        name={name}
        value={value}
        disabled={disabled}
      />
      <span className={s.label}>{label}</span>
      {count != null && <span className={s.count}>{count}</span>}
    </label>
  );
}
