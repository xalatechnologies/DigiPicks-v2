import React from 'react';
import { cx } from '../../../utils/cx';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './AdminAuditTable.module.css';

export interface AdminAuditRow {
  id: string;
  action: string;
  entityType: string;
  entityIdLabel: string;
  timeLabel: string;
}

export interface AdminAuditTableProps {
  rows: AdminAuditRow[];
  selectedId?: string | null;
  loading?: boolean;
  footerLabel?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function AdminAuditTable({
  rows,
  selectedId,
  loading,
  footerLabel,
  emptyTitle = 'No audit entries',
  emptySubtitle = 'Try another filter or search.',
  onSelect,
  className,
}: AdminAuditTableProps) {
  if (loading) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="audit" title="Loading audit log…" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="audit" title={emptyTitle} subtitle={emptySubtitle} />
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
              <th className={s.th}>Action</th>
              <th className={s.th}>Entity</th>
              <th className={s.th}>When</th>
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
                    <p className={s.action}>{row.action}</p>
                  </td>
                  <td className={s.td}>
                    <p className={s.entity}>{row.entityType}</p>
                    <p className={s.entityId}>{row.entityIdLabel}</p>
                  </td>
                  <td className={s.td}>
                    <span className={s.time}>{row.timeLabel}</span>
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
