import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './AdminBillingTable.module.css';

export type AdminBillingStatusTone = 'green' | 'amber' | 'red' | 'mute';
export type AdminBillingHealthTone = 'green' | 'amber' | 'red' | 'mute';

export interface AdminBillingRow {
  id: string;
  monogram: string;
  subscriberName: string;
  subscriberEmail: string;
  creatorLabel: string;
  planLabel: string;
  priceLabel: string;
  statusLabel: string;
  statusTone: AdminBillingStatusTone;
  renewalLabel: string;
  healthLabel: string;
  healthTone: AdminBillingHealthTone;
}

export interface AdminBillingTableProps {
  rows: AdminBillingRow[];
  selectedId?: string | null;
  loading?: boolean;
  footerLabel?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  onSelect: (id: string) => void;
  className?: string;
}

const STATUS_CLASS: Record<AdminBillingStatusTone, string> = {
  green: s.statusGreen,
  amber: s.statusAmber,
  red: s.statusRed,
  mute: s.statusMute,
};

const HEALTH_CLASS: Record<AdminBillingHealthTone, { dot: string; label: string }> = {
  green: { dot: s.dotGreen, label: s.healthGreen },
  amber: { dot: s.dotAmber, label: s.healthAmber },
  red: { dot: s.dotRed, label: s.healthRed },
  mute: { dot: s.dotMute, label: s.healthMute },
};

export function AdminBillingTable({
  rows,
  selectedId,
  loading,
  footerLabel,
  emptyTitle = 'No subscriptions',
  emptySubtitle = 'Try adjusting filters or search.',
  onSelect,
  className,
}: AdminBillingTableProps) {
  if (loading) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="card" title="Loading subscriptions…" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="card" title={emptyTitle} subtitle={emptySubtitle} />
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
              <th className={s.th}>Subscriber</th>
              <th className={s.th}>Creator</th>
              <th className={s.th}>Plan</th>
              <th className={s.th}>Price</th>
              <th className={s.th}>Status</th>
              <th className={s.th}>Renewal</th>
              <th className={s.th}>Health</th>
              <th className={cx(s.th, s.thRight)}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = selectedId === row.id;
              const healthCls = HEALTH_CLASS[row.healthTone];
              return (
                <tr
                  key={row.id}
                  className={cx(s.row, selected && s.rowSelected)}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect(row.id)}
                >
                  <td className={s.td}>
                    <div className={s.subscriber}>
                      <span className={s.avatar} aria-hidden>
                        {row.monogram}
                      </span>
                      <div className={s.subCopy}>
                        <p className={s.subName}>{row.subscriberName}</p>
                        <p className={s.subEmail}>{row.subscriberEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className={s.td}>
                    <span className={s.creator}>{row.creatorLabel}</span>
                  </td>
                  <td className={s.td}>
                    <span className={s.plan}>{row.planLabel}</span>
                  </td>
                  <td className={s.td}>
                    <span className={s.price}>{row.priceLabel}</span>
                  </td>
                  <td className={s.td}>
                    <span className={cx(s.statusPill, STATUS_CLASS[row.statusTone])}>
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className={s.td}>
                    <span className={s.renewal}>{row.renewalLabel}</span>
                  </td>
                  <td className={s.td}>
                    <span className={s.health}>
                      <span className={cx(s.dot, healthCls.dot)} aria-hidden />
                      <span className={healthCls.label}>{row.healthLabel}</span>
                    </span>
                  </td>
                  <td className={s.td}>
                    <div className={s.actions}>
                      <button
                        type="button"
                        className={s.iconBtn}
                        aria-label={`Inspect ${row.subscriberName}`}
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
