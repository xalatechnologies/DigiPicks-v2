import React from 'react';
import { cx } from '../../../utils/cx';
import { AccountSettingsActionRow } from '../AccountSettingsActionRow/AccountSettingsActionRow';
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
      <div className={s.list}>
        {items.map((item) => (
          <AccountSettingsActionRow
            key={item.id}
            label={item.label}
            trailingTone={item.variant === 'primary' ? 'primary' : 'default'}
            onClick={item.disabled ? undefined : item.onClick}
            className={cx(item.variant === 'primary' && s.primaryRow, item.disabled && s.disabled)}
          />
        ))}
      </div>
    </article>
  );
}
