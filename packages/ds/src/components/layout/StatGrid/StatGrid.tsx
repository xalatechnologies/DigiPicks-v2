import React from 'react';
import { cx } from '../../../utils/cx';
import { Card } from '../../surfaces/Card/Card';
import { BigStat, type BigStatProps } from '../../data/BigStat/BigStat';
import s from './StatGrid.module.css';

export interface StatGridItem extends BigStatProps {
  id?: string | number;
}

export interface StatGridProps {
  items: StatGridItem[];
  cols?: 2 | 3 | 4 | 5;
  className?: string;
}

/**
 * Responsive grid of equal-height BigStat-in-Card tiles. Replaces the
 * `<Row gap={4} wrap>` + `<Col gap={0}><Card><BigStat .../></Card></Col>`
 * pattern repeated across Performance and Earnings.
 */
export function StatGrid({ items, cols = 4, className }: StatGridProps) {
  const cssVars = { '--sg-cols': cols } as React.CSSProperties;
  return (
    <div className={cx(s.grid, className)} style={cssVars}>
      {items.map((item, i) => {
        const { id, ...statProps } = item;
        return (
          <Card key={id ?? i} className={s.cell}>
            <BigStat {...statProps} />
          </Card>
        );
      })}
    </div>
  );
}
