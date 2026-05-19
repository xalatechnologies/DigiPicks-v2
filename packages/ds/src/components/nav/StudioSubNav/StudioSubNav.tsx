import React from 'react';
import { cx } from '../../../utils/cx';
import s from './StudioSubNav.module.css';

export interface StudioSubNavItem {
  label: string;
  value: string;
}

export interface StudioSubNavProps {
  items: StudioSubNavItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function StudioSubNav({ items, value, onChange, className }: StudioSubNavProps) {
  return (
    <nav className={cx(s.nav, className)} aria-label="Posts view">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={cx(s.item, value === item.value && s.active)}
          onClick={() => onChange(item.value)}
          aria-current={value === item.value ? 'page' : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
