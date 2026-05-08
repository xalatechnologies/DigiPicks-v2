import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Hero.module.css';

export interface HeroTrustItem {
  icon?: React.ReactNode;
  label: React.ReactNode;
}

export interface HeroMarqueeItem {
  label: React.ReactNode;
}

export interface HeroProps {
  /** Pre-title chip / badge row. */
  eyebrow?: React.ReactNode;
  /** Title. Wrap accent words in `<em>` for serif italic gradient treatment. */
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Small inline trust row beneath the actions (icon + label pairs). */
  trust?: HeroTrustItem[];
  /** Optional right panel — when provided the hero becomes a 2-column split. */
  panel?: React.ReactNode;
  /** Bottom marquee strip (single-column hero only). */
  marquee?: { label?: React.ReactNode; items: HeroMarqueeItem[] };
  /** Reduced vertical padding when used as a sub-page hero. */
  compact?: boolean;
  className?: string;
}

export function Hero({
  eyebrow,
  title,
  subtitle,
  actions,
  trust,
  panel,
  marquee,
  compact,
  className,
}: HeroProps) {
  const split = Boolean(panel);
  return (
    <section className={cx(s.hero, compact && s.compact, className)}>
      <div className={s.glow} aria-hidden="true" />
      <div className={s.grid} aria-hidden="true" />

      <div className={cx(s.inner, split && s.split)}>
        <div className={s.content}>
          {eyebrow && <div className={s.eyebrowRow}>{eyebrow}</div>}
          <h1 className={s.title}>{title}</h1>
          {subtitle && <p className={s.subtitle}>{subtitle}</p>}
          {actions && <div className={s.actions}>{actions}</div>}
          {trust && trust.length > 0 && (
            <div className={s.trust}>
              {trust.map((t, i) => (
                <span key={i} className={s.trustItem}>
                  {t.icon}
                  {t.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {panel && <div className={s.panel}>{panel}</div>}
      </div>

      {!split && marquee && marquee.items.length > 0 && (
        <div className={s.marquee}>
          {marquee.label && <span className={s.marqueeLabel}>{marquee.label}</span>}
          {marquee.items.map((m, i) => (
            <span key={i} className={s.marqueeItem}>
              {m.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
