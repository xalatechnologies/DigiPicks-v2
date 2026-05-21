import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './AdminCriticalAlertsPanel.module.css';

export type AdminAlertItemTone = 'danger' | 'amber' | 'primary';

export interface AdminCriticalAlertItem {
  id: string | number;
  eyebrow?: string;
  title: string;
  sub: string;
  tone?: AdminAlertItemTone;
  onOpen?: () => void;
}

export interface AdminCriticalAlertsPanelProps {
  title?: string;
  items: AdminCriticalAlertItem[];
  emptyMessage?: string;
  className?: string;
}

const EYEBROW_CLASS: Record<AdminAlertItemTone, string> = {
  danger: s.eyebrowDanger,
  amber: s.eyebrowAmber,
  primary: s.eyebrowPrimary,
};

export function AdminCriticalAlertsPanel({
  title = 'Critical alerts',
  items,
  emptyMessage = 'No critical alerts — queues are within normal thresholds.',
  className,
}: AdminCriticalAlertsPanelProps) {
  return (
    <article className={cx(s.card, className)}>
      <div className={s.head}>
        <Icon name="flag" size={22} className={s.headIcon} aria-hidden />
        <h2 className={s.title}>{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className={s.empty}>{emptyMessage}</p>
      ) : (
        <ul className={s.list}>
          {items.map((item) => {
            const tone = item.tone ?? 'primary';
            const eyebrow = item.eyebrow ?? defaultEyebrow(tone);
            const inner = (
              <>
                <p className={cx(s.eyebrow, EYEBROW_CLASS[tone])}>{eyebrow}</p>
                <p className={s.itemTitle}>{item.title}</p>
                <p className={s.itemSub}>{item.sub}</p>
              </>
            );
            return (
              <li key={item.id} className={s.item}>
                {item.onOpen ? (
                  <button type="button" className={s.itemBtn} onClick={item.onOpen}>
                    {inner}
                  </button>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

function defaultEyebrow(tone: AdminAlertItemTone): string {
  if (tone === 'danger') return 'Action required';
  if (tone === 'amber') return 'Attention';
  return 'Operations';
}
