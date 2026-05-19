import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { SportTag } from '../../atoms/SportTag/SportTag';
import { GradeBadge } from '../../atoms/GradeBadge/GradeBadge';
import s from './StudioPicksTable.module.css';

export type StudioPickAccess = 'free' | 'premium' | 'vip';
export type StudioPickStatus = 'published' | 'draft' | 'scheduled' | 'pending';
export type StudioPickResult = 'win' | 'loss' | 'push' | 'pending' | null;

export interface StudioPickRowData {
  id: string | number;
  sport: string;
  eventName: string;
  eventTime: string;
  pickTitle: string;
  odds: string;
  access: StudioPickAccess;
  status: StudioPickStatus;
  result: StudioPickResult;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export interface StudioPicksTableProps {
  rows: StudioPickRowData[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

const ACCESS_LABEL: Record<StudioPickAccess, string> = {
  free: 'Free',
  premium: 'Premium',
  vip: 'VIP',
};

const STATUS_LABEL: Record<StudioPickStatus, string> = {
  published: 'Published',
  draft: 'Draft',
  scheduled: 'Scheduled',
  pending: 'Pending',
};

function accessClass(access: StudioPickAccess): string {
  if (access === 'premium') return s.accessPremium;
  if (access === 'vip') return s.accessVip;
  return s.accessFree;
}

function statusClass(status: StudioPickStatus): string {
  if (status === 'published') return s.statusPublished;
  return s.statusMuted;
}

export function StudioPicksTable({
  rows,
  page = 1,
  pageSize = 10,
  totalCount,
  onPageChange,
  className,
}: StudioPicksTableProps) {
  const total = totalCount ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  const rangeStart = total === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + pageSize, total);

  const pageNums = Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1);

  return (
    <article className={cx(s.card, className)}>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Event &amp; category</th>
            <th>Pick details</th>
            <th>Access</th>
            <th>Status</th>
            <th>Result</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row) => (
            <tr key={row.id} className={s.row}>
              <td>
                <div className={s.eventCell}>
                  <SportTag sport={row.sport} lg />
                  <div>
                    <p className={s.eventName}>{row.eventName}</p>
                    <p className={s.eventTime}>{row.eventTime}</p>
                  </div>
                </div>
              </td>
              <td>
                <p className={s.pickTitle}>{row.pickTitle}</p>
                <p className={s.odds}>Odds: {row.odds}</p>
              </td>
              <td>
                <span className={cx(s.accessPill, accessClass(row.access))}>
                  {ACCESS_LABEL[row.access]}
                </span>
              </td>
              <td>
                <span className={cx(s.statusRow, statusClass(row.status))}>
                  <span className={s.statusDot} aria-hidden />
                  {STATUS_LABEL[row.status]}
                </span>
              </td>
              <td>
                {row.result && row.result !== 'pending' ? (
                  <GradeBadge grade={row.result} />
                ) : (
                  <span className={s.resultPending}>Pending</span>
                )}
              </td>
              <td>
                <div className={s.actions}>
                  <button
                    type="button"
                    className={s.actionBtn}
                    aria-label="Edit pick"
                    onClick={row.onEdit}
                    disabled={!row.onEdit}
                  >
                    <Icon name="edit" size={18} />
                  </button>
                  <button
                    type="button"
                    className={s.actionBtn}
                    aria-label="Duplicate pick"
                    onClick={row.onDuplicate}
                    disabled={!row.onDuplicate}
                  >
                    <Icon name="link" size={18} />
                  </button>
                  <button
                    type="button"
                    className={cx(s.actionBtn, s.actionDanger)}
                    aria-label="Delete pick"
                    onClick={row.onDelete}
                    disabled={!row.onDelete}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className={s.footer}>
        <p className={s.range}>
          Showing{' '}
          <span className={s.strong}>
            {rangeStart}-{rangeEnd}
          </span>{' '}
          of <span className={s.strong}>{total}</span> picks
        </p>
        {onPageChange ? (
          <div className={s.pager} role="group" aria-label="Pagination">
            <button
              type="button"
              className={s.pageBtn}
              disabled={safePage <= 1}
              onClick={() => onPageChange(safePage - 1)}
              aria-label="Previous page"
            >
              <Icon name="chevron-left" size={16} />
            </button>
            {pageNums.map((n) => (
              <button
                key={n}
                type="button"
                className={cx(s.pageBtn, n === safePage && s.pageOn)}
                onClick={() => onPageChange(n)}
                aria-current={n === safePage ? 'page' : undefined}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className={s.pageBtn}
              disabled={safePage >= totalPages}
              onClick={() => onPageChange(safePage + 1)}
              aria-label="Next page"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        ) : null}
      </footer>
    </article>
  );
}
