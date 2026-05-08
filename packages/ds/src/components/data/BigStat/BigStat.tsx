import React from 'react';
import { cx } from '../../../utils/cx';
import s from './BigStat.module.css';

export interface BigStatProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}

export function BigStat({ label, value, sub, className }: BigStatProps) {
  return (
    <div className={cx(s.big, className)}>
      <div className={s.label}>{label}</div>
      <div className={s.value}>{value}</div>
      {sub && <div className={s.sub}>{sub}</div>}
    </div>
  );
}
