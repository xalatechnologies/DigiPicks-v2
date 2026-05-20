import React from 'react';
import { cx } from '../../../utils/cx';
import s from './EventsLiveStrip.module.css';

export interface EventsLiveStripItem {
  id: string;
  label: string;
  status: string;
  live?: boolean;
  onClick?: () => void;
}

export interface EventsLiveStripProps {
  items: EventsLiveStripItem[];
  className?: string;
}

export function EventsLiveStrip({ items, className }: EventsLiveStripProps) {
  if (items.length === 0) return null;

  return (
    <section className={cx(s.wrap, className)} aria-label="Live and starting soon">
      <div className={s.label}>
        <span className={s.pulse} aria-hidden="true">
          <span className={s.pulseRing} />
          <span className={s.pulseDot} />
        </span>
        <span className={s.labelText}>Live &amp; soon</span>
      </div>
      <div className={s.rail}>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 ? <span className={s.divider} aria-hidden="true" /> : null}
            <button type="button" className={s.item} onClick={item.onClick}>
              <span className={s.matchup}>{item.label}</span>
              <span className={cx(s.status, item.live && s.statusLive)}>{item.status}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
