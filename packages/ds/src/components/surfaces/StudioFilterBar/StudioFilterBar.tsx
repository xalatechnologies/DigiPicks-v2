import React from 'react';
import { cx } from '../../../utils/cx';
import { Search } from '../../forms/Search/Search';
import {
  StudioFilterPills,
  type StudioFilterPillOption,
} from '../StudioFilterPills/StudioFilterPills';
import s from './StudioFilterBar.module.css';

export interface StudioFilterBarSearchProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  'aria-label'?: string;
}

export interface StudioFilterBarProps {
  options: StudioFilterPillOption[];
  value: string;
  onChange: (value: string) => void;
  search?: StudioFilterBarSearchProps;
  trailing?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

/** Single-line filter pills, optional search, and trailing controls (sort, etc.). */
export function StudioFilterBar({
  options,
  value,
  onChange,
  search,
  trailing,
  ariaLabel,
  className,
}: StudioFilterBarProps) {
  return (
    <div className={cx(s.bar, className)}>
      <StudioFilterPills
        options={options}
        value={value}
        onChange={onChange}
        ariaLabel={ariaLabel}
        nowrap
        className={s.pills}
      />
      {search ? (
        <div className={s.searchSlot}>
          <Search layout="toolbar" {...search} />
        </div>
      ) : null}
      {trailing ? <div className={s.trailing}>{trailing}</div> : null}
    </div>
  );
}
