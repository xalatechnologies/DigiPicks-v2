import React from 'react';
import { cx } from '../../../utils/cx';
import s from './CreatorPerformanceHighlights.module.css';

export interface CreatorPerformanceHighlight {
  id: string | number;
  label: string;
  value: string;
  /** 0–100 bar fill */
  percent: number;
}

export interface CreatorPerformanceHighlightsProps {
  title?: string;
  items: CreatorPerformanceHighlight[];
  className?: string;
}

export function CreatorPerformanceHighlights({
  title = 'Performance highlights',
  items,
  className,
}: CreatorPerformanceHighlightsProps) {
  return (
    <article className={cx(s.card, className)}>
      <h2 className={s.title}>{title}</h2>
      <ul className={s.list}>
        {items.map((item) => (
          <li key={item.id} className={s.row}>
            <div className={s.head}>
              <span className={s.label}>{item.label}</span>
              <span className={s.value}>{item.value}</span>
            </div>
            <div className={s.track} aria-hidden>
              <div
                className={s.fill}
                style={
                  {
                    width: `${Math.max(0, Math.min(100, item.percent))}%`,
                  } as React.CSSProperties
                }
              />
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
