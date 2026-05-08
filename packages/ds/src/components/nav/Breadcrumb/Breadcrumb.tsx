import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Breadcrumb.module.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav className={cx(s.crumb, className)} aria-label="Breadcrumb">
      <ol className={s.list}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className={s.item}>
              {item.href && !last ? (
                <a href={item.href} className={s.link}>
                  {item.label}
                </a>
              ) : (
                <span className={cx(s.text, last && s.current)} aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <span className={s.sep} aria-hidden="true">·</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
