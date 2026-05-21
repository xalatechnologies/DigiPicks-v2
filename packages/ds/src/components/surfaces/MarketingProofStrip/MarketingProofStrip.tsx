import React from 'react';
import { cx } from '../../../utils/cx';
import lift from '../../../utils/lightMarketingSurface.module.css';
import s from './MarketingProofStrip.module.css';

export interface MarketingProofStat {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}

export interface MarketingProofStripProps {
  items: MarketingProofStat[];
  footnote?: React.ReactNode;
  action?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

/** Full-width proof band for marketing pages (hero follow-up). */
export function MarketingProofStrip({
  items,
  footnote,
  action,
  loading,
  className,
}: MarketingProofStripProps) {
  return (
    <section className={cx(s.band, className)} aria-label="Network proof">
      <div className={s.inner}>
        <div className={s.grid}>
          {items.map((item) => (
            <div key={item.label} className={cx(s.stat, lift.surface, loading && s.skeleton)}>
              <span className={s.label}>{item.label}</span>
              <span className={s.value}>{item.value}</span>
              {item.sub ? <span className={s.sub}>{item.sub}</span> : null}
            </div>
          ))}
        </div>
        {footnote || action ? (
          <div className={s.foot}>
            {footnote ? <span className={s.footLabel}>{footnote}</span> : <span />}
            {action}
          </div>
        ) : null}
      </div>
    </section>
  );
}
