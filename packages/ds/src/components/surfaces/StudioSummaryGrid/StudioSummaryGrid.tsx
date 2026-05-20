import React from 'react';
import { cx } from '../../../utils/cx';
import {
  StudioSummaryCard,
  type StudioSummaryCardProps,
} from '../StudioSummaryCard/StudioSummaryCard';
import s from './StudioSummaryGrid.module.css';

export interface StudioSummaryGridItem extends StudioSummaryCardProps {
  id?: string | number;
}

export type StudioSummaryGridColumns = 2 | 3 | 4;

export interface StudioSummaryGridProps {
  items: StudioSummaryGridItem[];
  /** Desktop column count. Default `4` (Subscribers, Picks). Use `3` for six-up overview metrics. */
  columns?: StudioSummaryGridColumns;
  className?: string;
}

const COLS_CLASS: Record<StudioSummaryGridColumns, string> = {
  2: s.cols2,
  3: s.cols3,
  4: s.cols4,
};

export function StudioSummaryGrid({ items, columns = 4, className }: StudioSummaryGridProps) {
  return (
    <div className={cx(s.grid, COLS_CLASS[columns], className)}>
      {items.map((item, i) => {
        const { id, ...cardProps } = item;
        return (
          <div key={id ?? i} className={s.cell}>
            <StudioSummaryCard {...cardProps} />
          </div>
        );
      })}
    </div>
  );
}
