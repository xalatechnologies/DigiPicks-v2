import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon, type IconName } from '../../atoms/Icon/Icon';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './AdminModerationTable.module.css';

export type AdminModerationSeverity = 'critical' | 'high' | 'normal';
export type AdminModerationStatusTone = 'amber' | 'blue' | 'mute';

export interface AdminModerationRow {
  key: string;
  typeLabel: string;
  typeIcon: IconName;
  subject: string;
  creatorLabel: string;
  reason: string;
  severity: AdminModerationSeverity;
  severityLabel: string;
  flaggedAtLabel: string;
  statusLabel: string;
  statusTone: AdminModerationStatusTone;
}

export interface AdminModerationTableProps {
  rows: AdminModerationRow[];
  selectedKey?: string | null;
  loading?: boolean;
  footerLabel?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  onSelect: (key: string) => void;
  onInspect?: (key: string) => void;
  className?: string;
}

const SEVERITY_CLASS: Record<AdminModerationSeverity, string> = {
  critical: s.severityCritical,
  high: s.severityHigh,
  normal: s.severityNormal,
};

const STATUS_CLASS: Record<AdminModerationStatusTone, { dot: string; label: string }> = {
  amber: { dot: s.dotAmber, label: s.statusAmber },
  blue: { dot: s.dotBlue, label: s.statusBlue },
  mute: { dot: s.dotMute, label: s.statusMute },
};

export function AdminModerationTable({
  rows,
  selectedKey,
  loading,
  footerLabel,
  emptyTitle = 'Queue clear',
  emptySubtitle = 'No items match this filter.',
  onSelect,
  onInspect,
  className,
}: AdminModerationTableProps) {
  if (loading) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="shield" title="Loading moderation queue…" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="shield" title={emptyTitle} subtitle={emptySubtitle} />
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
              <th className={s.th}>Content type</th>
              <th className={s.th}>Subject</th>
              <th className={s.th}>Creator</th>
              <th className={s.th}>Reason flagged</th>
              <th className={s.th}>Severity</th>
              <th className={s.th}>Date flagged</th>
              <th className={s.th}>Status</th>
              <th className={cx(s.th, s.thRight)}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = selectedKey === row.key;
              const statusCls = STATUS_CLASS[row.statusTone];
              return (
                <tr
                  key={row.key}
                  className={cx(s.row, selected && s.rowSelected)}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect(row.key)}
                >
                  <td className={s.td}>
                    <div className={s.typeCell}>
                      <Icon name={row.typeIcon} size={18} className={s.typeIcon} />
                      <span className={s.typeLabel}>{row.typeLabel}</span>
                    </div>
                  </td>
                  <td className={s.td}>
                    <p className={s.subject}>{row.subject}</p>
                  </td>
                  <td className={s.td}>
                    <span className={s.creator}>{row.creatorLabel}</span>
                  </td>
                  <td className={s.td}>
                    <span className={s.reason}>{row.reason}</span>
                  </td>
                  <td className={s.td}>
                    <span className={cx(s.severity, SEVERITY_CLASS[row.severity])}>
                      {row.severityLabel}
                    </span>
                  </td>
                  <td className={s.td}>
                    <span className={s.date}>{row.flaggedAtLabel}</span>
                  </td>
                  <td className={s.td}>
                    <span className={s.status}>
                      <span className={cx(s.dot, statusCls.dot)} aria-hidden />
                      <span className={statusCls.label}>{row.statusLabel}</span>
                    </span>
                  </td>
                  <td className={s.td}>
                    <div className={s.actions}>
                      <button
                        type="button"
                        className={s.iconBtn}
                        aria-label={`Inspect ${row.subject}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          (onInspect ?? onSelect)(row.key);
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
      {footerLabel ? <p className={s.footer}>{footerLabel}</p> : null}
    </div>
  );
}
