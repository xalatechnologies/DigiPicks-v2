import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './AdminUsersTable.module.css';

export type AdminUserStatusTone = 'green' | 'amber' | 'red' | 'mute';

export interface AdminUserRow {
  id: string;
  name: string;
  handleLine: string;
  monogram: string;
  email: string;
  typeLabel: string;
  subscriptionsLabel: string;
  statusLabel: string;
  statusTone: AdminUserStatusTone;
  joinedLabel: string;
}

export interface AdminUsersTableProps {
  rows: AdminUserRow[];
  selectedId?: string | null;
  loading?: boolean;
  footerLabel?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  onSelect: (id: string) => void;
  onEntitlements?: (id: string) => void;
  className?: string;
}

const STATUS_CLASS: Record<AdminUserStatusTone, { dot: string; label: string }> = {
  green: { dot: s.dotGreen, label: s.statusGreen },
  amber: { dot: s.dotAmber, label: s.statusAmber },
  red: { dot: s.dotRed, label: s.statusRed },
  mute: { dot: s.dotMute, label: s.statusMute },
};

export function AdminUsersTable({
  rows,
  selectedId,
  loading,
  footerLabel,
  emptyTitle = 'No users',
  emptySubtitle = 'Try adjusting filters or search.',
  onSelect,
  onEntitlements,
  className,
}: AdminUsersTableProps) {
  if (loading) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="users" title="Loading users…" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="users" title={emptyTitle} subtitle={emptySubtitle} />
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
              <th className={s.th}>User</th>
              <th className={s.th}>Email</th>
              <th className={s.th}>Type</th>
              <th className={s.th}>Subscriptions</th>
              <th className={s.th}>Status</th>
              <th className={s.th}>Joined</th>
              <th className={cx(s.th, s.thRight)}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = selectedId === row.id;
              const statusCls = STATUS_CLASS[row.statusTone];
              return (
                <tr
                  key={row.id}
                  className={cx(s.row, selected && s.rowSelected)}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect(row.id)}
                >
                  <td className={s.td}>
                    <div className={s.user}>
                      <span className={s.avatar} aria-hidden>
                        {row.monogram}
                      </span>
                      <div className={s.userCopy}>
                        <p className={s.userName}>{row.name}</p>
                        <p className={s.userHandle}>{row.handleLine}</p>
                      </div>
                    </div>
                  </td>
                  <td className={s.td}>
                    <span className={s.email}>{row.email}</span>
                  </td>
                  <td className={s.td}>
                    <span className={s.type}>{row.typeLabel}</span>
                  </td>
                  <td className={s.td}>
                    <span className={s.subs}>
                      <span className={s.subBadge}>{row.subscriptionsLabel}</span>
                    </span>
                  </td>
                  <td className={s.td}>
                    <span className={s.status}>
                      <span className={cx(s.statusDot, statusCls.dot)} aria-hidden />
                      <span className={cx(s.statusLabel, statusCls.label)}>{row.statusLabel}</span>
                    </span>
                  </td>
                  <td className={s.td}>
                    <span className={s.joined}>{row.joinedLabel}</span>
                  </td>
                  <td className={s.td} onClick={(e) => e.stopPropagation()}>
                    <div className={s.actions}>
                      <button
                        type="button"
                        className={cx(s.iconBtn, selected && s.iconBtnActive)}
                        title="Inspect user"
                        aria-label={`Inspect ${row.name}`}
                        onClick={() => onSelect(row.id)}
                      >
                        <Icon name="eye" size={20} />
                      </button>
                      <button
                        type="button"
                        className={s.iconBtn}
                        title="Entitlements"
                        aria-label={`Entitlements for ${row.name}`}
                        onClick={() => (onEntitlements ? onEntitlements(row.id) : onSelect(row.id))}
                      >
                        <Icon name="lock" size={20} />
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
