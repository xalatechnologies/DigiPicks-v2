import React from 'react';
import { cx } from '../../../utils/cx';
import { Search } from '../../forms/Search/Search';
import s from './AdminAuditFilterBar.module.css';

export interface AdminAuditFilterOption {
  value: string;
  label: string;
}

export interface AdminAuditFilterBarProps {
  entityOptions: AdminAuditFilterOption[];
  entity: string;
  onEntityChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
}

export function AdminAuditFilterBar({
  entityOptions,
  entity,
  onEntityChange,
  search,
  onSearchChange,
  className,
}: AdminAuditFilterBarProps) {
  return (
    <section className={cx(s.bar, className)} aria-label="Filter audit log">
      <div className={s.toolbar}>
        <div className={s.filters} role="tablist" aria-label="Entity type">
          {entityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={entity === opt.value}
              className={cx(s.filterBtn, entity === opt.value && s.filterBtnActive)}
              onClick={() => onEntityChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className={s.searchRow}>
          <Search
            layout="toolbar"
            placeholder="Search action, entity, or ID…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search audit log"
          />
        </div>
      </div>
    </section>
  );
}
