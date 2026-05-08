import React from 'react';
import { useTheme } from '@digipicks/app-shell';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './ThemeToggle.module.css';

export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { colorScheme, setColorScheme } = useTheme();
  return (
    <div className={cx(s.toggle, className)} role="group" aria-label="Theme">
      <button
        type="button"
        className={cx(s.btn, colorScheme === 'dark' && s.on)}
        onClick={() => setColorScheme('dark')}
        aria-pressed={colorScheme === 'dark'}
      >
        <Icon name="moon" size={14} />
        <span>Dark</span>
      </button>
      <button
        type="button"
        className={cx(s.btn, colorScheme === 'light' && s.on)}
        onClick={() => setColorScheme('light')}
        aria-pressed={colorScheme === 'light'}
      >
        <Icon name="sun" size={14} />
        <span>Light</span>
      </button>
    </div>
  );
};
