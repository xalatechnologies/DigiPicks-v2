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

export interface StudioSummaryGridProps {
  items: StudioSummaryGridItem[];
  className?: string;
}

export function StudioSummaryGrid({ items, className }: StudioSummaryGridProps) {
  return (
    <div className={cx(s.grid, className)}>
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
