import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './AdminActionPanel.module.css';

export interface AdminActionPanelItem {
  id: string | number;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'primary';
  disabled?: boolean;
}

export interface AdminActionPanelProps {
  title: string;
  items: AdminActionPanelItem[];
  className?: string;
}

export function AdminActionPanel({ title, items, className }: AdminActionPanelProps) {
  return (
    <article className={cx(s.card, className)}>
      <h2 className={s.title}>{title}</h2>
      <ul className={s.list}>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={cx(s.row, item.variant === 'primary' && s.primary)}
              onClick={item.disabled ? undefined : item.onClick}
              disabled={item.disabled || !item.onClick}
            >
              <span className={s.label}>{item.label}</span>
              <Icon
                name={item.variant === 'primary' ? 'chart' : 'arrow-right'}
                size={item.variant === 'primary' ? 20 : 18}
                className={s.arrow}
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}
