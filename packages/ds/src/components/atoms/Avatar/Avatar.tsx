import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Avatar.module.css';

export interface AvatarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  mono: string;
  color?: string;
  size?: number;
  src?: string;
  alt?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  { mono, color = 'var(--bg-3)', size = 32, src, alt, className, style, ...rest },
  ref,
) {
  const cssVars = {
    '--av-size': `${size}px`,
    '--av-color': color,
    ...style,
  } as React.CSSProperties;

  if (src) {
    return (
      <div ref={ref} className={cx(s.avatar, s.image, className)} style={cssVars} {...rest}>
        <img src={src} alt={alt ?? mono} className={s.img} />
      </div>
    );
  }

  return (
    <div ref={ref} className={cx(s.avatar, className)} style={cssVars} {...rest}>
      <span className={s.mono}>{mono}</span>
    </div>
  );
});
