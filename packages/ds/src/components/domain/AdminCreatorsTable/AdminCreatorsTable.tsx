import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Icon } from '../../atoms/Icon/Icon';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './AdminCreatorsTable.module.css';

export type AdminCreatorStatusTone = 'green' | 'amber' | 'red' | 'mute';

export interface AdminCreatorRow {
  id: string;
  name: string;
  handle: string;
  avatarMono: string;
  avatarColor: string;
  verified: boolean;
  subscribersLabel: string;
  revenueLabel: string;
  statusLabel: string;
  statusTone: AdminCreatorStatusTone;
  joinedLabel: string;
}

export interface AdminCreatorsTableProps {
  rows: AdminCreatorRow[];
  selectedId?: string | null;
  loading?: boolean;
  footerLabel?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  onSelect: (id: string) => void;
  onViewProfile?: (id: string) => void;
  onModeration?: (id: string) => void;
  className?: string;
}

const STATUS_CLASS: Record<AdminCreatorStatusTone, { dot: string; label: string }> = {
  green: { dot: s.dotGreen, label: s.statusGreen },
  amber: { dot: s.dotAmber, label: s.statusAmber },
  red: { dot: s.dotRed, label: s.statusRed },
  mute: { dot: s.dotMute, label: s.statusMute },
};

export function AdminCreatorsTable({
  rows,
  selectedId,
  loading,
  footerLabel,
  emptyTitle = 'No creators',
  emptySubtitle = 'Try adjusting filters or search.',
  onSelect,
  onViewProfile,
  onModeration,
  className,
}: AdminCreatorsTableProps) {
  if (loading) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="verified" title="Loading creators…" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="verified" title={emptyTitle} subtitle={emptySubtitle} />
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
              <th className={s.th}>Verified</th>
              <th className={s.th}>Subscribers</th>
              <th className={s.th}>Est. revenue</th>
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
                    <div className={s.creator}>
                      <Avatar
                        className={s.avatar}
                        mono={row.avatarMono}
                        color={row.avatarColor}
                        size={40}
                        aria-hidden
                      />
                      <div className={s.creatorCopy}>
                        <p className={s.creatorName}>{row.name}</p>
                        <p className={s.creatorHandle}>@{row.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className={s.td}>
                    <span
                      className={cx(s.verified, !row.verified && s.verifiedOff)}
                      aria-label={row.verified ? 'Verified' : 'Not verified'}
                    >
                      <Icon name="verified" size={20} />
                    </span>
                  </td>
                  <td className={s.td}>
                    <span className={s.metric}>{row.subscribersLabel}</span>
                  </td>
                  <td className={s.td}>
                    <span className={s.revenue}>{row.revenueLabel}</span>
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
                        title="View profile"
                        aria-label={`View ${row.name} profile`}
                        onClick={() => (onViewProfile ? onViewProfile(row.id) : onSelect(row.id))}
                      >
                        <Icon name="eye" size={20} />
                      </button>
                      <button
                        type="button"
                        className={s.iconBtn}
                        title="Open moderation"
                        aria-label={`Moderate ${row.name}`}
                        onClick={() => (onModeration ? onModeration(row.id) : onSelect(row.id))}
                      >
                        <Icon name="shield" size={20} />
                      </button>
                      <button
                        type="button"
                        className={s.iconBtn}
                        title="Inspect details"
                        aria-label={`Inspect ${row.name}`}
                        onClick={() => onSelect(row.id)}
                      >
                        <Icon name="more" size={20} />
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
