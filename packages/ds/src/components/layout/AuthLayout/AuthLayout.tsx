import React from 'react';
import { cx } from '../../../utils/cx';
import s from './AuthLayout.module.css';

export interface AuthLayoutProps {
  /** Logo element rendered above the card on the form side. */
  logo?: React.ReactNode;
  /** Optional marketing/aside content rendered on the left in a 2-col split. */
  aside?: React.ReactNode;
  /** Header strip on the form side (e.g., "Back to home" link + small action). */
  formHeaderLeft?: React.ReactNode;
  formHeaderRight?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Modern auth shell. When `aside` is provided, renders a 2-column split with
 * a marketing column on the left and the form on the right. Without `aside`,
 * renders a single centered column. Background is animated aurora + grid.
 */
export function AuthLayout({
  logo,
  aside,
  formHeaderLeft,
  formHeaderRight,
  className,
  children,
}: AuthLayoutProps) {
  const split = Boolean(aside);
  return (
    <div className={cx(s.layout, split && s.split, className)}>
      <div className={s.glow} aria-hidden="true" />
      <div className={s.gridBg} aria-hidden="true" />

      {split && <aside className={s.aside}>{aside}</aside>}

      <div className={s.formCol}>
        {(formHeaderLeft || formHeaderRight) && (
          <div className={s.formTop}>
            <div>{formHeaderLeft}</div>
            <div>{formHeaderRight}</div>
          </div>
        )}
        {logo && <div className={s.logo}>{logo}</div>}
        <div className={s.content}>{children}</div>
      </div>
    </div>
  );
}

/** Marketing aside body — composed inside the `aside` prop. */
export interface AuthAsideStat {
  label: string;
  value: string;
}
export interface AuthAsideTrust {
  icon?: React.ReactNode;
  label: React.ReactNode;
}
export interface AuthAsideProps {
  /** Brand element rendered at the top of the aside. */
  brand?: React.ReactNode;
  eyebrow?: React.ReactNode;
  /** Title — wrap accent words in `<em>` for serif italic gradient treatment. */
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  stats?: AuthAsideStat[];
  trust?: AuthAsideTrust[];
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
}

export function AuthAside({
  brand,
  eyebrow,
  title,
  subtitle,
  stats,
  trust,
  footerLeft,
  footerRight,
}: AuthAsideProps) {
  return (
    <>
      {brand && <div className={s.asideTop}>{brand}</div>}
      <div className={s.asideBody}>
        {eyebrow && <span className={s.asideEyebrow}>{eyebrow}</span>}
        <h2 className={s.asideTitle}>{title}</h2>
        {subtitle && <p className={s.asideSub}>{subtitle}</p>}
        {stats && stats.length > 0 && (
          <div className={s.asideStats}>
            {stats.map((st) => (
              <div key={st.label} className={s.asideStat}>
                <span className={s.asideStatValue}>{st.value}</span>
                <span className={s.asideStatLabel}>{st.label}</span>
              </div>
            ))}
          </div>
        )}
        {trust && trust.length > 0 && (
          <div className={s.asideTrust}>
            {trust.map((t, i) => (
              <span key={i} className={s.asideTrustItem}>
                {t.icon}
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
      {(footerLeft || footerRight) && (
        <div className={s.asideFoot}>
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </div>
      )}
    </>
  );
}
