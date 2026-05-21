import React from 'react';
import { cx } from '../../../utils/cx';
import { Search } from '../../forms/Search/Search';
import s from './AdminBillingFilterBar.module.css';

export interface AdminBillingFilterOption {
  value: string;
  label: string;
}

export interface AdminBillingFilterBarProps {
  statusOptions: AdminBillingFilterOption[];
  status: string;
  onStatusChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  pastDueCount?: number;
  paymentIssueOnly?: boolean;
  onPaymentIssueChange?: (active: boolean) => void;
  onClearFilters?: () => void;
  className?: string;
}

export function AdminBillingFilterBar({
  statusOptions,
  status,
  onStatusChange,
  search,
  onSearchChange,
  pastDueCount = 0,
  paymentIssueOnly,
  onPaymentIssueChange,
  onClearFilters,
  className,
}: AdminBillingFilterBarProps) {
  const showQuick = pastDueCount > 0 && onPaymentIssueChange;

  return (
    <section className={cx(s.bar, className)} aria-label="Filter subscriptions">
      <div className={s.toolbar}>
        <div className={s.filters} role="tablist" aria-label="Subscription status">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={status === opt.value}
              className={cx(s.filterBtn, status === opt.value && s.filterBtnActive)}
              onClick={() => onStatusChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className={s.searchRow}>
          <Search
            layout="toolbar"
            placeholder="Search by subscriber, creator, or plan…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search subscriptions"
          />
        </div>
      </div>

      {showQuick ? (
        <div className={s.quickRow}>
          <p className={s.quickLabel}>Quick filters</p>
          <button
            type="button"
            className={cx(s.quickChip, paymentIssueOnly && s.quickChipActive)}
            onClick={() => onPaymentIssueChange(!paymentIssueOnly)}
          >
            Payment issues ({pastDueCount})
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
