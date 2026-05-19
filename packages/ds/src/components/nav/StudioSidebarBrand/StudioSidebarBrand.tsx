import React from 'react';
import { cx } from '../../../utils/cx';
import { Logo } from '../../atoms/Logo/Logo';
import s from './StudioSidebarBrand.module.css';

export interface StudioSidebarBrandProps {
  title: string;
  tagline?: string;
  className?: string;
}

export function StudioSidebarBrand({
  title,
  tagline = 'Premium Curator',
  className,
}: StudioSidebarBrandProps) {
  return (
    <div className={cx(s.brand, className)}>
      <Logo size={40} />
      <div>
        <p className={s.title}>{title}</p>
        {tagline ? <p className={s.tagline}>{tagline}</p> : null}
      </div>
    </div>
  );
}
