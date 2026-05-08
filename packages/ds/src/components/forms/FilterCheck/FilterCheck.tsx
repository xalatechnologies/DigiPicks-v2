import React from 'react';
import { cx } from '../../../utils/cx';
import { Checkbox } from '../../atoms/Checkbox/Checkbox';
import s from './FilterCheck.module.css';

export interface FilterCheckProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  count?: number | string;
  name?: string;
  disabled?: boolean;
  className?: string;
}

export function FilterCheck({
  checked,
  onChange,
  label,
  count,
  name,
  disabled,
  className,
}: FilterCheckProps) {
  return (
    <label className={cx(s.row, checked && s.active, disabled && s.disabled, className)}>
      <Checkbox
        checked={checked}
        onChange={(next) => onChange(next)}
        name={name}
        disabled={disabled}
      />
      <span className={s.label}>{label}</span>
      {count != null && <span className={s.count}>{count}</span>}
    </label>
  );
}
