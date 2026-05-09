import React from 'react';
import { cx } from '../../../utils/cx';
import { Chip } from '../../atoms/Chip/Chip';
import s from './FilterChips.module.css';

export interface FilterChipsOption {
  label: string;
  value: string;
  /** Optional icon to render before the label. */
  icon?: React.ReactNode;
}

export interface FilterChipsProps {
  /** Options that map to a non-null value. */
  options: FilterChipsOption[] | string[];
  /** Currently selected value, or null when the "all" chip is active. */
  value: string | null;
  /** Called with the next value, or null when the "all" chip is clicked. */
  onChange: (next: string | null) => void;
  /** Label for the "all" chip. Defaults to "All". */
  allLabel?: string;
  className?: string;
}

/**
 * Single-select chip row with a leading "All" reset chip.
 * Replaces the repeated `<Row><Chip>All</Chip>{items.map(<Chip/>)}</Row>`
 * pattern in Picks and Subscribers.
 */
export function FilterChips({
  options,
  value,
  onChange,
  allLabel = 'All',
  className,
}: FilterChipsProps) {
  const normalized: FilterChipsOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt,
  );

  return (
    <div className={cx(s.row, className)} role="group">
      <Chip active={value === null} onClick={() => onChange(null)}>
        {allLabel}
      </Chip>
      {normalized.map((opt) => (
        <Chip
          key={opt.value}
          active={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon && <span className={s.chipIcon}>{opt.icon}</span>}
          {opt.label}
        </Chip>
      ))}
    </div>
  );
}
