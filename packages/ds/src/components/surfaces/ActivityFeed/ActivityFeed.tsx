import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import type { IconName } from '../../atoms/Icon/Icon';
import s from './ActivityFeed.module.css';

export type ActivityFeedTone = 'success' | 'info' | 'primary' | 'muted';

export interface ActivityFeedItemData {
  id: string | number;
  icon: IconName;
  tone?: ActivityFeedTone;
  title: React.ReactNode;
  sub?: React.ReactNode;
  time: string;
  amount?: React.ReactNode;
  trailingIcon?: IconName;
  onClick?: () => void;
}

export interface ActivityFeedProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  items: ActivityFeedItemData[];
  className?: string;
}

export function ActivityFeed({
  title,
  actionLabel,
  onAction,
  items,
  className,
}: ActivityFeedProps) {
  return (
    <article className={cx(s.card, className)}>
      <div className={s.head}>
        <h2 className={s.title}>{title}</h2>
        {actionLabel && onAction ? (
          <button type="button" className={s.action} onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
      <ul className={s.list}>
        {items.map((item) => {
          const content = (
            <>
              <span className={cx(s.iconWrap, item.tone && s[item.tone])}>
                <Icon name={item.icon} size={18} />
              </span>
              <div className={s.copy}>
                <p className={s.itemTitle}>{item.title}</p>
                {item.sub ? <p className={s.itemSub}>{item.sub}</p> : null}
                <p className={s.time}>{item.time}</p>
              </div>
              {item.amount ? <span className={s.amount}>{item.amount}</span> : null}
              {item.trailingIcon ? (
                <Icon name={item.trailingIcon} size={16} className={s.trailing} />
              ) : null}
            </>
          );

          return (
            <li key={item.id} className={s.item}>
              {item.onClick ? (
                <button type="button" className={s.itemBtn} onClick={item.onClick}>
                  {content}
                </button>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
