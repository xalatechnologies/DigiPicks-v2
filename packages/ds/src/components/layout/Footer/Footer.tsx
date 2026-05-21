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
  /** Short label above the tagline (e.g. "Creator network"). */
  brandEyebrow?: React.ReactNode;
  /** Body copy beneath the brand mark. */
  tagline?: React.ReactNode;
  /** Round social icon buttons under the tagline. */
  social?: FooterSocialLink[];
  columns?: FooterColumn[];
  /** Optional newsletter signup band (typically home only). */
  newsletter?: FooterNewsletter;
  /** Trust signals — rendered as a compact inline row in the bottom bar. */
  trust?: FooterTrustItem[];
  bottomLeft?: React.ReactNode;
  bottomCenter?: React.ReactNode;
  bottomRight?: React.ReactNode;
  /** Optional credit line in the bottom bar (e.g. "Developed by …"). */
  credit?: React.ReactNode;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({
  brand,
  brandEyebrow,
  tagline,
  social,
  columns,
  newsletter,
  trust,
  bottomLeft,
  bottomCenter,
  bottomRight,
  credit,
  className,
}) => {
  const showBar =
    bottomLeft || bottomCenter || bottomRight || credit || (trust && trust.length > 0);

  return (
    <footer className={cx(s.footer, newsletter && s.hasNewsletter, className)}>
      <div className={s.inner}>
        {newsletter && (
          <section className={s.newsletter} aria-labelledby="footer-newsletter-title">
            <div className={s.newsletterCopy}>
              <h2 id="footer-newsletter-title" className={s.newsletterTitle}>
                {newsletter.title ?? "Get tonight's slate in your inbox."}
              </h2>
              <p className={s.newsletterSub}>
                {newsletter.sub ??
                  "A weekly digest of the network's top picks, win-rate movers, and new creators."}
              </p>
            </div>
            <div className={s.newsletterForm}>
              {newsletter.form}
              {newsletter.fine && <p className={s.newsletterFine}>{newsletter.fine}</p>}
            </div>
          </section>
        )}

        <div className={s.main}>
          {brand && (
            <div className={s.brand}>
              <div className={s.brandMark}>{brand}</div>
              {brandEyebrow && <p className={s.brandEyebrow}>{brandEyebrow}</p>}
              {tagline && <p className={s.brandTagline}>{tagline}</p>}
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
            <nav className={s.cols} aria-label="Site">
              {columns.map((col) => (
                <div key={col.title} className={s.col}>
                  <h3 className={s.colTitle}>{col.title}</h3>
                  <ul className={s.list}>
                    {col.items.map((item) => (
                      <li key={item.label}>
                        <a href={item.href} className={s.link}>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          )}
        </div>

        {showBar && (
          <div className={s.bar}>
            {(bottomLeft || bottomCenter) && (
              <div className={s.barStart}>
                {bottomLeft && <div className={s.barSlot}>{bottomLeft}</div>}
                {bottomCenter && <div className={s.barSlot}>{bottomCenter}</div>}
              </div>
            )}

            {trust && trust.length > 0 && (
              <ul className={s.trust} aria-label="Platform trust">
                {trust.map((t, i) => (
                  <li key={i} className={s.trustItem}>
                    {t.icon && <span className={s.trustItemIcon}>{t.icon}</span>}
                    <span>{t.label}</span>
                  </li>
                ))}
              </ul>
            )}

            {(bottomRight || credit) && (
              <div className={s.barEnd}>
                {bottomRight && <div className={s.barSlot}>{bottomRight}</div>}
                {credit && <div className={s.credit}>{credit}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </footer>
  );
};
