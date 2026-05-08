import React from 'react';
import { useTheme } from '@digipicks/app-shell';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './ThemeIconButton.module.css';

export interface ThemeIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const ThemeIconButton = React.forwardRef<HTMLButtonElement, ThemeIconButtonProps>(
  function ThemeIconButton({ className, onClick, ...rest }, ref) {
    const { colorScheme, toggleTheme } = useTheme();
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      toggleTheme();
      onClick?.(e);
    };
    return (
      <button
        ref={ref}
        type="button"
        className={cx(s.btn, className)}
        onClick={handleClick}
        aria-label="Toggle theme"
        {...rest}
      >
        <Icon name={colorScheme === 'dark' ? 'sun' : 'moon'} size={18} />
      </button>
    );
  },
);
