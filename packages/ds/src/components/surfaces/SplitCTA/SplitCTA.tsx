import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './SplitCTA.module.css';

export interface SplitCTAPanel {
  /** Visual variant — drives accent color (creators=primary, subscribers=violet). */
  variant: 'creators' | 'subscribers';
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  bullets?: React.ReactNode[];
  actions?: React.ReactNode;
}

export interface SplitCTAProps {
  panels: [SplitCTAPanel, SplitCTAPanel];
  className?: string;
}

export function SplitCTA({ panels, className }: SplitCTAProps) {
  return (
    <div className={cx(s.split, className)}>
      {panels.map((p, i) => (
        <article key={i} className={cx(s.card, s[p.variant])}>
          <div className={s.head}>
            <div className={s.iconWrap}>{p.icon}</div>
            <div className={s.headText}>
              <span className={s.eyebrow}>{p.eyebrow}</span>
              <h3 className={s.title}>{p.title}</h3>
            </div>
          </div>
          <p className={s.body}>{p.body}</p>
          {p.bullets && p.bullets.length > 0 && (
            <ul className={s.bullets}>
              {p.bullets.map((b, j) => (
                <li key={j} className={s.bullet}>
                  <span className={s.bulletTick} aria-hidden="true">
                    <Icon name="check" size={11} />
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {p.actions && <div className={s.actions}>{p.actions}</div>}
        </article>
      ))}
    </div>
  );
}
