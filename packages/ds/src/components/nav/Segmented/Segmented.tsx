import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Segmented.module.css';

export interface SegmentedOption {
  label: string;
  value: string;
}

export interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  ariaLabel?: string;
}

export const Segmented: React.FC<SegmentedProps> = ({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}) => {
  return (
    <div className={cx(s.toggle, className)} role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={cx(s.btn, value === opt.value && s.on)}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
