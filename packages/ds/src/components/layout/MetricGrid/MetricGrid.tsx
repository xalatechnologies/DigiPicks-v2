import React from 'react';
import { cx } from '../../../utils/cx';
import { Metric, type MetricProps } from '../../surfaces/Metric/Metric';
import s from './MetricGrid.module.css';

export interface MetricGridItem extends MetricProps {
  id?: string | number;
}

export interface MetricGridProps {
  /** List of metric prop bundles. Each item maps to one Metric tile. */
  items: MetricGridItem[];
  /** Number of metrics per row at the widest breakpoint. */
  cols?: 2 | 3 | 4 | 5;
  className?: string;
}

/**
 * Responsive grid of equal-height Metric tiles. Replaces the
 * `<Row gap={4} wrap>` + `<Col gap={0}><Metric .../></Col>` pattern
 * repeated across Overview, Subscribers, Growth, etc.
 */
export function MetricGrid({ items, cols = 4, className }: MetricGridProps) {
  const cssVars = { '--mg-cols': cols } as React.CSSProperties;
  return (
    <div className={cx(s.grid, className)} style={cssVars}>
      {items.map((item, i) => {
        const { id, ...metricProps } = item;
        return (
          <div key={id ?? i} className={s.cell}>
            <Metric {...metricProps} />
          </div>
        );
      })}
    </div>
  );
}
