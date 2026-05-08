import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Logo.module.css';

export interface LogoProps {
  size?: number;
  showWord?: boolean;
  /** When provided, the logo renders as a clickable button (no Button wrapper needed). */
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** Override the rendered element (e.g. a routing Link). Defaults to 'div' or 'button' based on onClick. */
  as?: React.ElementType;
  className?: string;
  'aria-label'?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 36,
  showWord = false,
  onClick,
  as,
  className,
  'aria-label': ariaLabel,
}) => {
  const cssVars = { '--logo-size': `${size}px` } as React.CSSProperties;
  const clickable = Boolean(onClick) || Boolean(as);
  const Component = (as ?? (onClick ? 'button' : 'div')) as React.ElementType;
  const extraProps =
    Component === 'button'
      ? ({ type: 'button' as const } as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  if (!showWord) {
    return (
      <Component
        className={cx(s.logoMark, clickable && s.clickable, className)}
        style={cssVars}
        aria-label={ariaLabel ?? 'DigiPicks'}
        onClick={onClick}
        {...extraProps}
      >
        DP
      </Component>
    );
  }

  return (
    <Component
      className={cx(s.logo, clickable && s.clickable, className)}
      style={cssVars}
      aria-label={ariaLabel ?? 'DigiPicks · Creator Network'}
      onClick={onClick}
      {...extraProps}
    >
      <span className={s.logoMark} aria-hidden="true">
        DP
      </span>
      <span className={s.logoText}>
        <span className={s.logoName}>DigiPicks</span>
        <span className={s.logoTag}>Creator Network</span>
      </span>
    </Component>
  );
};
