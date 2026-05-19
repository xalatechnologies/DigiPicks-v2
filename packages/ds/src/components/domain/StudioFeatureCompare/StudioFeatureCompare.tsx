import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './StudioFeatureCompare.module.css';

export interface StudioFeatureCompareRow {
  id?: string | number;
  label: string;
  free: boolean;
  premium: boolean;
  vip: boolean;
}

export interface StudioFeatureCompareProps {
  title?: string;
  columns?: { free: string; premium: string; vip: string };
  rows: StudioFeatureCompareRow[];
  className?: string;
}

export function StudioFeatureCompare({
  title = 'Feature Comparison',
  columns = { free: 'Free', premium: 'Premium', vip: 'VIP Elite' },
  rows,
  className,
}: StudioFeatureCompareProps) {
  return (
    <section className={cx(s.card, className)}>
      <h3 className={s.title}>{title}</h3>
      <div className={s.scroll}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Features</th>
              <th>{columns.free}</th>
              <th className={s.colPremium}>{columns.premium}</th>
              <th>{columns.vip}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id ?? i} className={s.row}>
                <td>{row.label}</td>
                <td>{cell(row.free)}</td>
                <td>{cell(row.premium)}</td>
                <td>{cell(row.vip)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function cell(on: boolean) {
  if (!on) return <span className={s.dash}>—</span>;
  return (
    <span className={s.check} aria-label="Included">
      <Icon name="check" size={18} />
    </span>
  );
}
