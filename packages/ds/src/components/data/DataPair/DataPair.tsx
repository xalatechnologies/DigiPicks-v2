import React from 'react';
import { cx } from '../../../utils/cx';
import s from './DataPair.module.css';

export interface DataPairProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  lg?: boolean;
  className?: string;
}

export function DataPair({ label, value, mono, lg, className }: DataPairProps) {
  return (
    <div className={cx(s.pair, lg && s.lg, className)}>
      <div className={s.label}>{label}</div>
      <div className={cx(s.value, mono && s.mono)}>{value}</div>
    </div>
  );
}
