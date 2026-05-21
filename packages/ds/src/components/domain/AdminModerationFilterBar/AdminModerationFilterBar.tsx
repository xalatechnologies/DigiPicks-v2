import React from 'react';
import { cx } from '../../../utils/cx';
import { Search } from '../../forms/Search/Search';
import s from './AdminModerationFilterBar.module.css';

export interface AdminModerationFilterOption {
  value: string;
  label: string;
}

export interface AdminModerationFilterBarProps {
  typeOptions: AdminModerationFilterOption[];
  type: string;
  onTypeChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
}

export function AdminModerationFilterBar({
  typeOptions,
  type,
  onTypeChange,
  search,
  onSearchChange,
  className,
}: AdminModerationFilterBarProps) {
  return (
    <section className={cx(s.bar, className)} aria-label="Filter moderation queue">
      <div className={s.toolbar}>
        <div className={s.filters} role="tablist" aria-label="Content type">
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
        <div className={s.searchRow}>
          <Search
            layout="toolbar"
            placeholder="Search subject, creator, or reason…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search moderation queue"
          />
        </div>
      </div>
    </section>
  );
}
