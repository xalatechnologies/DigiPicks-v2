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
  /** Larger touch targets and label size — good for auth and primary choices. */
  size?: 'sm' | 'md';
  /** Stretch to container width with equal segments (e.g. forms). */
  fullWidth?: boolean;
}

export const Segmented: React.FC<SegmentedProps> = ({
  options,
  value,
  onChange,
  className,
  ariaLabel,
  size = 'sm',
  fullWidth = false,
}) => {
  return (
    <div
      className={cx(s.toggle, fullWidth && s.fullWidth, size === 'md' && s.md, className)}
      role="group"
      aria-label={ariaLabel}
    >
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
