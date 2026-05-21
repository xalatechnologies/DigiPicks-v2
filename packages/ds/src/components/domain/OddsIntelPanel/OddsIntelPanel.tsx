import React from 'react';
import { cx } from '../../../utils/cx';
import s from './OddsIntelPanel.module.css';

export interface OddsIntelPanelProps {
  title: React.ReactNode;
  meta?: React.ReactNode;
  headAction?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  lineMovement?: React.ReactNode;
  className?: string;
}

/** Active-event odds comparison shell. */
export function OddsIntelPanel({
  title,
  meta,
  headAction,
  toolbar,
  children,
  lineMovement,
  className,
}: OddsIntelPanelProps) {
  return (
    <section className={cx(s.panel, className)} aria-label="Active event odds">
      <header className={s.head}>
        <div className={s.matchup}>
          <h2 className={s.title}>{title}</h2>
          {meta ? <p className={s.meta}>{meta}</p> : null}
        </div>
        {headAction ? <div className={s.headAction}>{headAction}</div> : null}
      </header>

      {toolbar ? <div className={s.toolbar}>{toolbar}</div> : null}

      <div className={s.body}>{children}</div>

      {lineMovement ? <div className={s.lineCard}>{lineMovement}</div> : null}
    </section>
  );
}

export interface OddsIntelLineMovementProps {
  title?: string;
  sub?: string;
  badge?: React.ReactNode;
  caption?: React.ReactNode;
  rangeLabel?: React.ReactNode;
  chart: React.ReactNode;
  className?: string;
}

export function OddsIntelLineMovement({
  title = 'Line movement',
  sub,
  badge,
  caption,
  rangeLabel,
  chart,
  className,
}: OddsIntelLineMovementProps) {
  return (
    <div className={className}>
      <div className={s.lineHead}>
        <div>
          <h3 className={s.lineTitle}>{title}</h3>
          {sub ? <p className={s.lineSub}>{sub}</p> : null}
        </div>
        {badge}
      </div>
      <div className={s.lineFoot}>
        <div className={s.lineStats}>
          {caption ? <span className={s.lineStatMuted}>{caption}</span> : null}
          {rangeLabel ? <span className={s.lineStatMono}>{rangeLabel}</span> : null}
        </div>
        {chart}
      </div>
    </div>
  );
}
