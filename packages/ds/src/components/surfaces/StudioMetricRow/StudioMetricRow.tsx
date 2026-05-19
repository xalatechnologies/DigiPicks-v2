import React from 'react';
import { cx } from '../../../utils/cx';
import { StudioMetricTile, type StudioMetricTileProps } from '../StudioMetricTile/StudioMetricTile';
import s from './StudioMetricRow.module.css';

export interface StudioMetricRowItem extends StudioMetricTileProps {
  id?: string | number;
}

export interface StudioMetricRowProps {
  items: StudioMetricRowItem[];
  className?: string;
}

export function StudioMetricRow({ items, className }: StudioMetricRowProps) {
  return (
    <div className={cx(s.row, className)}>
      {items.map((item, i) => {
        const { id, ...tileProps } = item;
        return (
          <div key={id ?? i} className={s.cell}>
            <StudioMetricTile {...tileProps} />
          </div>
        );
      })}
    </div>
  );
}
