import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Footer.module.css';

export interface FooterColumn {
  title: string;
  items: { label: string; href: string }[];
}

export interface FooterTrustItem {
  icon?: React.ReactNode;
  label: React.ReactNode;
}

export interface FooterSocialLink {
  icon: React.ReactNode;
  href: string;
  label: string;
}

export interface FooterNewsletter {
  title?: React.ReactNode;
  sub?: React.ReactNode;
  form: React.ReactNode;
  fine?: React.ReactNode;
}

export interface FooterProps {
  brand?: React.ReactNode;
  /** Body copy beneath the brand mark. */
  tagline?: React.ReactNode;
  /** Round social icon buttons under the tagline. */
  social?: FooterSocialLink[];
  columns?: FooterColumn[];
  /** Optional newsletter signup band rendered above the columns. */
  newsletter?: FooterNewsletter;
  /** Optional trust strip rendered above the bottom row. */
  trust?: FooterTrustItem[];
  bottomLeft?: React.ReactNode;
  bottomRight?: React.ReactNode;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({
  brand,
  tagline,
  social,
  columns,
  newsletter,
  trust,
  bottomLeft,
  bottomRight,
  className,
}) => {
  return (
    <footer className={cx(s.footer, newsletter && s.hasNewsletter, className)}>
      <div className={s.glow} aria-hidden="true" />
      <div className={s.grid} aria-hidden="true" />
      <div className={s.inner}>
        {newsletter && (
          <div className={s.newsletter}>
            <div>
              <div className={s.newsletterTitle}>
                {newsletter.title ?? 'Get tonight\'s slate in your inbox.'}
              </div>
              <p className={s.newsletterSub}>
                {newsletter.sub ??
                  'A weekly digest of the network\'s top picks, win-rate movers, and new creators. No spam — unsubscribe anytime.'}
              </p>
            </div>
            <div className={s.newsletterForm}>
              {newsletter.form}
              {newsletter.fine && <div className={s.newsletterFine}>{newsletter.fine}</div>}
            </div>
          </div>
        )}

        <div className={s.top}>
          {brand && (
            <div className={s.brand}>
              {brand}
              {tagline && <div className={s.brandTagline}>{tagline}</div>}
              {social && social.length > 0 && (
                <div className={s.brandSocial}>
                  {social.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      aria-label={item.label}
                      className={s.brandSocialBtn}
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
          {columns && columns.length > 0 && (
            <div className={s.cols}>
              {columns.map((col) => (
                <div key={col.title} className={s.col}>
                  <div className={s.colTitle}>{col.title}</div>
                  <ul className={s.list}>
                    {col.items.map((item) => (
                      <li key={item.label} className={s.listItem}>
                        <a href={item.href} className={s.link}>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {trust && trust.length > 0 && (
          <div className={s.trust}>
            <span className={s.trustLabel}>Trust signals</span>
            <div className={s.trustItems}>
              {trust.map((t, i) => (
                <span key={i} className={s.trustItem}>
                  {t.icon}
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {(bottomLeft || bottomRight) && (
          <div className={s.bottom}>
            <div className={s.bottomLeft}>{bottomLeft}</div>
            <div className={s.bottomRight}>{bottomRight}</div>
          </div>
        )}
      </div>
    </footer>
  );
};
