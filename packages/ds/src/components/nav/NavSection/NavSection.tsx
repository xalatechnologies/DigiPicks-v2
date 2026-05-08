import React from 'react';
import { cx } from '../../../utils/cx';
import s from './NavSection.module.css';

export interface NavSectionProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export const NavSection: React.FC<NavSectionProps> = ({ title, children, className }) => {
  return (
    <div className={cx(s.section, className)}>
      <div className={s.title}>{title}</div>
      <div className={s.items}>{children}</div>
    </div>
  );
};
