import React from 'react';
import { cx } from '../../../utils/cx';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './AdminSupportTable.module.css';

export type AdminSupportStatusTone = 'green' | 'amber' | 'red' | 'mute';

export interface AdminSupportRow {
  id: string;
  kind: 'pick' | 'billing';
  ticketLabel: string;
  partyName: string;
  partyRole: string;
  issueLabel: string;
  priorityLabel: string;
  priorityUrgent: boolean;
  statusLabel: string;
  statusTone: AdminSupportStatusTone;
  createdLabel: string;
  slaAtRisk?: boolean;
}

export interface AdminSupportTableProps {
  rows: AdminSupportRow[];
  selectedId?: string | null;
  selectedKind?: 'pick' | 'billing' | null;
  loading?: boolean;
  footerLabel?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  onSelect: (id: string, kind: 'pick' | 'billing') => void;
  className?: string;
}

const STATUS_CLASS: Record<AdminSupportStatusTone, string> = {
  green: s.statusGreen,
  amber: s.statusAmber,
  red: s.statusRed,
  mute: s.statusMute,
};

export function AdminSupportTable({
  rows,
  selectedId,
  selectedKind,
  loading,
  footerLabel,
  emptyTitle = 'No tickets',
  emptySubtitle = 'Nothing matches the current filters.',
  onSelect,
  className,
}: AdminSupportTableProps) {
  if (loading) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="inbox" title="Loading support queue…" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="inbox" title={emptyTitle} subtitle={emptySubtitle} />
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
              <th className={s.th}>Ticket ID</th>
              <th className={s.th}>User / Creator</th>
              <th className={s.th}>Issue type</th>
              <th className={s.th}>Priority</th>
              <th className={s.th}>Status</th>
              <th className={s.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = selectedId === row.id && selectedKind === row.kind;
              return (
                <tr
                  key={`${row.kind}:${row.id}`}
                  className={cx(s.row, selected && s.rowSelected, row.slaAtRisk && s.rowSla)}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect(row.id, row.kind)}
                >
                  <td className={s.td}>
                    <p className={s.ticket}>{row.ticketLabel}</p>
                  </td>
                  <td className={s.td}>
                    <div className={s.party}>
                      <p className={s.partyName}>{row.partyName}</p>
                      <p className={s.partyRole}>{row.partyRole}</p>
                    </div>
                  </td>
                  <td className={s.td}>
                    <p className={s.issue}>{row.issueLabel}</p>
                  </td>
                  <td className={s.td}>
                    <span className={row.priorityUrgent ? s.priorityUrgent : s.priorityNormal}>
                      {row.priorityLabel}
                    </span>
                  </td>
                  <td className={s.td}>
                    <span className={cx(s.statusPill, STATUS_CLASS[row.statusTone])}>
                      <span className={s.statusDot} aria-hidden />
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className={s.td}>
                    <span className={s.date}>{row.createdLabel}</span>
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
