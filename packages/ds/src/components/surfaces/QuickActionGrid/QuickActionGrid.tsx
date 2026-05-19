import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import type { IconName } from '../../atoms/Icon/Icon';
import s from './QuickActionGrid.module.css';

export interface QuickActionGridItem {
  id: string | number;
  icon: IconName;
  label: string;
  onClick?: () => void;
}

export interface QuickActionGridProps {
  title: string;
  items: QuickActionGridItem[];
  className?: string;
}

export function QuickActionGrid({ title, items, className }: QuickActionGridProps) {
  return (
    <article className={cx(s.card, className)}>
      <h2 className={s.title}>{title}</h2>
      <div className={s.grid}>
        {items.map((item) => (
          <button key={item.id} type="button" className={s.tile} onClick={item.onClick}>
            <Icon name={item.icon} size={22} className={s.icon} />
            <span className={s.label}>{item.label}</span>
          </button>
        ))}
      </div>
    </article>
  );
}
