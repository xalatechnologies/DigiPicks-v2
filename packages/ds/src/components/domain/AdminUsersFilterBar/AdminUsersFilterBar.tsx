import React from 'react';
import { cx } from '../../../utils/cx';
import { Search } from '../../forms/Search/Search';
import { Select } from '../../forms/Select/Select';
import s from './AdminUsersFilterBar.module.css';

export interface AdminUsersFilterOption {
  value: string;
  label: string;
}

export interface AdminUsersFilterBarProps {
  typeOptions: AdminUsersFilterOption[];
  type: string;
  onTypeChange: (value: string) => void;
  accountOptions: AdminUsersFilterOption[];
  account: string;
  onAccountChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  billingIssueCount?: number;
  quickFilter?: 'billing' | null;
  onQuickFilterChange?: (value: 'billing' | null) => void;
  onClearFilters?: () => void;
  className?: string;
}

export function AdminUsersFilterBar({
  typeOptions,
  type,
  onTypeChange,
  accountOptions,
  account,
  onAccountChange,
  search,
  onSearchChange,
  billingIssueCount = 0,
  quickFilter,
  onQuickFilterChange,
  onClearFilters,
  className,
}: AdminUsersFilterBarProps) {
  const hasQuick = billingIssueCount > 0 && onQuickFilterChange;

  return (
    <section className={cx(s.bar, className)} aria-label="Filter users">
      <div className={s.toolbar}>
        <div className={s.filters} role="tablist" aria-label="User type">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={type === opt.value}
              className={cx(s.filterBtn, type === opt.value && s.filterBtnActive)}
              onClick={() => onTypeChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className={s.metaTools}>
          <Select
            value={account}
            onChange={(e) => onAccountChange(e.target.value)}
            aria-label="Filter by account state"
          >
            {accountOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className={s.searchRow}>
          <Search
            layout="toolbar"
            placeholder="Search by name, email, or user ID…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search users"
          />
        </div>
      </div>

      {hasQuick ? (
        <div className={s.quickRow}>
          <p className={s.quickLabel}>Quick filters</p>
          <button
            type="button"
            className={cx(
              s.quickChip,
              s.chipBilling,
              quickFilter === 'billing' && s.chipBillingActive,
              quickFilter === 'billing' && s.quickChipActive,
            )}
            onClick={() => onQuickFilterChange(quickFilter === 'billing' ? null : 'billing')}
          >
            Billing issues ({billingIssueCount})
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
