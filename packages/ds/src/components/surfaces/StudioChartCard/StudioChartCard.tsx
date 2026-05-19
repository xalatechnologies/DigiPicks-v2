import React from 'react';
import { cx } from '../../../utils/cx';
import { Segmented, type SegmentedOption } from '../../nav/Segmented/Segmented';
import s from './StudioChartCard.module.css';

export interface StudioChartCardProps {
  title: string;
  sub?: string;
  periodOptions?: SegmentedOption[];
  period?: string;
  onPeriodChange?: (value: string) => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function StudioChartCard({
  title,
  sub,
  periodOptions,
  period,
  onPeriodChange,
  children,
  footer,
  className,
}: StudioChartCardProps) {
  return (
    <article className={cx(s.card, className)}>
      <div className={s.head}>
        <div>
          <h2 className={s.title}>{title}</h2>
          {sub ? <p className={s.sub}>{sub}</p> : null}
        </div>
        {periodOptions && period !== undefined && onPeriodChange ? (
          <Segmented
            options={periodOptions}
            value={period}
            onChange={onPeriodChange}
            ariaLabel={`${title} period`}
          />
        ) : null}
      </div>
      <div className={s.body}>{children}</div>
      {footer ? <div className={s.footer}>{footer}</div> : null}
    </article>
  );
}
