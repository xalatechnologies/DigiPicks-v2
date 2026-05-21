import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from '../AdminSupportTable/AdminSupportTable.module.css';

export interface AdminCouponRow {
  id: string;
  code: string;
  discountLabel: string;
  stripeCouponId: string;
  redemptionLabel: string;
  expiresLabel: string;
  capped?: boolean;
}

export interface AdminCouponsTableProps {
  rows: AdminCouponRow[];
  selectedId?: string | null;
  loading?: boolean;
  footerLabel?: string;
  onSelect: (id: string) => void;
  onArchive: (id: string) => void;
  className?: string;
}

export function AdminCouponsTable({
  rows,
  selectedId,
  loading,
  footerLabel,
  onSelect,
  onArchive,
  className,
}: AdminCouponsTableProps) {
  if (loading) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="tag" title="Loading coupons…" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState
            icon="tag"
            title="No coupons yet"
            subtitle="Create a coupon to start running promos."
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cx(s.wrap, className)}>
      <div className={s.scroll}>
        <table className={s.table}>
          <thead>
            <tr className={s.headRow}>
              <th className={s.th}>Code</th>
              <th className={s.th}>Discount</th>
              <th className={s.th}>Stripe ID</th>
              <th className={s.th}>Redeemed</th>
              <th className={s.th}>Expires</th>
              <th className={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = selectedId === row.id;
              return (
                <tr
                  key={row.id}
                  className={cx(s.row, selected && s.rowSelected)}
                  onClick={() => onSelect(row.id)}
                >
                  <td className={s.td}>
                    <p className={s.ticket}>{row.code}</p>
                  </td>
                  <td className={s.td}>
                    <p className={s.issue}>{row.discountLabel}</p>
                  </td>
                  <td className={s.td}>
                    <p className={s.issue}>{row.stripeCouponId}</p>
                  </td>
                  <td className={s.td}>
                    <span className={row.capped ? s.priorityUrgent : s.priorityNormal}>
                      {row.redemptionLabel}
                    </span>
                  </td>
                  <td className={s.td}>
                    <span className={s.date}>{row.expiresLabel}</span>
                  </td>
                  <td className={s.td}>
                    <button
                      type="button"
                      className={s.priorityNormal}
                      aria-label={`Archive ${row.code}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(row.id);
                      }}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {footerLabel ? (
        <footer className={s.footer}>
          <p className={s.footerMeta}>{footerLabel}</p>
        </footer>
      ) : null}
    </div>
  );
}
