import React from 'react';
import { cx } from '../../../utils/cx';
import s from './TrustMarquee.module.css';

export interface TrustMarqueeProps {
  label?: React.ReactNode;
  items: React.ReactNode[];
  className?: string;
}

export function TrustMarquee({ label = 'Trusted by creators from', items, className }: TrustMarqueeProps) {
  // Duplicate the list so the keyframe loop seamlessly repeats.
  const doubled = [...items, ...items];
  return (
    <section className={cx(s.band, className)}>
      <div className={s.inner}>
        <span className={s.label}>{label}</span>
        <div className={s.viewport}>
          <div className={s.track}>
            {doubled.map((item, i) => (
              <span key={i} className={s.item} aria-hidden={i >= items.length}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
