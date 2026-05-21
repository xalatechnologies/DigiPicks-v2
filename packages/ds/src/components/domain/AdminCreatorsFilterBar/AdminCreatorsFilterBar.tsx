import React from 'react';
import { cx } from '../../../utils/cx';
import { Search } from '../../forms/Search/Search';
import { Select } from '../../forms/Select/Select';
import s from './AdminCreatorsFilterBar.module.css';

export interface AdminCreatorsFilterOption {
  value: string;
  label: string;
}

export interface AdminCreatorsFilterBarProps {
  statusOptions: AdminCreatorsFilterOption[];
  status: string;
  onStatusChange: (value: string) => void;
  sportOptions: AdminCreatorsFilterOption[];
  sport: string;
  onSportChange: (value: string) => void;
  verifiedOptions: AdminCreatorsFilterOption[];
  verified: string;
  onVerifiedChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  summary?: string;
  className?: string;
}

export function AdminCreatorsFilterBar({
  statusOptions,
  status,
  onStatusChange,
  sportOptions,
  sport,
  onSportChange,
  verifiedOptions,
  verified,
  onVerifiedChange,
  search,
  onSearchChange,
  summary,
  className,
}: AdminCreatorsFilterBarProps) {
  return (
    <section className={cx(s.bar, className)} aria-label="Filter creators">
      {summary ? <p className={s.summary}>{summary}</p> : null}
      <div className={s.toolbar}>
        <div className={s.filters} role="tablist" aria-label="Creator status">
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
          <Select
            value={sport}
            onChange={(e) => onSportChange(e.target.value)}
            aria-label="Filter by sport"
          >
            {sportOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select
            value={verified}
            onChange={(e) => onVerifiedChange(e.target.value)}
            aria-label="Filter by verification"
          >
            {verifiedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className={s.searchRow}>
          <Search
            layout="toolbar"
            placeholder="Search creators, handles, or IDs…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search creators"
          />
        </div>
      </div>
    </section>
  );
}
