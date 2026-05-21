import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './AdminPayoutsTable.module.css';

export type AdminPayoutStatusTone = 'green' | 'amber' | 'red' | 'mute';

export interface AdminPayoutRow {
  id: string;
  monogram: string;
  creatorName: string;
  nicheLine: string;
  paidLabel: string;
  upcomingAmountLabel: string;
  upcomingDateLabel: string;
  statusLabel: string;
  statusTone: AdminPayoutStatusTone;
  methodLabel: string;
}

export interface AdminPayoutsTableProps {
  rows: AdminPayoutRow[];
  selectedId?: string | null;
  loading?: boolean;
  footerLabel?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  onSelect: (id: string) => void;
  className?: string;
}

const STATUS_CLASS: Record<AdminPayoutStatusTone, string> = {
  green: s.statusGreen,
  amber: s.statusAmber,
  red: s.statusRed,
  mute: s.statusMute,
};

export function AdminPayoutsTable({
  rows,
  selectedId,
  loading,
  footerLabel,
  emptyTitle = 'No creators',
  emptySubtitle = 'Try adjusting filters or search.',
  onSelect,
  className,
}: AdminPayoutsTableProps) {
  if (loading) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="dollar" title="Loading payouts…" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="dollar" title={emptyTitle} subtitle={emptySubtitle} />
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
              <th className={s.th}>Creator</th>
              <th className={s.th}>Paid to date</th>
              <th className={s.th}>Upcoming</th>
              <th className={s.th}>Status</th>
              <th className={s.th}>Method</th>
              <th className={cx(s.th, s.thRight)}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = selectedId === row.id;
              return (
                <tr
                  key={row.id}
                  className={cx(s.row, selected && s.rowSelected)}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect(row.id)}
                >
                  <td className={s.td}>
                    <div className={s.creator}>
                      <span className={s.avatar} aria-hidden>
                        {row.monogram}
                      </span>
                      <div className={s.creatorCopy}>
                        <p className={s.creatorName}>{row.creatorName}</p>
                        <p className={s.creatorNiche}>{row.nicheLine}</p>
                      </div>
                    </div>
                  </td>
                  <td className={s.td}>
                    <span className={s.amount}>{row.paidLabel}</span>
                  </td>
                  <td className={s.td}>
                    <div className={s.upcoming}>
                      <span className={s.upcomingAmount}>{row.upcomingAmountLabel}</span>
                      <span className={s.upcomingDate}>{row.upcomingDateLabel}</span>
                    </div>
                  </td>
                  <td className={s.td}>
                    <span className={cx(s.statusPill, STATUS_CLASS[row.statusTone])}>
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className={s.td}>
                    <span className={s.methodPill}>
                      <Icon name="card" size={14} />
                      {row.methodLabel}
                    </span>
                  </td>
                  <td className={s.td}>
                    <div className={s.actions}>
                      <button
                        type="button"
                        className={s.iconBtn}
                        aria-label={`Inspect ${row.creatorName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(row.id);
                        }}
                      >
                        <Icon name="eye" size={16} />
                      </button>
                    </div>
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
