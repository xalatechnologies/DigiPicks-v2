import React from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import s from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  block?: boolean;
  /** Icon rendered before children — auto-sized to the button size. */
  iconLeft?: IconName;
  /** Icon rendered after children — auto-sized to the button size. */
  iconRight?: IconName;
}

/** Default icon size per button size — keeps trailing/leading icons consistent. */
const ICON_SIZE: Record<ButtonSize, number> = {
  sm: 12,
  md: 13,
  lg: 14,
  xl: 16,
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    iconOnly,
    block,
    iconLeft,
    iconRight,
    className,
    children,
    ...rest
  },
  ref,
) {
  const cls = [
    s.btn,
    s[variant],
    size !== 'md' && s[size],
    iconOnly && s.icon,
    block && s.block,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const iconSize = ICON_SIZE[size];
  return (
    <button ref={ref} className={cls} {...rest}>
      {iconLeft && <Icon name={iconLeft} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
});
