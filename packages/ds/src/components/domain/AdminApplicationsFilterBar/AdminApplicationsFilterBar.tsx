import React from 'react';
import { cx } from '../../../utils/cx';
import { Search } from '../../forms/Search/Search';
import { Select } from '../../forms/Select/Select';
import s from './AdminApplicationsFilterBar.module.css';

export interface AdminApplicationsFilterOption {
  value: string;
  label: string;
}

export interface AdminApplicationsFilterBarProps {
  statusOptions: AdminApplicationsFilterOption[];
  status: string;
  onStatusChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  nicheOptions: AdminApplicationsFilterOption[];
  niche: string;
  onNicheChange: (value: string) => void;
  summary?: string;
  className?: string;
}

export function AdminApplicationsFilterBar({
  statusOptions,
  status,
  onStatusChange,
  search,
  onSearchChange,
  nicheOptions,
  niche,
  onNicheChange,
  summary,
  className,
}: AdminApplicationsFilterBarProps) {
  return (
    <section className={cx(s.bar, className)} aria-label="Filter applications">
      <div className={s.toolbar}>
        <div className={s.filters} role="tablist" aria-label="Application status">
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
        <div className={s.metaTools}>
          {summary ? <p className={s.summary}>{summary}</p> : null}
          <Select
            value={niche}
            onChange={(e) => onNicheChange(e.target.value)}
            aria-label="Filter by sport or niche"
          >
            {nicheOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className={s.searchRow}>
          <Search
            layout="toolbar"
            placeholder="Search by name, handle, or email…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search applications"
          />
        </div>
      </div>
    </section>
  );
}
