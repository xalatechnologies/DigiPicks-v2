import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import s from './StudioSubscribersTable.module.css';

export type StudioSubscriberPlan = 'free' | 'premium' | 'vip' | 'trial';
export type StudioSubscriberStatus = 'active' | 'past_due' | 'cancelled';

export interface StudioSubscriberRowData {
  id: string | number;
  name: string;
  handle?: string;
  mono: string;
  avatarColor?: string;
  plan: StudioSubscriberPlan;
  status: StudioSubscriberStatus;
  joinDate: string;
  renewal: string;
  onView?: () => void;
}

export interface StudioSubscribersTableProps {
  rows: StudioSubscriberRowData[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

const PLAN_LABEL: Record<StudioSubscriberPlan, string> = {
  free: 'Free',
  premium: 'Premium',
  vip: 'VIP',
  trial: 'Trial',
};

const STATUS_LABEL: Record<StudioSubscriberStatus, string> = {
  active: 'Active',
  past_due: 'Past due',
  cancelled: 'Canceled',
};

function planClass(plan: StudioSubscriberPlan): string {
  if (plan === 'premium') return s.planPremium;
  if (plan === 'vip') return s.planVip;
  if (plan === 'trial') return s.planTrial;
  return s.planFree;
}

function statusClass(status: StudioSubscriberStatus): string {
  if (status === 'active') return s.statusActive;
  if (status === 'past_due') return s.statusPastDue;
  return s.statusCancelled;
}

export function StudioSubscribersTable({
  rows,
  page = 1,
  pageSize = 10,
  totalCount,
  onPageChange,
  className,
}: StudioSubscribersTableProps) {
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
            <th>Subscriber</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Join date</th>
            <th>Renewal</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row) => (
            <tr key={row.id} className={s.row}>
              <td>
                <div className={s.member}>
                  <Avatar mono={row.mono} color={row.avatarColor} size={40} />
                  <div>
                    <p className={s.name}>{row.name}</p>
                    {row.handle ? <p className={s.handle}>{row.handle}</p> : null}
                  </div>
                </div>
              </td>
              <td>
                <span className={cx(s.planPill, planClass(row.plan))}>{PLAN_LABEL[row.plan]}</span>
              </td>
              <td>
                <span className={cx(s.statusRow, statusClass(row.status))}>
                  <span className={s.statusDot} aria-hidden />
                  {STATUS_LABEL[row.status]}
                </span>
              </td>
              <td>
                <span className={s.date}>{row.joinDate}</span>
              </td>
              <td>
                <span
                  className={cx(
                    s.date,
                    row.status === 'past_due' && s.renewalWarn,
                    row.status === 'cancelled' && s.renewalMuted,
                  )}
                >
                  {row.renewal}
                </span>
              </td>
              <td>
                <div className={s.actions}>
                  <Button variant="outline" size="sm" onClick={row.onView} disabled={!row.onView}>
                    View
                  </Button>
                  <button type="button" className={s.moreBtn} aria-label="More actions">
                    <Icon name="more" size={18} />
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
          of <span className={s.strong}>{total}</span> subscribers
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
