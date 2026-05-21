import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon, type IconName } from '../../atoms/Icon/Icon';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './AdminCampaignsTable.module.css';

export type AdminCampaignStatusTone = 'green' | 'amber' | 'mute';

export interface AdminCampaignRow {
  id: string;
  title: string;
  subtitle: string;
  channelIcon: IconName;
  channelLabel: string;
  statusLabel: string;
  statusTone: AdminCampaignStatusTone;
  dateLabel: string;
}

export interface AdminCampaignsTableProps {
  rows: AdminCampaignRow[];
  selectedId?: string | null;
  loading?: boolean;
  footerLabel?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  onSelect: (id: string) => void;
  className?: string;
}

const STATUS_CLASS: Record<AdminCampaignStatusTone, string> = {
  green: s.statusGreen,
  amber: s.statusAmber,
  mute: s.statusMute,
};

export function AdminCampaignsTable({
  rows,
  selectedId,
  loading,
  footerLabel,
  emptyTitle = 'No campaigns',
  emptySubtitle = 'Create a draft to start a broadcast.',
  onSelect,
  className,
}: AdminCampaignsTableProps) {
  if (loading) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="megaphone" title="Loading campaigns…" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="megaphone" title={emptyTitle} subtitle={emptySubtitle} />
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
              <th className={s.th}>Title</th>
              <th className={cx(s.th, s.thCenter)}>Channel</th>
              <th className={cx(s.th, s.thCenter)}>Status</th>
              <th className={s.th}>Send / schedule</th>
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
                    <p className={s.title}>{row.title}</p>
                    <p className={s.subtitle}>{row.subtitle}</p>
                  </td>
                  <td className={s.td}>
                    <span className={s.channel}>
                      <Icon name={row.channelIcon} size={18} />
                      <span className={s.channelLabel}>{row.channelLabel}</span>
                    </span>
                  </td>
                  <td className={s.td}>
                    <span className={cx(s.statusPill, STATUS_CLASS[row.statusTone])}>
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className={s.td}>
                    <span className={s.date}>{row.dateLabel}</span>
                  </td>
                  <td className={s.td}>
                    <div className={s.actions}>
                      <button
                        type="button"
                        className={s.iconBtn}
                        aria-label={`View ${row.title}`}
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
