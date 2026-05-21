import React from 'react';
import { cx } from '../../../utils/cx';
import { SportTag } from '../../atoms/SportTag/SportTag';
import {
  EventSourceBadge,
  type EventSourceType,
} from '../../atoms/EventSourceBadge/EventSourceBadge';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from '../AdminSupportTable/AdminSupportTable.module.css';

export interface AdminEventReviewRow {
  id: string;
  title: string;
  sub: string;
  sport: string;
  league: string;
  source: string;
  startsLabel: string;
  visibility: string;
}

export interface AdminEventReviewTableProps {
  rows: AdminEventReviewRow[];
  selectedId?: string | null;
  loading?: boolean;
  footerLabel?: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function AdminEventReviewTable({
  rows,
  selectedId,
  loading,
  footerLabel,
  onSelect,
  className,
}: AdminEventReviewTableProps) {
  if (loading) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState icon="calendar" title="Loading review queue…" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cx(s.wrap, className)}>
        <div className={s.empty}>
          <EmptyState
            icon="check"
            title="No events awaiting review"
            subtitle="New creator submissions will appear here."
          />
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
              <th className={s.th}>Event</th>
              <th className={s.th}>Sport</th>
              <th className={s.th}>League</th>
              <th className={s.th}>Source</th>
              <th className={s.th}>Starts</th>
              <th className={s.th}>Visibility</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = selectedId === row.id;
              return (
                <tr
                  key={row.id}
                  className={cx(s.row, selected && s.rowSelected)}
                  onClick={() => onSelect(row.id)}
                >
                  <td className={s.td}>
                    <p className={s.ticket}>{row.title}</p>
                    <p className={s.partyRole}>{row.sub}</p>
                  </td>
                  <td className={s.td}>
                    <SportTag sport={row.sport} />
                  </td>
                  <td className={s.td}>
                    <p className={s.issue}>{row.league}</p>
                  </td>
                  <td className={s.td}>
                    <EventSourceBadge source={(row.source as EventSourceType) || 'creator'} />
                  </td>
                  <td className={s.td}>
                    <span className={s.date}>{row.startsLabel}</span>
                  </td>
                  <td className={s.td}>
                    <span className={s.date}>{row.visibility}</span>
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
