import React from 'react';
import { cx } from '../../../utils/cx';
import s from './StudioFilterPills.module.css';

export interface StudioFilterPillOption {
  label: string;
  value: string;
}

export interface StudioFilterPillsProps {
  options: StudioFilterPillOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function StudioFilterPills({
  options,
  value,
  onChange,
  ariaLabel = 'Filter picks',
  className,
}: StudioFilterPillsProps) {
  return (
    <div className={cx(s.wrap, className)} role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={cx(s.pill, value === opt.value && s.on)}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
