import React from 'react';
import { cx } from '../../../utils/cx';
import s from './FilterGroup.module.css';

export interface FilterGroupProps {
  label: string;
  className?: string;
  children: React.ReactNode;
}

export function FilterGroup({ label, className, children }: FilterGroupProps) {
  return (
    <div className={cx(s.group, className)}>
      <div className={s.label}>{label}</div>
      <div className={s.body}>{children}</div>
    </div>
  );
}
