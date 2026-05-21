import React from 'react';
import { cx } from '../../../utils/cx';
import s from './AdminHealthBanner.module.css';

export interface AdminHealthBannerProps {
  title?: string;
  sub: React.ReactNode;
  className?: string;
}

export function AdminHealthBanner({
  title = 'Peak performance',
  sub,
  className,
}: AdminHealthBannerProps) {
  return (
    <article className={cx(s.banner, className)} aria-label={title}>
      <div className={s.copy}>
        <h2 className={s.title}>{title}</h2>
        <p className={s.sub}>{sub}</p>
      </div>
    </article>
  );
}
