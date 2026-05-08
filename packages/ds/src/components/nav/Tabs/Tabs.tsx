import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Tabs.module.css';

export interface TabsTab {
  label: string;
  value: string;
}

export interface TabsProps {
  tabs: TabsTab[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  ariaLabel?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, value, onChange, className, ariaLabel }) => {
  return (
    <div className={cx(s.tabs, className)} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cx(s.tab, active && s.active)}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
