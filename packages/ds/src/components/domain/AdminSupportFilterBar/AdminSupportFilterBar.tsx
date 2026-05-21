import React from 'react';
import { cx } from '../../../utils/cx';
import { Search } from '../../forms/Search/Search';
import s from './AdminSupportFilterBar.module.css';

export interface AdminSupportFilterOption {
  value: string;
  label: string;
}

export interface AdminSupportFilterBarProps {
  queueOptions: AdminSupportFilterOption[];
  queue: string;
  onQueueChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  urgentOnly?: boolean;
  onUrgentChange?: (active: boolean) => void;
  slaAtRiskCount?: number;
  onSlaAtRiskChange?: (active: boolean) => void;
  slaAtRiskOnly?: boolean;
  onClearFilters?: () => void;
  className?: string;
}

export function AdminSupportFilterBar({
  queueOptions,
  queue,
  onQueueChange,
  search,
  onSearchChange,
  urgentOnly,
  onUrgentChange,
  slaAtRiskCount = 0,
  onSlaAtRiskChange,
  slaAtRiskOnly,
  onClearFilters,
  className,
}: AdminSupportFilterBarProps) {
  const showQuick = onUrgentChange || (slaAtRiskCount > 0 && onSlaAtRiskChange);

  return (
    <section className={cx(s.bar, className)} aria-label="Filter support queue">
      <div className={s.toolbar}>
        <div className={s.filters} role="tablist" aria-label="Queue type">
          {queueOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={queue === opt.value}
              className={cx(s.filterBtn, queue === opt.value && s.filterBtnActive)}
              onClick={() => onQueueChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className={s.searchRow}>
          <Search
            layout="toolbar"
            placeholder="Search tickets, users, case numbers…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search support queue"
          />
        </div>
      </div>

      {showQuick ? (
        <div className={s.quickRow}>
          <p className={s.quickLabel}>Quick filters</p>
          {onUrgentChange ? (
            <button
              type="button"
              className={cx(s.quickChip, urgentOnly && s.quickChipActive)}
              onClick={() => onUrgentChange(!urgentOnly)}
            >
              High priority
            </button>
          ) : null}
          {slaAtRiskCount > 0 && onSlaAtRiskChange ? (
            <button
              type="button"
              className={cx(s.quickChip, slaAtRiskOnly && s.quickChipActive)}
              onClick={() => onSlaAtRiskChange(!slaAtRiskOnly)}
            >
              SLA at risk ({slaAtRiskCount})
            </button>
          ) : null}
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
