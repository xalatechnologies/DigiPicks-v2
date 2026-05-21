import React from 'react';
import { cx } from '../../../utils/cx';
import { AdminMetricCard, type AdminMetricCardProps } from '../AdminMetricCard/AdminMetricCard';
import s from './AdminMetricStrip.module.css';

export interface AdminMetricStripItem extends AdminMetricCardProps {
  id?: string | number;
}

export interface AdminMetricStripProps {
  items: AdminMetricStripItem[];
  /** Grid density — use `5` on creators management KPI rows. */
  columns?: 5 | 8;
  className?: string;
}

export function AdminMetricStrip({ items, columns = 8, className }: AdminMetricStripProps) {
  return (
    <div
      className={cx(s.strip, columns === 5 && s.stripFive, className)}
      role="list"
      aria-label="Key metrics"
    >
      {items.map((item, i) => {
        const { id, ...cardProps } = item;
        return (
          <div key={id ?? i} className={s.cell}>
            <AdminMetricCard {...cardProps} />
          </div>
        );
      })}
    </div>
  );
}
