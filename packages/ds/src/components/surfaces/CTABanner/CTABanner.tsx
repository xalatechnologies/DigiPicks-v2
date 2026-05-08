import React from 'react';
import { cx } from '../../../utils/cx';
import s from './CTABanner.module.css';

export interface CTABannerProps {
  title: string;
  body?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function CTABanner({ title, body, actions, className }: CTABannerProps) {
  return (
    <section className={cx(s.banner, className)}>
      <div className={s.glow} aria-hidden="true" />
      <div className={s.inner}>
        <h2 className={s.title}>{title}</h2>
        {body && <p className={s.body}>{body}</p>}
        {actions && <div className={s.actions}>{actions}</div>}
      </div>
    </section>
  );
}
