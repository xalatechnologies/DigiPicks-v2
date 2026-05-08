import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Placeholder.module.css';

export type PlaceholderRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'pill';

export interface PlaceholderProps {
  label?: string;
  height?: number;
  radius?: PlaceholderRadius;
  className?: string;
}

export function Placeholder({
  label = 'image',
  height = 140,
  radius = 'md',
  className,
}: PlaceholderProps) {
  const styleVars = {
    '--ph-height': `${height}px`,
    '--ph-radius': `var(--r-${radius})`,
  } as React.CSSProperties;
  return (
    <div className={cx(s.ph, className)} style={styleVars} role="img" aria-label={label}>
      <span className={s.label}>{label}</span>
    </div>
  );
}
