import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Stat.module.css';

export type StatTone = 'default' | 'accent' | 'success';

export interface StatProps {
  label: string;
  value: React.ReactNode;
  tone?: StatTone;
  className?: string;
}

export function Stat({ label, value, tone = 'default', className }: StatProps) {
  return (
    <div className={cx(s.stat, className)}>
      <div className={s.label}>{label}</div>
      <div className={cx(s.value, tone === 'accent' && s.accent, tone === 'success' && s.success)}>
        {value}
      </div>
    </div>
  );
}
