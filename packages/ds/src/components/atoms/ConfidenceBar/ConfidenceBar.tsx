import React from 'react';
import { cx } from '../../../utils/cx';
import { Bar } from '../Bar/Bar';
import s from './ConfidenceBar.module.css';

export type ConfidenceLevel = 'Low' | 'Medium' | 'High';

export interface ConfidenceBarProps {
  level: ConfidenceLevel;
  className?: string;
}

const LEVEL_TO_PCT: Record<ConfidenceLevel, number> = {
  Low: 33,
  Medium: 66,
  High: 100,
};

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ level, className }) => {
  const pct = LEVEL_TO_PCT[level] ?? 50;
  return (
    <div className={cx(s.row, className)}>
      <Bar value={pct} className={s.bar} />
      <span className={s.label}>{level}</span>
    </div>
  );
};
