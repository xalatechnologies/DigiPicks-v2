import React from 'react';
import { cx } from '../../../utils/cx';
import { Search } from '../../forms/Search/Search';
import { Select } from '../../forms/Select/Select';
import s from './AdminCampaignsFilterBar.module.css';

export interface AdminCampaignsFilterOption {
  value: string;
  label: string;
}

export interface AdminCampaignsFilterBarProps {
  statusOptions: AdminCampaignsFilterOption[];
  status: string;
  onStatusChange: (value: string) => void;
  channelOptions: AdminCampaignsFilterOption[];
  channel: string;
  onChannelChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
}

export function AdminCampaignsFilterBar({
  statusOptions,
  status,
  onStatusChange,
  channelOptions,
  channel,
  onChannelChange,
  search,
  onSearchChange,
  className,
}: AdminCampaignsFilterBarProps) {
  return (
    <section className={cx(s.bar, className)} aria-label="Filter campaigns">
      <div className={s.toolbar}>
        <div className={s.filters} role="tablist" aria-label="Campaign status">
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
            value={channel}
            onChange={(e) => onChannelChange(e.target.value)}
            aria-label="Filter by channel"
          >
            {channelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className={s.searchRow}>
          <Search
            layout="toolbar"
            placeholder="Search campaigns by title or content…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search campaigns"
          />
        </div>
      </div>
    </section>
  );
}
