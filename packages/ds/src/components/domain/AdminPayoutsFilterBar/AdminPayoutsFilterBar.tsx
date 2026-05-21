import React from 'react';
import { cx } from '../../../utils/cx';
import { Search } from '../../forms/Search/Search';
import s from './AdminPayoutsFilterBar.module.css';

export interface AdminPayoutsFilterOption {
  value: string;
  label: string;
}

export interface AdminPayoutsFilterBarProps {
  connectOptions: AdminPayoutsFilterOption[];
  connect: string;
  onConnectChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  issuesCount?: number;
  issuesOnly?: boolean;
  onIssuesChange?: (active: boolean) => void;
  onClearFilters?: () => void;
  className?: string;
}

export function AdminPayoutsFilterBar({
  connectOptions,
  connect,
  onConnectChange,
  search,
  onSearchChange,
  issuesCount = 0,
  issuesOnly,
  onIssuesChange,
  onClearFilters,
  className,
}: AdminPayoutsFilterBarProps) {
  const showQuick = issuesCount > 0 && onIssuesChange;

  return (
    <section className={cx(s.bar, className)} aria-label="Filter payouts">
      <div className={s.toolbar}>
        <div className={s.filters} role="tablist" aria-label="Connect status">
          {connectOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={connect === opt.value}
              className={cx(s.filterBtn, connect === opt.value && s.filterBtnActive)}
              onClick={() => onConnectChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className={s.searchRow}>
          <Search
            layout="toolbar"
            placeholder="Search creators, handles, or Connect IDs…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search payouts"
          />
        </div>
      </div>

      {showQuick ? (
        <div className={s.quickRow}>
          <p className={s.quickLabel}>Quick filters</p>
          <button
            type="button"
            className={cx(s.quickChip, issuesOnly && s.quickChipActive)}
            onClick={() => onIssuesChange(!issuesOnly)}
          >
            Failed / restricted ({issuesCount})
          </button>
          {onClearFilters ? (
            <button type="button" className={s.clearBtn} onClick={onClearFilters}>
              Clear all filters
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
