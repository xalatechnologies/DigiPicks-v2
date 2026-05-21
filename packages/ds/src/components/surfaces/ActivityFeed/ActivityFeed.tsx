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
  /** `editorial` — admin overview: larger wells, time on the right, elevated card. */
  variant?: 'default' | 'editorial';
  className?: string;
}

export function ActivityFeed({
  title,
  actionLabel,
  onAction,
  items,
  variant = 'default',
  className,
}: ActivityFeedProps) {
  return (
    <article className={cx(s.card, variant === 'editorial' && s.editorial, className)}>
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
          const iconSize = variant === 'editorial' ? 22 : 18;
          const content =
            variant === 'editorial' ? (
              <>
                <span className={cx(s.iconWrap, item.tone && s[item.tone])}>
                  <Icon name={item.icon} size={iconSize} />
                </span>
                <div className={s.copy}>
                  <p className={s.itemTitle}>{item.title}</p>
                  {item.sub ? <p className={s.itemSub}>{item.sub}</p> : null}
                </div>
                <span className={s.timeEditorial}>{item.time}</span>
              </>
            ) : (
              <>
                <span className={cx(s.iconWrap, item.tone && s[item.tone])}>
                  <Icon name={item.icon} size={iconSize} />
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
            <li key={item.id} className={cx(s.item, variant === 'editorial' && s.itemEditorial)}>
              {item.onClick ? (
                <button
                  type="button"
                  className={cx(s.itemBtn, variant === 'editorial' && s.itemBtnEditorial)}
                  onClick={item.onClick}
                >
                  {content}
                </button>
              ) : (
                <div className={variant === 'editorial' ? s.itemStaticEditorial : undefined}>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
