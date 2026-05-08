import React from 'react';
import { cx } from '../../../utils/cx';
import s from './NavDivider.module.css';

export interface NavDividerProps {
  className?: string;
}

export const NavDivider: React.FC<NavDividerProps> = ({ className }) => {
  return <div role="separator" aria-orientation="horizontal" className={cx(s.divider, className)} />;
};
