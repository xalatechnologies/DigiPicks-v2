import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import type { IconName } from '../../atoms/Icon/Icon';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './AdminApplicationsTable.module.css';

export type AdminApplicationStatusTone = 'amber' | 'blue' | 'green' | 'red' | 'violet' | 'mute';

export interface AdminApplicationRow {
  id: string;
  name: string;
  handle: string;
  email: string;
  nicheLabel: string;
  submittedLabel: string;
  statusLabel: string;
  statusTone: AdminApplicationStatusTone;
  proofCount: number;
  hasWinClaim: boolean;
}

export interface AdminApplicationsTableProps {
  rows: AdminApplicationRow[];
  selectedId?: string | null;
  loading?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  onSelect: (id: string) => void;
  className?: string;
}

const STATUS_CLASS: Record<AdminApplicationStatusTone, { dot: string; label: string }> = {
  amber: { dot: s.dotAmber, label: s.statusAmber },
  blue: { dot: s.dotBlue, label: s.statusBlue },
  green: { dot: s.dotGreen, label: s.statusGreen },
  red: { dot: s.dotRed, label: s.statusRed },
  violet: { dot: s.dotViolet, label: s.statusViolet },
  mute: { dot: s.dotMute, label: s.statusMute },
};

function monogram(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function evidenceIcons(row: AdminApplicationRow): IconName[] {
  const icons: IconName[] = [];
  if (row.proofCount > 0) icons.push('audit');
  if (row.hasWinClaim) icons.push('trophy');
  if (row.proofCount > 1) icons.push('link');
  return icons.length > 0 ? icons : ['audit'];
}

export function AdminApplicationsTable({
  rows,
  selectedId,
  loading,
  emptyTitle = 'No applications',
  emptySubtitle = 'Nothing in this queue.',
  onSelect,
  className,
}: AdminApplicationsTableProps) {
  if (loading) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="user" title="Loading applications…" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="user" title={emptyTitle} subtitle={emptySubtitle} />
        </div>
      </div>
    );
  }

  return (
    <div className={cx(s.wrap, className)}>
      <table className={s.table}>
        <thead>
          <tr className={s.headRow}>
            <th className={s.th}>Applicant</th>
            <th className={s.th}>Email address</th>
            <th className={s.th}>Primary niche</th>
            <th className={s.th}>Submitted</th>
            <th className={s.th}>Status</th>
            <th className={s.th}>Evidence</th>
            <th className={cx(s.th, s.thRight)}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const selected = selectedId === row.id;
            const statusCls = STATUS_CLASS[row.statusTone];
            const icons = evidenceIcons(row);
            return (
              <tr
                key={row.id}
                className={cx(s.row, selected && s.rowSelected)}
                aria-current={selected ? 'true' : undefined}
              >
                <td className={s.td}>
                  <div className={s.applicant}>
                    <span className={s.avatar} aria-hidden>
                      {monogram(row.name)}
                    </span>
                    <div className={s.applicantCopy}>
                      <p className={s.applicantName}>{row.name}</p>
                      <p className={s.applicantHandle}>@{row.handle}</p>
                    </div>
                  </div>
                </td>
                <td className={s.td}>
                  <span className={s.email}>{row.email}</span>
                </td>
                <td className={s.td}>
                  <span className={s.niche}>{row.nicheLabel}</span>
                </td>
                <td className={s.td}>
                  <span className={s.submitted}>{row.submittedLabel}</span>
                </td>
                <td className={s.td}>
                  <span className={s.status}>
                    <span className={cx(s.statusDot, statusCls.dot)} aria-hidden />
                    <span className={cx(s.statusLabel, statusCls.label)}>{row.statusLabel}</span>
                  </span>
                </td>
                <td className={s.td}>
                  <span className={s.evidence}>
                    {icons.map((icon) => (
                      <Icon key={icon} name={icon} size={18} aria-hidden />
                    ))}
                  </span>
                </td>
                <td className={s.td}>
                  <div className={s.actions}>
                    <button
                      type="button"
                      className={cx(s.viewBtn, !selected && s.viewBtnSecondary)}
                      onClick={() => onSelect(row.id)}
                    >
                      View details
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
